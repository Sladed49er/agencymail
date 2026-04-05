import { z } from "zod";
import { router, orgProcedure } from "../trpc/init";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";

export const campaignsRouter = router({
  list: orgProcedure
    .input(
      z
        .object({
          status: z
            .enum(["DRAFT", "SCHEDULED", "SENDING", "SENT", "CANCELLED"])
            .optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { orgId: ctx.orgId };
      if (input?.status) where.status = input.status;

      return prisma.campaign.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: input?.limit ?? 50,
        include: {
          segment: { select: { name: true, contactCount: true } },
          _count: { select: { messages: true } },
        },
      });
    }),

  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const campaign = await prisma.campaign.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
        include: {
          segment: true,
          messages: {
            include: {
              contact: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
          },
          links: {
            include: { _count: { select: { clicks: true } } },
          },
        },
      });
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });
      return campaign;
    }),

  create: orgProcedure
    .input(
      z.object({
        name: z.string().min(1),
        subject: z.string().optional(),
        body: z.string().optional(),
        segmentId: z.string().optional(),
        scheduledAt: z.string().optional(),
        abTestEnabled: z.boolean().optional(),
        abSubjectB: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.campaign.create({
        data: {
          orgId: ctx.orgId,
          name: input.name,
          subject: input.subject,
          body: input.body,
          segmentId: input.segmentId || null,
          scheduledAt: input.scheduledAt
            ? new Date(input.scheduledAt)
            : undefined,
          status: input.scheduledAt ? "SCHEDULED" : "DRAFT",
          abTestEnabled: input.abTestEnabled ?? false,
          abSubjectB: input.abSubjectB,
        },
      });
    }),

  update: orgProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        subject: z.string().optional(),
        body: z.string().optional(),
        segmentId: z.string().optional(),
        scheduledAt: z.string().optional(),
        status: z
          .enum(["DRAFT", "SCHEDULED", "CANCELLED"])
          .optional(),
        abTestEnabled: z.boolean().optional(),
        abSubjectB: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return prisma.campaign.update({
        where: { id, orgId: ctx.orgId },
        data: {
          ...data,
          scheduledAt: data.scheduledAt
            ? new Date(data.scheduledAt)
            : undefined,
        },
      });
    }),

  delete: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.campaign.delete({
        where: { id: input.id, orgId: ctx.orgId },
      });
      return { ok: true };
    }),

  /**
   * Get aggregated stats for a campaign.
   */
  getStats: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const campaign = await prisma.campaign.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
        select: { id: true },
      });
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });

      const [sent, delivered, opened, clicked, bounced, unsubscribed] =
        await Promise.all([
          prisma.campaignMessage.count({
            where: {
              campaignId: input.id,
              status: { not: "QUEUED" },
            },
          }),
          prisma.campaignMessage.count({
            where: {
              campaignId: input.id,
              status: { in: ["DELIVERED", "OPENED", "CLICKED"] },
            },
          }),
          prisma.campaignMessage.count({
            where: { campaignId: input.id, openedAt: { not: null } },
          }),
          prisma.campaignMessage.count({
            where: { campaignId: input.id, clickedAt: { not: null } },
          }),
          prisma.campaignMessage.count({
            where: { campaignId: input.id, status: "BOUNCED" },
          }),
          prisma.campaignMessage.count({
            where: { campaignId: input.id, status: "UNSUBSCRIBED" },
          }),
        ]);

      return {
        sent,
        delivered,
        opened,
        clicked,
        bounced,
        unsubscribed,
        openRate: sent > 0 ? (opened / sent) * 100 : 0,
        clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
        bounceRate: sent > 0 ? (bounced / sent) * 100 : 0,
      };
    }),
});
