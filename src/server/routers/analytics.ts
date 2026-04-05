import { z } from "zod";
import { router, orgProcedure } from "../trpc/init";
import { prisma } from "@/lib/prisma";

export const analyticsRouter = router({
  /**
   * Dashboard overview stats.
   */
  overview: orgProcedure.query(async ({ ctx }) => {
    const [
      totalContacts,
      activeContacts,
      totalCampaigns,
      sentCampaigns,
      activeCampaignsSending,
      activeSequences,
      totalSmsMessages,
    ] = await Promise.all([
      prisma.contact.count({ where: { orgId: ctx.orgId } }),
      prisma.contact.count({
        where: { orgId: ctx.orgId, status: "ACTIVE" },
      }),
      prisma.campaign.count({ where: { orgId: ctx.orgId } }),
      prisma.campaign.count({
        where: { orgId: ctx.orgId, status: "SENT" },
      }),
      prisma.campaign.count({
        where: { orgId: ctx.orgId, status: "SENDING" },
      }),
      prisma.sequence.count({
        where: { orgId: ctx.orgId, status: "ACTIVE" },
      }),
      prisma.smsMessage.count({ where: { orgId: ctx.orgId } }),
    ]);

    return {
      totalContacts,
      activeContacts,
      totalCampaigns,
      sentCampaigns,
      activeCampaignsSending,
      activeSequences,
      totalSmsMessages,
    };
  }),

  /**
   * Campaign performance aggregate across all campaigns.
   */
  campaignPerformance: orgProcedure
    .input(
      z
        .object({
          days: z.number().min(1).max(365).default(30),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const since = new Date();
      since.setDate(since.getDate() - (input?.days ?? 30));

      const campaigns = await prisma.campaign.findMany({
        where: {
          orgId: ctx.orgId,
          status: "SENT",
          sentAt: { gte: since },
        },
        select: {
          id: true,
          name: true,
          sentAt: true,
          _count: { select: { messages: true } },
        },
      });

      // Get aggregate message stats
      const [totalSent, totalOpened, totalClicked, totalBounced] =
        await Promise.all([
          prisma.campaignMessage.count({
            where: {
              campaign: { orgId: ctx.orgId, sentAt: { gte: since } },
              status: { not: "QUEUED" },
            },
          }),
          prisma.campaignMessage.count({
            where: {
              campaign: { orgId: ctx.orgId, sentAt: { gte: since } },
              openedAt: { not: null },
            },
          }),
          prisma.campaignMessage.count({
            where: {
              campaign: { orgId: ctx.orgId, sentAt: { gte: since } },
              clickedAt: { not: null },
            },
          }),
          prisma.campaignMessage.count({
            where: {
              campaign: { orgId: ctx.orgId, sentAt: { gte: since } },
              status: "BOUNCED",
            },
          }),
        ]);

      return {
        campaignCount: campaigns.length,
        totalSent,
        totalOpened,
        totalClicked,
        totalBounced,
        openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
        clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
        bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
      };
    }),

  /**
   * Contact growth over time.
   */
  contactGrowth: orgProcedure
    .input(
      z
        .object({
          days: z.number().min(7).max(365).default(30),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const days = input?.days ?? 30;
      const points: Array<{ date: string; count: number }> = [];

      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(23, 59, 59, 999);

        const count = await prisma.contact.count({
          where: {
            orgId: ctx.orgId,
            createdAt: { lte: date },
          },
        });

        points.push({
          date: date.toISOString().split("T")[0],
          count,
        });
      }

      return points;
    }),

  /**
   * Top performing campaigns.
   */
  topCampaigns: orgProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(5) }).optional())
    .query(async ({ ctx, input }) => {
      const campaigns = await prisma.campaign.findMany({
        where: { orgId: ctx.orgId, status: "SENT" },
        orderBy: { sentAt: "desc" },
        take: input?.limit ?? 5,
        select: {
          id: true,
          name: true,
          subject: true,
          sentAt: true,
          stats: true,
          _count: { select: { messages: true } },
        },
      });

      // Enrich with open/click stats
      const enriched = await Promise.all(
        campaigns.map(async (c) => {
          const [opened, clicked] = await Promise.all([
            prisma.campaignMessage.count({
              where: { campaignId: c.id, openedAt: { not: null } },
            }),
            prisma.campaignMessage.count({
              where: { campaignId: c.id, clickedAt: { not: null } },
            }),
          ]);
          const sent = c._count.messages;
          return {
            ...c,
            sent,
            opened,
            clicked,
            openRate: sent > 0 ? (opened / sent) * 100 : 0,
            clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
          };
        })
      );

      return enriched;
    }),

  /**
   * Engagement score distribution.
   */
  engagementDistribution: orgProcedure.query(async ({ ctx }) => {
    const contacts = await prisma.contact.findMany({
      where: { orgId: ctx.orgId, status: "ACTIVE" },
      select: { engagementScore: true },
    });

    let cold = 0,
      warm = 0,
      hot = 0,
      champion = 0;
    for (const c of contacts) {
      if (c.engagementScore >= 50) champion++;
      else if (c.engagementScore >= 20) hot++;
      else if (c.engagementScore >= 5) warm++;
      else cold++;
    }

    return { cold, warm, hot, champion, total: contacts.length };
  }),

  /**
   * Recent activity feed.
   */
  recentActivity: orgProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }).optional())
    .query(async ({ ctx, input }) => {
      const contacts = await prisma.contact.findMany({
        where: { orgId: ctx.orgId },
        select: { id: true },
      });
      const contactIds = contacts.map((c) => c.id);

      if (contactIds.length === 0) return [];

      return prisma.contactActivity.findMany({
        where: { contactId: { in: contactIds } },
        include: {
          contact: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input?.limit ?? 20,
      });
    }),
});
