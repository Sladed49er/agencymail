import { z } from "zod";
import { router, orgProcedure, protectedProcedure } from "../trpc/init";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { randomBytes, createHash } from "crypto";

export const settingsRouter = router({
  /**
   * Get current org settings.
   */
  getOrg: orgProcedure.query(async ({ ctx }) => {
    return prisma.organization.findFirst({
      where: { id: ctx.orgId },
      select: {
        id: true,
        name: true,
        agencyName: true,
        agencyPhone: true,
        website: true,
        logo: true,
        senderEmail: true,
        senderName: true,
        settings: true,
      },
    });
  }),

  /**
   * Update org settings.
   */
  updateOrg: orgProcedure
    .input(
      z.object({
        name: z.string().optional(),
        agencyName: z.string().optional(),
        agencyPhone: z.string().optional(),
        website: z.string().optional(),
        logo: z.string().optional(),
        senderEmail: z.string().email().optional(),
        senderName: z.string().optional(),
        settings: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.organization.update({
        where: { id: ctx.orgId },
        data: input,
      });
    }),

  /**
   * Initialize an organization from Clerk org ID.
   */
  initOrg: protectedProcedure
    .input(
      z.object({
        clerkOrgId: z.string(),
        name: z.string(),
        agencyName: z.string().optional(),
        senderEmail: z.string().email().optional(),
        senderName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.organization.findUnique({
        where: { clerkOrgId: input.clerkOrgId },
      });
      if (existing) return existing;

      const org = await prisma.organization.create({
        data: {
          clerkOrgId: input.clerkOrgId,
          name: input.name,
          agencyName: input.agencyName || input.name,
          senderEmail: input.senderEmail,
          senderName: input.senderName,
        },
      });

      // Create user record
      await prisma.user.create({
        data: {
          clerkUserId: ctx.userId,
          orgId: org.id,
          email: "",
          role: "admin",
        },
      });

      // Seed system templates if needed
      const existingTemplates = await prisma.emailTemplate.findFirst({
        where: { isSystem: true, orgId: null },
      });
      if (!existingTemplates) {
        const { SYSTEM_TEMPLATES } = await import("@/modules/marketing");
        await prisma.emailTemplate.createMany({
          data: SYSTEM_TEMPLATES.map((t) => ({
            name: t.name,
            subject: t.subject,
            body: t.body,
            category: t.category as
              | "RENEWAL"
              | "BIRTHDAY"
              | "HOLIDAY"
              | "WELCOME"
              | "CROSS_SELL"
              | "REFERRAL"
              | "REVIEW"
              | "CLAIM"
              | "GENERAL",
            isSystem: true,
            orgId: null,
          })),
        });
      }

      return org;
    }),

  // ── API Keys ───────────────────────────────────────────────

  listApiKeys: orgProcedure.query(async ({ ctx }) => {
    return prisma.apiKey.findMany({
      where: { orgId: ctx.orgId },
      select: {
        id: true,
        name: true,
        prefix: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  createApiKey: orgProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const rawKey = `am_${randomBytes(32).toString("hex")}`;
      const keyHash = createHash("sha256").update(rawKey).digest("hex");
      const prefix = rawKey.substring(0, 10);

      await prisma.apiKey.create({
        data: {
          orgId: ctx.orgId,
          name: input.name,
          keyHash,
          prefix,
        },
      });

      // Return the raw key only once
      return { key: rawKey, prefix };
    }),

  deleteApiKey: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const key = await prisma.apiKey.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
      });
      if (!key) throw new TRPCError({ code: "NOT_FOUND" });

      await prisma.apiKey.delete({ where: { id: input.id } });
      return { ok: true };
    }),

  // ── Data Sources ───────────────────────────────────────────

  listDataSources: orgProcedure.query(async ({ ctx }) => {
    return prisma.dataSource.findMany({
      where: { orgId: ctx.orgId },
      orderBy: { createdAt: "desc" },
    });
  }),
});
