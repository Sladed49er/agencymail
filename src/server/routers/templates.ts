import { z } from "zod";
import { router, orgProcedure } from "../trpc/init";
import { prisma } from "@/lib/prisma";
import { SYSTEM_TEMPLATES } from "@/modules/marketing";

export const templatesRouter = router({
  list: orgProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
          search: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        OR: [{ orgId: ctx.orgId }, { isSystem: true, orgId: null }],
      };

      if (input?.category) {
        where.category = input.category;
      }
      if (input?.search) {
        where.name = { contains: input.search, mode: "insensitive" };
      }

      return prisma.emailTemplate.findMany({
        where,
        orderBy: [{ isSystem: "desc" }, { createdAt: "desc" }],
        take: input?.limit ?? 50,
      });
    }),

  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return prisma.emailTemplate.findFirst({
        where: {
          id: input.id,
          OR: [{ orgId: ctx.orgId }, { isSystem: true, orgId: null }],
        },
      });
    }),

  create: orgProcedure
    .input(
      z.object({
        name: z.string().min(1),
        subject: z.string().min(1),
        body: z.string().min(1),
        category: z
          .enum([
            "RENEWAL",
            "BIRTHDAY",
            "HOLIDAY",
            "WELCOME",
            "CROSS_SELL",
            "REFERRAL",
            "REVIEW",
            "CLAIM",
            "GENERAL",
          ])
          .default("GENERAL"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.emailTemplate.create({
        data: {
          orgId: ctx.orgId,
          name: input.name,
          subject: input.subject,
          body: input.body,
          category: input.category,
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
        category: z
          .enum([
            "RENEWAL",
            "BIRTHDAY",
            "HOLIDAY",
            "WELCOME",
            "CROSS_SELL",
            "REFERRAL",
            "REVIEW",
            "CLAIM",
            "GENERAL",
          ])
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return prisma.emailTemplate.update({
        where: { id, orgId: ctx.orgId },
        data,
      });
    }),

  duplicate: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const original = await prisma.emailTemplate.findFirst({
        where: {
          id: input.id,
          OR: [{ orgId: ctx.orgId }, { isSystem: true, orgId: null }],
        },
      });
      if (!original) throw new Error("Template not found");

      return prisma.emailTemplate.create({
        data: {
          orgId: ctx.orgId,
          name: `${original.name} (Copy)`,
          subject: original.subject,
          body: original.body,
          category: original.category,
        },
      });
    }),

  delete: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.emailTemplate.delete({
        where: { id: input.id, orgId: ctx.orgId },
      });
      return { ok: true };
    }),

  /**
   * Seed system templates for the org (if not already seeded globally).
   */
  seedSystem: orgProcedure.mutation(async () => {
    const existing = await prisma.emailTemplate.findFirst({
      where: { isSystem: true, orgId: null },
    });
    if (existing) return { seeded: 0, message: "System templates already exist" };

    const values = SYSTEM_TEMPLATES.map((t) => ({
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
    }));

    await prisma.emailTemplate.createMany({ data: values });
    return { seeded: values.length };
  }),
});
