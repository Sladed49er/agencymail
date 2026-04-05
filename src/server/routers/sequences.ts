import { z } from "zod";
import { router, orgProcedure } from "../trpc/init";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";

const stepSchema = z.object({
  type: z.enum([
    "SEND_EMAIL",
    "SEND_SMS",
    "WAIT",
    "CONDITION",
    "ADD_TAG",
    "CREATE_TASK",
  ]),
  config: z.record(z.unknown()),
});

export const sequencesRouter = router({
  list: orgProcedure
    .input(
      z
        .object({
          status: z.enum(["DRAFT", "ACTIVE", "PAUSED"]).optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { orgId: ctx.orgId };
      if (input?.status) where.status = input.status;

      return prisma.sequence.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: input?.limit ?? 50,
        include: {
          steps: { orderBy: { order: "asc" } },
          _count: { select: { enrollments: true } },
        },
      });
    }),

  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const sequence = await prisma.sequence.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
        include: {
          steps: { orderBy: { order: "asc" } },
          enrollments: {
            include: {
              contact: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
            orderBy: { enrolledAt: "desc" },
            take: 50,
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
      });
      if (!sequence) throw new TRPCError({ code: "NOT_FOUND" });
      return sequence;
    }),

  create: orgProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        triggerType: z.string(),
        steps: z.array(stepSchema),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.sequence.create({
        data: {
          orgId: ctx.orgId,
          name: input.name,
          description: input.description,
          triggerType: input.triggerType,
          steps: {
            create: input.steps.map((step, index) => ({
              order: index,
              type: step.type,
              config: step.config,
            })),
          },
        },
        include: { steps: true },
      });
    }),

  update: orgProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        triggerType: z.string().optional(),
        status: z.enum(["DRAFT", "ACTIVE", "PAUSED"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return prisma.sequence.update({
        where: { id, orgId: ctx.orgId },
        data,
      });
    }),

  updateSteps: orgProcedure
    .input(
      z.object({
        sequenceId: z.string(),
        steps: z.array(stepSchema),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const seq = await prisma.sequence.findFirst({
        where: { id: input.sequenceId, orgId: ctx.orgId },
      });
      if (!seq) throw new TRPCError({ code: "NOT_FOUND" });

      // Delete existing steps and recreate
      await prisma.sequenceStep.deleteMany({
        where: { sequenceId: input.sequenceId },
      });

      await prisma.sequenceStep.createMany({
        data: input.steps.map((step, index) => ({
          sequenceId: input.sequenceId,
          order: index,
          type: step.type,
          config: step.config,
        })),
      });

      return prisma.sequence.findFirst({
        where: { id: input.sequenceId },
        include: { steps: { orderBy: { order: "asc" } } },
      });
    }),

  delete: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.sequence.delete({
        where: { id: input.id, orgId: ctx.orgId },
      });
      return { ok: true };
    }),

  /**
   * Enroll a contact in a sequence.
   */
  enroll: orgProcedure
    .input(
      z.object({
        sequenceId: z.string(),
        contactId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify sequence is active and owned
      const seq = await prisma.sequence.findFirst({
        where: { id: input.sequenceId, orgId: ctx.orgId, status: "ACTIVE" },
      });
      if (!seq)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Sequence not found or not active",
        });

      // Check not already enrolled
      const existing = await prisma.sequenceEnrollment.findFirst({
        where: {
          sequenceId: input.sequenceId,
          contactId: input.contactId,
          status: "ACTIVE",
        },
      });
      if (existing)
        throw new TRPCError({
          code: "CONFLICT",
          message: "Contact already enrolled",
        });

      const enrollment = await prisma.sequenceEnrollment.create({
        data: {
          sequenceId: input.sequenceId,
          contactId: input.contactId,
        },
      });

      // Log activity
      await prisma.contactActivity.create({
        data: {
          contactId: input.contactId,
          type: "enrolled_sequence",
          description: `Enrolled in sequence: ${seq.name}`,
          metadata: { sequenceId: seq.id },
        },
      });

      return enrollment;
    }),

  /**
   * Get enrollment stats for a sequence.
   */
  enrollmentStats: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const seq = await prisma.sequence.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
      });
      if (!seq) throw new TRPCError({ code: "NOT_FOUND" });

      const [active, completed, paused, exited] = await Promise.all([
        prisma.sequenceEnrollment.count({
          where: { sequenceId: input.id, status: "ACTIVE" },
        }),
        prisma.sequenceEnrollment.count({
          where: { sequenceId: input.id, status: "COMPLETED" },
        }),
        prisma.sequenceEnrollment.count({
          where: { sequenceId: input.id, status: "PAUSED" },
        }),
        prisma.sequenceEnrollment.count({
          where: { sequenceId: input.id, status: "EXITED" },
        }),
      ]);

      const total = active + completed + paused + exited;
      return {
        total,
        active,
        completed,
        paused,
        exited,
        completionRate: total > 0 ? (completed / total) * 100 : 0,
      };
    }),
});
