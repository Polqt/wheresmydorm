import { TRPCError } from "@trpc/server";
import {
  db,
  listings,
  profiles,
  reviewHelpfulVotes,
  reviewReports,
  reviews,
  searchEvents,
} from "@wheresmydorm/db";
import { and, desc, eq, inArray, lt } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import { formatProfileName } from "../lib/profile";

const reviewRatingSchema = z.number().min(1).max(5);
const reviewReportReasonValues = [
  "spam",
  "fake",
  "offensive",
  "misleading",
  "other",
] as const;
const moderationStatusValues = [
  "pending",
  "reviewed",
  "actioned",
  "dismissed",
] as const;

const listingIdInputSchema = z.object({
  listingId: z.string().uuid(),
  cursor: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

const createReviewSchema = z.object({
  listingId: z.string().uuid(),
  ratingOverall: reviewRatingSchema,
  ratingValue: reviewRatingSchema,
  ratingSafety: reviewRatingSchema,
  ratingCleanliness: reviewRatingSchema,
  ratingLocation: reviewRatingSchema,
  ratingLandlord: reviewRatingSchema,
  body: z.string().trim().min(20).max(2000),
  photoUrls: z.array(z.string().url()).max(5).default([]),
});

const reviewIdInputSchema = z.object({
  reviewId: z.string().uuid(),
});

const respondSchema = z.object({
  reviewId: z.string().uuid(),
  response: z.string().trim().min(1).max(2000),
});

const reportSchema = z.object({
  reviewId: z.string().uuid(),
  reason: z.enum(reviewReportReasonValues),
  notes: z.string().trim().max(500).optional(),
});

const moderateReportSchema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(moderationStatusValues),
});

async function getCurrentProfileRole(userId: string) {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
    columns: { role: true },
  });

  return profile?.role ?? null;
}

async function getReviewEligibility(userId: string, listingId: string) {
  const existingReview = await db.query.reviews.findFirst({
    where: and(eq(reviews.finderId, userId), eq(reviews.listingId, listingId)),
    columns: { id: true },
  });

  if (existingReview) {
    return {
      canCreate: false,
      reason: "You already reviewed this listing.",
    };
  }

  const viewedListing = await db.query.searchEvents.findFirst({
    where: and(
      eq(searchEvents.userId, userId),
      eq(searchEvents.listingId, listingId),
      eq(searchEvents.eventType, "listing_view"),
    ),
    columns: { id: true },
  });

  if (!viewedListing) {
    return {
      canCreate: false,
      reason: "You need a verified listing view before leaving a review.",
    };
  }

  return {
    canCreate: true,
    reason: null,
  };
}

