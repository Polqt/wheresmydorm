import { TRPCError } from "@trpc/server";
import {
  db,
  listingPhotos,
  listings,
  profiles,
  savedListings,
  searchEvents,
} from "@wheresmydorm/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import {
  FREE_FINDER_DAILY_FIND_LIMIT,
  hasAdvancedFinderFilters,
} from "../lib/finder-search";
import {
  fetchDiscoveryListingRows,
  findNearbySchema,
  getDiscoveryListingItems,
  getNearbyDiscoveryItems,
  listingBodySchema,
  listingListSchema,
  listingStatusValues,
  type FindNearbyInput,
} from "../lib/listings";
import { formatProfileName } from "../lib/profile";
type FinderQuotaRow = {
  allowed: boolean;
  daily_limit: number;
  is_paid: boolean;
  remaining_finds: number;
  used_today: number;
};

function toFinderQuotaStatus(row: FinderQuotaRow) {
  return {
    advancedFiltersEnabled: row.is_paid,
    canFind: row.allowed,
    dailyLimit: row.daily_limit,
    hasUnlimitedFinds: row.is_paid,
    isPaid: row.is_paid,
    remainingFinds: row.remaining_finds,
    usedToday: row.used_today,
  };
}

function normalizeFinderQuotaRow(row: Record<string, unknown>): FinderQuotaRow {
  return {
    allowed: Boolean(row.allowed),
    daily_limit: Number(row.daily_limit ?? 0),
    is_paid: Boolean(row.is_paid),
    remaining_finds: Number(row.remaining_finds ?? 0),
    used_today: Number(row.used_today ?? 0),
  };
}

async function getFinderQuotaRow(userId: string): Promise<FinderQuotaRow> {
  const result = await db.execute(sql<FinderQuotaRow>`
    select *
    from public.get_finder_find_quota(${userId})
  `);
  const row = result.rows[0];

  if (!row) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Finder quota is unavailable right now.",
    });
  }

  return normalizeFinderQuotaRow(row);
}

async function consumeFinderFindRow(
  userId: string,
  input: Pick<FindNearbyInput, "lat" | "lng" | "radiusMeters">,
): Promise<FinderQuotaRow> {
  const result = await db.execute(sql<FinderQuotaRow>`
    select *
    from public.consume_finder_find(${userId}, ${input.lat}, ${input.lng}, ${input.radiusMeters})
  `);
  const row = result.rows[0];

  if (!row) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Finder quota could not be updated.",
    });
  }

  return normalizeFinderQuotaRow(row);
}

