import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Webhook handler for CallIntel call events.
 * Logs inbound/outbound calls as contact activity and updates engagement scores.
 */
export async function POST(request: NextRequest) {
  // Optionally verify webhook secret
  const secret = request.headers.get("x-webhook-secret");
  if (
    process.env.CALLINTEL_WEBHOOK_SECRET &&
    secret !== process.env.CALLINTEL_WEBHOOK_SECRET
  ) {
    return Response.json({ error: "Invalid webhook secret" }, { status: 401 });
  }

  let body: {
    type: string; // call_started, call_completed, call_missed
    phone: string;
    direction: "inbound" | "outbound";
    duration?: number;
    agentName?: string;
    orgId?: string;
    metadata?: Record<string, unknown>;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.phone) {
    return Response.json({ error: "phone is required" }, { status: 400 });
  }

  // Normalize phone
  const phone = body.phone.replace(/\D/g, "");

  // Find contact
  const contact = await prisma.contact.findFirst({
    where: {
      phone: { contains: phone.slice(-10) },
      ...(body.orgId ? { org: { clerkOrgId: body.orgId } } : {}),
    },
    select: { id: true, orgId: true },
  });

  if (!contact) {
    return Response.json({ ok: true, matched: false });
  }

  const activityType =
    body.direction === "inbound" ? "call_inbound" : "call_outbound";

  // Log activity
  await prisma.contactActivity.create({
    data: {
      contactId: contact.id,
      type: activityType,
      description: `${body.direction === "inbound" ? "Inbound" : "Outbound"} call${
        body.duration ? ` (${Math.round(body.duration / 60)}min)` : ""
      }${body.agentName ? ` with ${body.agentName}` : ""}`,
      metadata: {
        type: body.type,
        direction: body.direction,
        duration: body.duration,
        agentName: body.agentName,
        ...body.metadata,
      },
    },
  });

  // Update engagement score for inbound calls
  if (body.direction === "inbound") {
    await prisma.contact.update({
      where: { id: contact.id },
      data: { engagementScore: { increment: 5 } },
    });
  }

  return Response.json({ ok: true, matched: true, contactId: contact.id });
}
