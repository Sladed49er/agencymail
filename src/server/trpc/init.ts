import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export interface Context {
  userId: string | null;
  orgId: string | null;
  dbOrgId: string | null;
}

export async function createContext(): Promise<Context> {
  const { userId, orgId } = await auth();

  let dbOrgId: string | null = null;
  if (orgId) {
    const org = await prisma.organization.findUnique({
      where: { clerkOrgId: orgId },
      select: { id: true },
    });
    dbOrgId = org?.id ?? null;
  }

  return { userId, orgId, dbOrgId };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

/**
 * Protected procedure - requires authentication.
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: { ...ctx, userId: ctx.userId },
  });
});

/**
 * Org procedure - requires authentication + active organization.
 */
export const orgProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (!ctx.dbOrgId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No organization selected",
    });
  }
  return next({
    ctx: { ...ctx, userId: ctx.userId, orgId: ctx.dbOrgId },
  });
});
