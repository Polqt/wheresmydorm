import { TRPCError } from "@trpc/server";
import {
  conversationReports,
  db,
  listings,
  postReports,
  posts,
  profiles,
} from "@wheresmydorm/db";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure, router } from "../index";
import { moderationStatusValues } from "../lib/moderation";

// ---------------------------------------------------------------------------
// Input schemas
// ---------------------------------------------------------------------------

const moderatePostReportSchema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(moderationStatusValues),
  removePost: z.boolean().optional(),
});

const moderateConversationReportSchema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(moderationStatusValues),
});

const userIdSchema = z.object({ userId: z.string().uuid() });

const setUserBanSchema = z.object({
  userId: z.string().uuid(),
  banned: z.boolean(),
});

const setFinderPaidSchema = z.object({
  userId: z.string().uuid(),
  isPaidFinder: z.boolean(),
});

const forceArchiveListingSchema = z.object({
  listingId: z.string().uuid(),
  reason: z.string().trim().max(300).optional(),
});

const listUsersSchema = z.object({
  role: z.enum(["finder", "lister", "admin"]).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().datetime().optional(),
});

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const adminRouter = router({
  // -- Moderation --

  listPostReports: adminProcedure.query(async () => {
    return db.query.postReports.findMany({
      orderBy: [desc(postReports.createdAt)],
      with: {
        post: {
          with: {
            author: {
              columns: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }),

  moderatePostReport: adminProcedure
    .input(moderatePostReportSchema)
    .mutation(async ({ ctx, input }) => {
      const [updatedReport] = await db
        .update(postReports)
        .set({ reviewedAt: new Date(), reviewedBy: ctx.userId, status: input.status })
        .where(eq(postReports.id, input.reportId))
        .returning();

      if (!updatedReport) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post report not found." });
      }

      if (input.removePost) {
        await db
          .update(posts)
          .set({ isRemoved: true, removedAt: new Date(), removedBy: ctx.userId })
          .where(eq(posts.id, updatedReport.postId));
      }

      return updatedReport;
    }),

  listConversationReports: adminProcedure.query(async () => {
    return db.query.conversationReports.findMany({
      orderBy: [desc(conversationReports.createdAt)],
      with: {
        listing: { columns: { id: true, title: true } },
        reporter: { columns: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        reportedUser: { columns: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
  }),

  moderateConversationReport: adminProcedure
    .input(moderateConversationReportSchema)
    .mutation(async ({ ctx, input }) => {
      const [updatedReport] = await db
        .update(conversationReports)
        .set({ reviewedAt: new Date(), reviewedBy: ctx.userId, status: input.status })
        .where(eq(conversationReports.id, input.reportId))
        .returning();

      if (!updatedReport) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Conversation report not found." });
      }

      return updatedReport;
    }),

  // -- User management --

  listUsers: adminProcedure
    .input(listUsersSchema)
    .query(async ({ input }) => {
      const { and, lt, eq: deq } = await import("drizzle-orm");
      const cursorDate = input.cursor ? new Date(input.cursor) : null;

      const rows = await db.query.profiles.findMany({
        where: and(
          input.role ? deq(profiles.role, input.role) : undefined,
          cursorDate ? lt(profiles.createdAt, cursorDate) : undefined,
        ),
        orderBy: [desc(profiles.createdAt)],
        limit: input.limit + 1,
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: true,
          isPaidFinder: true,
          isVerifiedMember: true,
          createdAt: true,
        },
      });

      const hasNextPage = rows.length > input.limit;
      const items = hasNextPage ? rows.slice(0, input.limit) : rows;

      return {
        items,
        nextCursor: hasNextPage
          ? (items[items.length - 1]?.createdAt.toISOString() ?? null)
          : null,
      };
    }),

  getUser: adminProcedure
    .input(userIdSchema)
    .query(async ({ input }) => {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.id, input.userId),
      });

      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }

      return profile;
    }),

  banUser: adminProcedure
    .input(setUserBanSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Admins cannot ban themselves.",
        });
      }

      // Supabase admin SDK: ban sets ban_duration to a far-future date
      const { error } = input.banned
        ? await ctx.supabaseAdmin.auth.admin.updateUserById(input.userId, {
            ban_duration: "876000h", // ~100 years
          })
        : await ctx.supabaseAdmin.auth.admin.updateUserById(input.userId, {
            ban_duration: "none",
          });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to ${input.banned ? "ban" : "unban"} user.`,
          cause: error,
        });
      }

      return { userId: input.userId, banned: input.banned };
    }),

  setFinderPaid: adminProcedure
    .input(setFinderPaidSchema)
    .mutation(async ({ input }) => {
      const [updated] = await db
        .update(profiles)
        .set({ isPaidFinder: input.isPaidFinder })
        .where(eq(profiles.id, input.userId))
        .returning({ id: profiles.id, isPaidFinder: profiles.isPaidFinder });

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }

      return updated;
    }),

  forceArchiveListing: adminProcedure
    .input(forceArchiveListingSchema)
    .mutation(async ({ input }) => {
      const [updated] = await db
        .update(listings)
        .set({ status: "archived" })
        .where(eq(listings.id, input.listingId))
        .returning({ id: listings.id, status: listings.status });

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found." });
      }

      return updated;
    }),
});
