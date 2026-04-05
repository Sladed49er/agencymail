import { z } from "zod";
import { router, orgProcedure } from "../trpc/init";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";

export const contactsRouter = router({
  list: orgProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          status: z.enum(["ACTIVE", "UNSUBSCRIBED", "BOUNCED"]).optional(),
          policyType: z.string().optional(),
          tag: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { orgId: ctx.orgId };

      if (input?.status) where.status = input.status;
      if (input?.policyType) where.policyType = input.policyType;
      if (input?.tag) where.tags = { has: input.tag };
      if (input?.search) {
        where.OR = [
          { firstName: { contains: input.search, mode: "insensitive" } },
          { lastName: { contains: input.search, mode: "insensitive" } },
          { email: { contains: input.search, mode: "insensitive" } },
          { phone: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const contacts = await prisma.contact.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: (input?.limit ?? 50) + 1,
        ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });

      let nextCursor: string | undefined;
      if (contacts.length > (input?.limit ?? 50)) {
        const next = contacts.pop();
        nextCursor = next?.id;
      }

      return { contacts, nextCursor };
    }),

  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const contact = await prisma.contact.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
        include: {
          activities: { orderBy: { createdAt: "desc" }, take: 50 },
          sequenceEnrollments: {
            include: { sequence: { select: { name: true } } },
          },
          marketingPreference: true,
          campaignMessages: {
            include: { campaign: { select: { name: true, subject: true } } },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      });
      if (!contact) throw new TRPCError({ code: "NOT_FOUND" });
      return contact;
    }),

  create: orgProcedure
    .input(
      z.object({
        email: z.string().email().optional(),
        phone: z.string().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zip: z.string().optional(),
        policyType: z.string().optional(),
        carrier: z.string().optional(),
        renewalDate: z.string().optional(),
        agentName: z.string().optional(),
        tags: z.array(z.string()).optional(),
        source: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const contact = await prisma.contact.create({
        data: {
          orgId: ctx.orgId,
          ...input,
          renewalDate: input.renewalDate
            ? new Date(input.renewalDate)
            : undefined,
          tags: input.tags ?? [],
        },
      });

      // Create marketing preference
      await prisma.marketingPreference.create({
        data: { contactId: contact.id },
      });

      // Log activity
      await prisma.contactActivity.create({
        data: {
          contactId: contact.id,
          type: "contact_created",
          description: `Contact created via ${input.source || "manual"}`,
        },
      });

      return contact;
    }),

  update: orgProcedure
    .input(
      z.object({
        id: z.string(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zip: z.string().optional(),
        policyType: z.string().optional(),
        carrier: z.string().optional(),
        renewalDate: z.string().optional(),
        agentName: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return prisma.contact.update({
        where: { id, orgId: ctx.orgId },
        data: {
          ...data,
          renewalDate: data.renewalDate
            ? new Date(data.renewalDate)
            : undefined,
        },
      });
    }),

  delete: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.contact.delete({
        where: { id: input.id, orgId: ctx.orgId },
      });
      return { ok: true };
    }),

  bulkTag: orgProcedure
    .input(
      z.object({
        contactIds: z.array(z.string()),
        tag: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const contacts = await prisma.contact.findMany({
        where: { id: { in: input.contactIds }, orgId: ctx.orgId },
        select: { id: true, tags: true },
      });

      for (const contact of contacts) {
        if (!contact.tags.includes(input.tag)) {
          await prisma.contact.update({
            where: { id: contact.id },
            data: { tags: [...contact.tags, input.tag] },
          });
        }
      }

      return { updated: contacts.length };
    }),

  bulkDelete: orgProcedure
    .input(z.object({ contactIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const result = await prisma.contact.deleteMany({
        where: { id: { in: input.contactIds }, orgId: ctx.orgId },
      });
      return { deleted: result.count };
    }),

  getTags: orgProcedure.query(async ({ ctx }) => {
    const contacts = await prisma.contact.findMany({
      where: { orgId: ctx.orgId },
      select: { tags: true },
    });
    const allTags = contacts.flatMap((c) => c.tags);
    return [...new Set(allTags)].sort();
  }),

  stats: orgProcedure.query(async ({ ctx }) => {
    const [total, active, unsubscribed, bounced] = await Promise.all([
      prisma.contact.count({ where: { orgId: ctx.orgId } }),
      prisma.contact.count({
        where: { orgId: ctx.orgId, status: "ACTIVE" },
      }),
      prisma.contact.count({
        where: { orgId: ctx.orgId, status: "UNSUBSCRIBED" },
      }),
      prisma.contact.count({
        where: { orgId: ctx.orgId, status: "BOUNCED" },
      }),
    ]);
    return { total, active, unsubscribed, bounced };
  }),
});