export const reviewsRouter = router({
  listByListing: protectedProcedure
    .input(listingIdInputSchema)
    .query(async ({ ctx, input }) => {
      const cursorDate = input.cursor ? new Date(input.cursor) : null;

      const rows = await db.query.reviews.findMany({
        where: and(
          eq(reviews.listingId, input.listingId),
          cursorDate ? lt(reviews.createdAt, cursorDate) : undefined,
        ),
        orderBy: [desc(reviews.createdAt)],
        limit: input.limit + 1,
        with: {
          finder: {
            columns: {
              id: true,
              avatarUrl: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      const hasNextPage = rows.length > input.limit;
      const items = hasNextPage ? rows.slice(0, input.limit) : rows;
      const reviewIds = items.map((item) => item.id);

      const helpfulVotes =
        reviewIds.length === 0
          ? []
          : await db.query.reviewHelpfulVotes.findMany({
              where: and(
                eq(reviewHelpfulVotes.userId, ctx.userId),
                inArray(reviewHelpfulVotes.reviewId, reviewIds),
              ),
              columns: { reviewId: true },
            });

      const helpfulVoteSet = new Set(helpfulVotes.map((vote) => vote.reviewId));

      return {
        items: items.map((item) => ({
          ...item,
          finder: {
            avatarUrl: item.finder.avatarUrl,
            displayName: formatProfileName({
              firstName: item.finder.firstName,
              lastName: item.finder.lastName,
            }),
            id: item.finder.id,
          },
          viewerHasHelpfulVote: helpfulVoteSet.has(item.id),
        })),
        nextCursor: hasNextPage
          ? (items[items.length - 1]?.createdAt.toISOString() ?? null)
          : null,
      };
    }),

  getEligibility: protectedProcedure
    .input(z.object({ listingId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const role = await getCurrentProfileRole(ctx.userId);

      if (role !== "finder" && role !== "admin") {
        return {
          canCreate: false,
          reason: "Only finders can leave reviews.",
        };
      }

      return getReviewEligibility(ctx.userId, input.listingId);
    }),

  create: protectedProcedure
    .input(createReviewSchema)
    .mutation(async ({ ctx, input }) => {
      const role = await getCurrentProfileRole(ctx.userId);

      if (role !== "finder" && role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only finders can create reviews.",
        });
      }

      const eligibility = await getReviewEligibility(ctx.userId, input.listingId);

      if (!eligibility.canCreate) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: eligibility.reason ?? "Review is not allowed.",
        });
      }

      const [review] = await db
        .insert(reviews)
        .values({
          listingId: input.listingId,
          finderId: ctx.userId,
          ratingOverall: input.ratingOverall,
          ratingValue: input.ratingValue,
          ratingSafety: input.ratingSafety,
          ratingCleanliness: input.ratingCleanliness,
          ratingLocation: input.ratingLocation,
          ratingLandlord: input.ratingLandlord,
          body: input.body,
          photoUrls: input.photoUrls,
        })
        .returning();

      return review;
    }),

  toggleHelpfulVote: protectedProcedure
    .input(reviewIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existingVote = await db.query.reviewHelpfulVotes.findFirst({
        where: and(
          eq(reviewHelpfulVotes.reviewId, input.reviewId),
          eq(reviewHelpfulVotes.userId, ctx.userId),
        ),
      });

      if (existingVote) {
        await db
          .delete(reviewHelpfulVotes)
          .where(
            and(
              eq(reviewHelpfulVotes.reviewId, input.reviewId),
              eq(reviewHelpfulVotes.userId, ctx.userId),
            ),
          );

        return { helpful: false };
      }

      await db.insert(reviewHelpfulVotes).values({
        reviewId: input.reviewId,
        userId: ctx.userId,
      });

      return { helpful: true };
    }),

  respond: protectedProcedure
    .input(respondSchema)
    .mutation(async ({ ctx, input }) => {
      const review = await db.query.reviews.findFirst({
        where: eq(reviews.id, input.reviewId),
        columns: { id: true, listingId: true },
      });

      if (!review) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Review not found." });
      }

      const listing = await db.query.listings.findFirst({
        where: eq(listings.id, review.listingId),
        columns: { id: true, listerId: true },
      });

      if (!listing || listing.listerId !== ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the listing owner can respond to this review.",
        });
      }

      const [updated] = await db
        .update(reviews)
        .set({
          listerResponse: input.response,
          listerRespondedAt: new Date(),
        })
        .where(eq(reviews.id, input.reviewId))
        .returning();

      return updated;
    }),

  report: protectedProcedure
    .input(reportSchema)
    .mutation(async ({ ctx, input }) => {
      const [report] = await db
        .insert(reviewReports)
        .values({
          reviewId: input.reviewId,
          reporterId: ctx.userId,
          reason: input.reason,
          notes: input.notes,
        })
        .returning();

      return report;
    }),

  myReviews: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db.query.reviews.findMany({
      where: eq(reviews.finderId, ctx.userId),
      orderBy: [desc(reviews.createdAt)],
      with: {
        listing: {
          columns: {
            id: true,
            title: true,
            city: true,
            barangay: true,
          },
        },
      },
    });

    return rows;
  }),

  listReports: protectedProcedure.query(async ({ ctx }) => {
    const role = await getCurrentProfileRole(ctx.userId);

    if (role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view review reports.",
      });
    }

    return db.query.reviewReports.findMany({
      orderBy: [desc(reviewReports.createdAt)],
      with: {
        review: {
          with: {
            finder: {
              columns: {
                id: true,
                avatarUrl: true,
                firstName: true,
                lastName: true,
              },
            },
            listing: {
              columns: {
                id: true,
                title: true,
                listerId: true,
              },
            },
          },
        },
      },
    });
  }),

  moderateReport: protectedProcedure
    .input(moderateReportSchema)
    .mutation(async ({ ctx, input }) => {
      const role = await getCurrentProfileRole(ctx.userId);

      if (role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can moderate review reports.",
        });
      }

      const [updated] = await db
        .update(reviewReports)
        .set({
          status: input.status,
          reviewedAt: new Date(),
          reviewedBy: ctx.userId,
        })
        .where(eq(reviewReports.id, input.reportId))
        .returning();

      return updated;
    }),
});
