import { TRPCError } from "@trpc/server";
import { db, savedListings, savedSearches, searchEvents } from "@wheresmydorm/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../index";
import { ensureFinder } from "../lib/guards";
import {
  buildSearchFiltersPayload,
  SAVEABLE_SEARCH_LIMIT,
  saveSearchSchema,
} from "../lib/search-history";

export const listingSearchProcedures = {
  recentSearches: protectedProcedure.query(async ({ ctx }) => {
    await ensureFinder({ userId: ctx.userId });

    const rows = await db.query.searchEvents.findMany({
      where: and(
        eq(searchEvents.userId, ctx.userId),
        eq(searchEvents.eventType, "search_query"),
      ),
      orderBy: [desc(searchEvents.createdAt)],
      limit: 10,
    });

    return rows.map((row) => ({
      createdAt: row.createdAt.toISOString(),
      filters: row.searchFilters ?? null,
      id: row.id,
      query: row.searchText ?? null,
    }));
  }),

  savedSearches: protectedProcedure.query(async ({ ctx }) => {
    await ensureFinder({ userId: ctx.userId });

    const rows = await db.query.savedSearches.findMany({
      where: eq(savedSearches.finderId, ctx.userId),
      orderBy: [desc(savedSearches.updatedAt)],
    });

    return rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }),

  saveSearch: protectedProcedure
    .input(saveSearchSchema)
    .mutation(async ({ ctx, input }) => {
      await ensureFinder({ userId: ctx.userId });

      const existingCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(savedSearches)
        .where(eq(savedSearches.finderId, ctx.userId));

      if ((existingCount[0]?.count ?? 0) >= SAVEABLE_SEARCH_LIMIT) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `You can save up to ${SAVEABLE_SEARCH_LIMIT} searches.`,
        });
      }

      const [savedSearch] = await db
        .insert(savedSearches)
        .values({
          filters: buildSearchFiltersPayload(input.filters),
          finderId: ctx.userId,
          label: input.label,
        })
        .returning();

      return savedSearch;
    }),

  deleteSavedSearch: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ensureFinder({ userId: ctx.userId });

      await db
        .delete(savedSearches)
        .where(
          and(
            eq(savedSearches.id, input.id),
            eq(savedSearches.finderId, ctx.userId),
          ),
        );

      return { success: true };
    }),

  toggleSave: protectedProcedure
    .input(z.object({ listingId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.query.savedListings.findFirst({
        where: and(
          eq(savedListings.finderId, ctx.userId),
          eq(savedListings.listingId, input.listingId),
        ),
        columns: { finderId: true },
      });

      if (existing) {
        await db
          .delete(savedListings)
          .where(
            and(
              eq(savedListings.finderId, ctx.userId),
              eq(savedListings.listingId, input.listingId),
            ),
          );
        return { saved: false };
      }

      await db.insert(savedListings).values({
        finderId: ctx.userId,
        listingId: input.listingId,
      });

      return { saved: true };
    }),

  savedListings: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db.query.savedListings.findMany({
      where: eq(savedListings.finderId, ctx.userId),
      orderBy: [desc(savedListings.createdAt)],
      with: {
        listing: {
          with: {
            photos: {
              columns: { url: true, orderIndex: true },
              limit: 1,
              orderBy: (p, { asc: orderAsc }) => [orderAsc(p.orderIndex)],
            },
          },
        },
      },
    });

    return rows.map(({ listing }) => ({
      id: listing.id,
      title: listing.title,
      propertyType: listing.propertyType,
      pricePerMonth: listing.pricePerMonth,
      city: listing.city,
      barangay: listing.barangay,
      status: listing.status,
      ratingOverall: listing.ratingOverall,
      reviewCount: listing.reviewCount,
      coverPhoto: listing.photos[0]?.url ?? null,
    }));
  }),
};
