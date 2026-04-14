import { TRPCError } from "@trpc/server";
import { db, follows, profiles } from "@wheresmydorm/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getProfileNamePartsFromUser } from "../lib/profile";
import { protectedProcedure, router } from "../index";

const roleInputSchema = z.object({
  role: z.enum(["finder", "lister"]),
});
const followInputSchema = z.object({
  userId: z.string().uuid(),
});
const updateProfileInputSchema = z.object({
  avatarUrl: z.string().url().nullable().optional(),
  bio: z.string().trim().max(500).nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().trim().max(40).nullable().optional(),
  finderBudgetMax: z.string().trim().max(40).nullable().optional(),
  finderBudgetMin: z.string().trim().max(40).nullable().optional(),
  finderPropertyTypes: z.array(z.string().trim().min(1)).max(12).optional(),
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().max(100).nullable().optional(),
  listerPropertyCount: z.number().int().min(0).nullable().optional(),
  preferredArea: z.string().trim().max(120).nullable().optional(),
  propertyTypes: z.array(z.string().trim().min(1)).max(12).optional(),
});
const notificationTokenInputSchema = z.object({
  fcmToken: z.string().trim().min(1).max(500).nullable(),
});
const deleteAccountInputSchema = z.object({
  confirm: z.literal(true),
});

export const profilesRouter = router({
  sync: protectedProcedure.mutation(async ({ ctx }) => {
    const { firstName, lastName } = getProfileNamePartsFromUser(ctx.user);
    const avatarUrl =
      (ctx.user.user_metadata.avatar_url as string | undefined) ?? null;

    const [profile] = await db
      .insert(profiles)
      .values({
        id: ctx.userId,
        firstName,
        lastName,
        avatarUrl,
      })
      .onConflictDoUpdate({
        target: profiles.id,
        set: {
          firstName,
          lastName,
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

  update: protectedProcedure
    .input(updateProfileInputSchema)
    .mutation(async ({ ctx, input }) => {
      const updates: Partial<typeof profiles.$inferInsert> = {};

      if (input.avatarUrl !== undefined) updates.avatarUrl = input.avatarUrl;
      if (input.bio !== undefined) updates.bio = input.bio;
      if (input.contactEmail !== undefined) updates.contactEmail = input.contactEmail;
      if (input.contactPhone !== undefined) updates.contactPhone = input.contactPhone;
      if (input.finderBudgetMax !== undefined) updates.finderBudgetMax = input.finderBudgetMax;
      if (input.finderBudgetMin !== undefined) updates.finderBudgetMin = input.finderBudgetMin;
      if (input.finderPropertyTypes !== undefined) updates.finderPropertyTypes = input.finderPropertyTypes;
      if (input.firstName !== undefined) updates.firstName = input.firstName;
      if (input.lastName !== undefined) updates.lastName = input.lastName;
      if (input.listerPropertyCount !== undefined) updates.listerPropertyCount = input.listerPropertyCount;
      if (input.preferredArea !== undefined) updates.preferredArea = input.preferredArea;
      if (input.propertyTypes !== undefined) updates.propertyTypes = input.propertyTypes;

      const [profile] = await db
        .update(profiles)
        .set(updates)
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

  setNotificationToken: protectedProcedure
    .input(notificationTokenInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [profile] = await db
        .update(profiles)
        .set({ fcmToken: input.fcmToken })
        .where(eq(profiles.id, ctx.userId))
        .returning();

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Profile not found for the current user.",
        });
      }

      return { success: true };
    }),

  deleteAccount: protectedProcedure
    .input(deleteAccountInputSchema)
    .mutation(async ({ ctx }) => {
      const { error } = await ctx.supabaseAdmin.auth.admin.deleteUser(ctx.userId);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Account deletion failed.",
          cause: error,
        });
      }

      return { success: true };
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
