import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Webhook for incoming SMS from CallIntel.
 * Expected payload: { from: string, body: string, orgId?: string }
 */
export async function POST(request: NextRequest) {
  let body: { from: string; body: string; orgId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.from || !body.body) {
    return Response.json(
      { error: "from and body are required" },
      { status: 400 }
    );
  }

  // Normalize phone number
  const phone = body.from.replace(/\D/g, "");

  // Find contact by phone number
  const contact = await prisma.contact.findFirst({
    where: {
      phone: { contains: phone.slice(-10) },
      ...(body.orgId ? { org: { clerkOrgId: body.orgId } } : {}),
    },
    select: { id: true, orgId: true },
  });

  if (!contact) {
    return Response.json(
      { error: "Contact not found for this phone number" },
      { status: 404 }
    );
  }

  // Create SMS record
  await prisma.smsMessage.create({
    data: {
      orgId: contact.orgId,
      contactId: contact.id,
      direction: "INBOUND",
      body: body.body,
      status: "received",
    },
  });

  // Upsert conversation
  await prisma.smsConversation.upsert({
    where: { contactId: contact.id },
    update: {
      lastMessageAt: new Date(),
      unreadCount: { increment: 1 },
    },
    create: {
      orgId: contact.orgId,
      contactId: contact.id,
      lastMessageAt: new Date(),
      unreadCount: 1,
    },
  });

  // Log activity
  await prisma.contactActivity.create({
    data: {
      contactId: contact.id,
      type: "sms_received",
      description: `Inbound SMS: ${body.body.substring(0, 100)}`,
    },
  });

  // Update engagement score
  await prisma.contact.update({
    where: { id: contact.id },
    data: { engagementScore: { increment: 5 } },
  });

  return Response.json({ success: true, contactId: contact.id });
}