export const listingsRouter = router({
  create: protectedProcedure
    .input(listingBodySchema)
    .mutation(async ({ ctx, input }) => {
      const listerProfile = await db.query.profiles.findFirst({
        where: eq(profiles.id, ctx.userId),
        columns: { role: true },
      });

      if (!listerProfile || listerProfile.role !== "lister") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only listers can create listings.",
        });
      }

      const [listing] = await db
        .insert(listings)
        .values({
          listerId: ctx.userId,
          title: input.title,
          description: input.description,
          propertyType: input.propertyType,
          pricePerMonth: String(input.pricePerMonth),
          sizeSqm: input.sizeSqm,
          maxOccupants: input.maxOccupants,
          lat: input.lat,
          lng: input.lng,
          address: input.address,
          city: input.city,
          barangay: input.barangay,
          amenities: input.amenities,
        })
        .returning();

      if (!listing) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      if (input.photoUrls.length > 0) {
        await db.insert(listingPhotos).values(
          input.photoUrls.map((url, i) => ({
            listingId: listing.id,
            url,
            orderIndex: i,
          })),
        );
      }

      return listing;
    }),

  list: protectedProcedure.input(listingListSchema).query(async ({ input }) => {
    const rows = await fetchDiscoveryListingRows(input);
    return getDiscoveryListingItems(rows, input);
  }),

  findQuotaStatus: protectedProcedure.query(async ({ ctx }) => {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, ctx.userId),
      columns: { role: true },
    });

    if (!profile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Profile not found for the current user.",
      });
    }

    if (profile.role !== "finder" && profile.role !== "admin") {
      return {
        advancedFiltersEnabled: false,
        canFind: false,
        dailyLimit: FREE_FINDER_DAILY_FIND_LIMIT,
        hasUnlimitedFinds: false,
        isPaid: false,
        remainingFinds: 0,
        usedToday: 0,
      };
    }

    const quota = await getFinderQuotaRow(ctx.userId);
    return toFinderQuotaStatus(quota);
  }),

  findNearby: protectedProcedure
    .input(findNearbySchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.id, ctx.userId),
        columns: { role: true },
      });

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Profile not found for the current user.",
        });
      }

      if (profile.role !== "finder" && profile.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only finders can run nearby searches.",
        });
      }

      const quotaBeforeFind = await getFinderQuotaRow(ctx.userId);

      if (!quotaBeforeFind.is_paid && hasAdvancedFinderFilters(input)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Advanced filters are available for paid finders only.",
        });
      }

      const quota = await consumeFinderFindRow(ctx.userId, input);

      if (!quota.allowed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Free finders get 5 nearby finds per day. Upgrade your finder plan for unlimited searches.",
        });
      }

      const rows = await fetchDiscoveryListingRows(input);

      return {
        items: getNearbyDiscoveryItems(rows, input),
        quota: toFinderQuotaStatus(quota),
      };
    }),

  myListings: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db.query.listings.findMany({
      where: eq(listings.listerId, ctx.userId),
      orderBy: [desc(listings.createdAt)],
      with: {
        photos: {
          columns: { url: true, orderIndex: true },
          limit: 1,
          orderBy: (p, { asc }) => [asc(p.orderIndex)],
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      propertyType: row.propertyType,
      pricePerMonth: row.pricePerMonth,
      city: row.city,
      barangay: row.barangay,
      status: row.status,
      isAvailable: row.isAvailable,
      isFeatured: row.isFeatured,
      ratingOverall: row.ratingOverall,
      reviewCount: row.reviewCount,
      viewCount: row.viewCount,
      bookmarkCount: row.bookmarkCount,
      inquiryCount: row.inquiryCount,
      coverPhoto: row.photos[0]?.url ?? null,
      createdAt: row.createdAt.toISOString(),
    }));
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const row = await db.query.listings.findFirst({
        where: eq(listings.id, input.id),
        with: {
          photos: {
            columns: { id: true, url: true, orderIndex: true },
            orderBy: (p, { asc }) => [asc(p.orderIndex)],
          },
        },
      });

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Listing not found.",
        });
      }

      const listerProfile = await db.query.profiles.findFirst({
        where: eq(profiles.id, row.listerId),
        columns: { id: true, firstName: true, lastName: true, avatarUrl: true },
      });

      const saved = await db.query.savedListings.findFirst({
        where: and(
          eq(savedListings.finderId, ctx.userId),
          eq(savedListings.listingId, input.id),
        ),
        columns: { finderId: true },
      });

      let viewCount = row.viewCount;

      if (row.listerId !== ctx.userId) {
        const [updated] = await db
          .update(listings)
          .set({ viewCount: sql`${listings.viewCount} + 1` })
          .where(eq(listings.id, input.id))
          .returning({ viewCount: listings.viewCount });

        viewCount = updated?.viewCount ?? row.viewCount + 1;

        const viewerProfile = await db.query.profiles.findFirst({
          where: eq(profiles.id, ctx.userId),
          columns: { role: true },
        });

        if (viewerProfile?.role === "finder" || viewerProfile?.role === "admin") {
          await db.insert(searchEvents).values({
            userId: ctx.userId,
            listingId: input.id,
            eventType: "listing_view",
          });
        }
      }

      return {
        id: row.id,
        listerId: row.listerId,
        title: row.title,
        description: row.description,
        propertyType: row.propertyType,
        pricePerMonth: row.pricePerMonth,
        sizeSqm: row.sizeSqm,
        maxOccupants: row.maxOccupants,
        lat: row.lat,
        lng: row.lng,
        address: row.address,
        city: row.city,
        barangay: row.barangay,
        amenities: row.amenities,
        isAvailable: row.isAvailable,
        status: row.status,
        isFeatured: row.isFeatured,
        ratingOverall: row.ratingOverall,
        reviewCount: row.reviewCount,
        viewCount,
        bookmarkCount: row.bookmarkCount,
        createdAt: row.createdAt.toISOString(),
        photos: row.photos.map((p) => ({
          id: p.id,
          url: p.url,
          orderIndex: p.orderIndex,
        })),
        lister: listerProfile
          ? {
              id: listerProfile.id,
              displayName: formatProfileName({
                firstName: listerProfile.firstName,
                lastName: listerProfile.lastName,
              }),
              avatarUrl: listerProfile.avatarUrl,
            }
          : null,
        isSaved: Boolean(saved),
        isOwner: row.listerId === ctx.userId,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({ id: z.string().uuid() }).merge(listingBodySchema.partial()),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, photoUrls, ...fields } = input;

      const existing = await db.query.listings.findFirst({
        where: eq(listings.id, id),
        columns: { listerId: true },
      });

      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (existing.listerId !== ctx.userId)
        throw new TRPCError({ code: "FORBIDDEN" });

      const updatePayload: Record<string, unknown> = {};
      const passThrough = [
        "title",
        "description",
        "propertyType",
        "sizeSqm",
        "maxOccupants",
        "lat",
        "lng",
        "address",
        "city",
        "barangay",
        "amenities",
      ] as const;

      for (const key of passThrough) {
        if (fields[key] !== undefined) updatePayload[key] = fields[key];
      }

      if (fields.pricePerMonth !== undefined) {
        updatePayload.pricePerMonth = String(fields.pricePerMonth);
      }

      const [updated] = await db
        .update(listings)
        .set(updatePayload)
        .where(eq(listings.id, id))
        .returning();

      if (photoUrls && photoUrls.length > 0) {
        await db.delete(listingPhotos).where(eq(listingPhotos.listingId, id));
        await db.insert(listingPhotos).values(
          photoUrls.map((url, i) => ({
            listingId: id,
            url,
            orderIndex: i,
          })),
        );
      }

      return updated;
    }),

  setStatus: protectedProcedure
    .input(
      z.object({ id: z.string().uuid(), status: z.enum(listingStatusValues) }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await db.query.listings.findFirst({
        where: eq(listings.id, input.id),
        columns: { listerId: true },
      });

      if (!existing || existing.listerId !== ctx.userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [updated] = await db
        .update(listings)
        .set({ status: input.status })
        .where(eq(listings.id, input.id))
        .returning({ id: listings.id, status: listings.status });

      return updated;
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
      orderBy: (sl, { desc: d }) => [d(sl.createdAt)],
      with: {
        listing: {
          with: {
            photos: {
              columns: { url: true, orderIndex: true },
              limit: 1,
              orderBy: (p, { asc }) => [asc(p.orderIndex)],
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
});
