import { TRPCError } from "@trpc/server";
import { db, follows, profiles } from "@wheresmydorm/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index.js";

const roleInputSchema = z.object({
  role: z.enum(["finder", "lister"]),
});
const followInputSchema = z.object({
  userId: z.string().uuid(),
});

export const profilesRouter = router({
  sync: protectedProcedure.mutation(async ({ ctx }) => {
    const fallbackName = ctx.user.email?.split("@")[0] ?? "WheresMyDorm user";
    const displayName =
      (ctx.user.user_metadata.full_name as string | undefined) ??
      (ctx.user.user_metadata.name as string | undefined) ??
      fallbackName;
    const avatarUrl =
      (ctx.user.user_metadata.avatar_url as string | undefined) ?? null;

    const [profile] = await db
      .insert(profiles)
      .values({
        id: ctx.userId,
        displayName,
        avatarUrl,
      })
      .onConflictDoUpdate({
        target: profiles.id,
        set: {
          displayName,
          avatarUrl,
        },
      })
      .returning();

    return profile;
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, ctx.userId),
    });

    if (!profile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Profile not found for the current user.",
      });
    }

    return profile;
  }),

  setRole: protectedProcedure
    .input(roleInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [profile] = await db
        .update(profiles)
        .set({ role: input.role })
        .where(eq(profiles.id, ctx.userId))
        .returning();

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Profile not found for the current user.",
        });
      }

      return profile;
    }),

  toggleFollow: protectedProcedure
    .input(followInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot follow yourself.",
        });
      }

      const existingFollow = await db.query.follows.findFirst({
        where: and(
          eq(follows.followerId, ctx.userId),
          eq(follows.followingId, input.userId),
        ),
      });

      if (existingFollow) {
        await db
          .delete(follows)
          .where(
            and(
              eq(follows.followerId, ctx.userId),
              eq(follows.followingId, input.userId),
            ),
          );

        return { following: false };
      }

      await db.insert(follows).values({
        followerId: ctx.userId,
        followingId: input.userId,
      });

      return { following: true };
    }),
});
