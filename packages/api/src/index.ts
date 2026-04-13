import { initTRPC, TRPCError } from "@trpc/server";

import type { Context } from "./context";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

// Protected — throws UNAUTHORIZED if no valid session
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user || !ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      user:   ctx.user,
      userId: ctx.userId,
    },
  });
});

// Admin — throws FORBIDDEN if the authenticated user is not an admin
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only admins can access this resource.",
    });
  }
  return next({ ctx });
});
