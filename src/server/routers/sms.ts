import { z } from "zod";
import { router, orgProcedure } from "../trpc/init";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";

export const smsRouter = router({
  /**
   * List SMS conversations for the org.
   */
  conversations: orgProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return prisma.smsConversation.findMany({
        where: { orgId: ctx.orgId },
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          },
        },
        orderBy: { lastMessageAt: "desc" },
        take: input?.limit ?? 50,
      });
    }),

  /**
   * Get messages for a specific conversation.
   */
  messages: orgProcedure
    .input(
      z.object({
        contactId: z.string(),
        limit: z.number().min(1).max(200).default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      return prisma.smsMessage.findMany({
        where: { orgId: ctx.orgId, contactId: input.contactId },
        orderBy: { sentAt: "asc" },
        take: input.limit,
      });
    }),

  /**
   * Send an SMS message (outbound).
   */
  send: orgProcedure
    .input(
      z.object({
        contactId: z.string(),
        body: z.string().min(1).max(1600),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify contact exists and has phone
      const contact = await prisma.contact.findFirst({
        where: { id: input.contactId, orgId: ctx.orgId },
        select: { phone: true, id: true },
      });
      if (!contact?.phone) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Contact does not have a phone number",
        });
      }

      // Check TCPA compliance
      const prefs = await prisma.marketingPreference.findUnique({
        where: { contactId: input.contactId },
      });
      if (prefs && !prefs.smsOptIn) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Contact has opted out of SMS",
        });
      }

      // Create SMS record
      const message = await prisma.smsMessage.create({
        data: {
          orgId: ctx.orgId,
          contactId: input.contactId,
          direction: "OUTBOUND",
          body: input.body,
          status: "sent",
        },
      });

      // Upsert conversation
      await prisma.smsConversation.upsert({
        where: { contactId: input.contactId },
        update: { lastMessageAt: new Date(), unreadCount: 0 },
        create: {
          orgId: ctx.orgId,
          contactId: input.contactId,
          lastMessageAt: new Date(),
        },
      });

      // Log activity
      await prisma.contactActivity.create({
        data: {
          contactId: input.contactId,
          type: "sms_sent",
          description: `Outbound SMS: ${input.body.substring(0, 100)}`,
        },
      });

      return message;
    }),

  /**
   * Mark conversation as read.
   */
  markRead: orgProcedure
    .input(z.object({ contactId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.smsConversation.updateMany({
        where: { orgId: ctx.orgId, contactId: input.contactId },
        data: { unreadCount: 0 },
      });
      return { ok: true };
    }),

  /**
   * Get unread count across all conversations.
   */
  unreadTotal: orgProcedure.query(async ({ ctx }) => {
    const result = await prisma.smsConversation.aggregate({
      where: { orgId: ctx.orgId },
      _sum: { unreadCount: true },
    });
    return result._sum.unreadCount ?? 0;
  }),
});
