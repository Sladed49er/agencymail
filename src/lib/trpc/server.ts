import "server-only";
import { createCallerFactory } from "@/server/trpc/init";
import { appRouter } from "@/server/routers/_app";
import { createContext } from "@/server/trpc/init";

const createCaller = createCallerFactory(appRouter);

export async function createServerCaller() {
  const ctx = await createContext();
  return createCaller(ctx);
}
