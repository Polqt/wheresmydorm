import { TRPCError } from "@trpc/server";
import { db, searchEvents } from "@wheresmydorm/db";

import { protectedProcedure } from "../index";
import {
  FREE_FINDER_LIFETIME_FIND_LIMIT,
  hasAdvancedFinderFilters,
} from "../lib/finder-search";
import { ensureFinder } from "../lib/guards";
import {
  consumeFinderFindRow,
  getFinderQuotaRow,
  toFinderQuotaStatus,
} from "../lib/listing-quotas";
import {
  fetchDiscoveryListingRows,
  findNearbySchema,
  getDiscoveryListingItems,
  getNearbyDiscoveryItems,
  type ListingListInput,
  listingListSchema,
} from "../lib/listings";
import {
  buildSearchFiltersPayload,
  normalizeSearchText,
} from "../lib/search-history";

const DISCOVER_SECTION_LIMIT = 10;

async function getDiscoverySection(options: {
  maxPrice?: number;
  sortBy: "newest" | "price_low_to_high" | "top_rated";
}) {
  const input: ListingListInput = {
    amenities: [],
    limit: DISCOVER_SECTION_LIMIT,
    maxPrice: options.maxPrice,
    propertyTypes: [],
    sortBy: options.sortBy,
  };
  const rows = await fetchDiscoveryListingRows(input);

  return getDiscoveryListingItems(rows, input);
}

export const listingDiscoveryProcedures = {
  list: protectedProcedure
    .input(listingListSchema)
    .query(async ({ ctx, input }) => {
      const rows = await fetchDiscoveryListingRows(input);
      const items = getDiscoveryListingItems(rows, input);

      await db.insert(searchEvents).values({
        eventType: "search_query",
        searchFilters: buildSearchFiltersPayload(input),
        searchText: normalizeSearchText(input),
        userId: ctx.userId,
      });

      return items;
    }),

  findQuotaStatus: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.role !== "finder" && ctx.role !== "admin") {
      return {
        advancedFiltersEnabled: false,
        canFind: false,
        lifetimeLimit: FREE_FINDER_LIFETIME_FIND_LIMIT,
        hasUnlimitedFinds: false,
        isPaid: false,
        remainingFinds: 0,
        usedTotal: 0,
      };
    }

    const quota = await getFinderQuotaRow(ctx.userId);
    return toFinderQuotaStatus(quota);
  }),

  findNearby: protectedProcedure
    .input(findNearbySchema)
    .mutation(async ({ ctx, input }) => {
      await ensureFinder({
        message: "Only finders can run nearby searches.",
        userId: ctx.userId,
      });

      const quotaBeforeFind = await getFinderQuotaRow(ctx.userId);

      if (!quotaBeforeFind.is_paid && hasAdvancedFinderFilters(input)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Advanced filters are available for paid finders only.",
        });
      }

      const quota = await consumeFinderFindRow(ctx.userId, input);

      if (!quota.allowed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Free finders get ${FREE_FINDER_LIFETIME_FIND_LIMIT} lifetime nearby searches. Upgrade your finder plan for unlimited searches.`,
        });
      }

      const rows = await fetchDiscoveryListingRows(input);

      await db.insert(searchEvents).values({
        centerLat: input.lat,
        centerLng: input.lng,
        eventType: "find_nearby",
        radiusMeters: input.radiusMeters,
        searchFilters: buildSearchFiltersPayload(input),
        searchText: normalizeSearchText(input),
        userId: ctx.userId,
      });

      return {
        items: getNearbyDiscoveryItems(rows, input),
        quota: toFinderQuotaStatus(quota),
      };
    }),

  discover: protectedProcedure.query(async ({ ctx }) => {
    await ensureFinder({ userId: ctx.userId });

    const [topRated, newArrivals, underThreeThousand] = await Promise.all([
      getDiscoverySection({ sortBy: "top_rated" }),
      getDiscoverySection({ sortBy: "newest" }),
      getDiscoverySection({
        maxPrice: 3000,
        sortBy: "price_low_to_high",
      }),
    ]);

    return {
      newArrivals,
      topRated,
      underThreeThousand,
    };
  }),
};
