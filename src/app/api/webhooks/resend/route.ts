import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Webhook handler for Resend email delivery events.
 * Resend sends: delivered, opened, clicked, bounced, complained
 */
export async function POST(request: NextRequest) {
  let body: {
    type: string;
    data: {
      email_id?: string;
      to?: string[];
      created_at?: string;
      click?: { link?: string };
    };
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, data } = body;

  // Find the campaign message by the recipient email
  // In production, you would store the Resend email_id when sending
  if (!data.to?.[0]) {
    return Response.json({ ok: true }); // Nothing to do
  }

  const email = data.to[0];

  // Find the most recent queued/sent message for this email
  const message = await prisma.campaignMessage.findFirst({
    where: {
      contact: { email },
      status: { in: ["QUEUED", "SENT", "DELIVERED", "OPENED"] },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, contactId: true, campaignId: true },
  });

  if (!message) {
    return Response.json({ ok: true });
  }

  const now = new Date();

  switch (type) {
    case "email.delivered":
      await prisma.campaignMessage.update({
        where: { id: message.id },
        data: { status: "DELIVERED", deliveredAt: now },
      });
      break;

    case "email.opened":
      await prisma.campaignMessage.update({
        where: { id: message.id },
        data: { status: "OPENED", openedAt: now },
      });
      // Update engagement score
      await prisma.contact.update({
        where: { id: message.contactId },
        data: { engagementScore: { increment: 1 } },
      });
      // Log activity
      await prisma.contactActivity.create({
        data: {
          contactId: message.contactId,
          type: "email_opened",
          description: "Email opened",
          metadata: { campaignId: message.campaignId },
        },
      });
      break;

    case "email.clicked":
      await prisma.campaignMessage.update({
        where: { id: message.id },
        data: { status: "CLICKED", clickedAt: now },
      });
      // Update engagement score
      await prisma.contact.update({
        where: { id: message.contactId },
        data: { engagementScore: { increment: 3 } },
      });
      // Track link click
      if (data.click?.link) {
        const link = await prisma.campaignLink.findFirst({
          where: { campaignId: message.campaignId, url: data.click.link },
        });
        if (link) {
          await prisma.campaignLink.update({
            where: { id: link.id },
            data: { clickCount: { increment: 1 } },
          });
          await prisma.campaignLinkClick.create({
            data: {
              linkId: link.id,
              contactId: message.contactId,
            },
          });
        }
      }
      // Log activity
      await prisma.contactActivity.create({
        data: {
          contactId: message.contactId,
          type: "email_clicked",
          description: "Email link clicked",
          metadata: {
            campaignId: message.campaignId,
            link: data.click?.link,
          },
        },
      });
      break;

    case "email.bounced":
      await prisma.campaignMessage.update({
        where: { id: message.id },
        data: { status: "BOUNCED", bouncedAt: now },
      });
      // Mark contact as bounced
      await prisma.contact.update({
        where: { id: message.contactId },
        data: { status: "BOUNCED" },
      });
      break;

    case "email.complained":
      await prisma.campaignMessage.update({
        where: { id: message.id },
        data: { status: "UNSUBSCRIBED" },
      });
      // Unsubscribe contact
      await prisma.contact.update({
        where: { id: message.contactId },
        data: { status: "UNSUBSCRIBED" },
      });
      await prisma.marketingPreference.upsert({
        where: { contactId: message.contactId },
        update: { emailOptIn: false },
        create: { contactId: message.contactId, emailOptIn: false },
      });
      break;
  }

  return Response.json({ ok: true });
}
