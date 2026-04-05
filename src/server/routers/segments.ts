import { z } from "zod";
import { router, orgProcedure } from "../trpc/init";
import { prisma } from "@/lib/prisma";

const filterSchema = z.object({
  field: z.string(),
  operator: z.enum(["eq", "neq", "contains", "gt", "lt", "has"]),
  value: z.string(),
});

export const segmentsRouter = router({
  list: orgProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }).optional())
    .query(async ({ ctx, input }) => {
      return prisma.contactSegment.findMany({
        where: { orgId: ctx.orgId },
        orderBy: { createdAt: "desc" },
        take: input?.limit ?? 50,
      });
    }),

  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return prisma.contactSegment.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
      });
    }),

  create: orgProcedure
    .input(
      z.object({
        name: z.string().min(1),
        filters: z.array(filterSchema),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Count matching contacts
      const contactCount = await countMatchingContacts(
        ctx.orgId,
        input.filters
      );

      return prisma.contactSegment.create({
        data: {
          orgId: ctx.orgId,
          name: input.name,
          filters: input.filters,
          contactCount,
        },
      });
    }),

  update: orgProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        filters: z.array(filterSchema).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      let contactCount: number | undefined;
      if (data.filters) {
        contactCount = await countMatchingContacts(ctx.orgId, data.filters);
      }
      return prisma.contactSegment.update({
        where: { id, orgId: ctx.orgId },
        data: {
          ...data,
          ...(contactCount !== undefined ? { contactCount } : {}),
        },
      });
    }),

  delete: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.contactSegment.delete({
        where: { id: input.id, orgId: ctx.orgId },
      });
      return { ok: true };
    }),

  /**
   * Preview contacts matching filter criteria.
   */
  preview: orgProcedure
    .input(z.object({ filters: z.array(filterSchema) }))
    .query(async ({ ctx, input }) => {
      const where = buildContactWhere(ctx.orgId, input.filters);
      const [contacts, total] = await Promise.all([
        prisma.contact.findMany({
          where,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            policyType: true,
            status: true,
          },
          take: 50,
        }),
        prisma.contact.count({ where }),
      ]);
      return { contacts, total };
    }),

  /**
   * Refresh contact count for a segment.
   */
  refreshCount: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const segment = await prisma.contactSegment.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
      });
      if (!segment) throw new Error("Segment not found");

      const filters = (segment.filters as Array<{ field: string; operator: string; value: string }>) || [];
      const contactCount = await countMatchingContacts(ctx.orgId, filters);

      return prisma.contactSegment.update({
        where: { id: input.id },
        data: { contactCount },
      });
    }),
});

function buildContactWhere(
  orgId: string,
  filters: Array<{ field: string; operator: string; value: string }>
): Record<string, unknown> {
  const where: Record<string, unknown> = {
    orgId,
    status: "ACTIVE",
  };

  for (const filter of filters) {
    switch (filter.operator) {
      case "eq":
        where[filter.field] = filter.value;
        break;
      case "neq":
        where[filter.field] = { not: filter.value };
        break;
      case "contains":
        where[filter.field] = {
          contains: filter.value,
          mode: "insensitive",
        };
        break;
      case "has":
        if (filter.field === "tags") {
          where.tags = { has: filter.value };
        }
        break;
    }
  }

  return where;
}

async function countMatchingContacts(
  orgId: string,
  filters: Array<{ field: string; operator: string; value: string }>
): Promise<number> {
  const where = buildContactWhere(orgId, filters);
  return prisma.contact.count({ where });
}
