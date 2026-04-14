import { TRPCError } from "@trpc/server";
import {
  db,
  listingPhotos,
  listings,
  payments,
  profiles,
  savedListings,
  searchEvents,
} from "@wheresmydorm/db";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure, protectedProcedure } from "../index";
import { assertLister, assertListingOwner } from "../lib/guards";
import {
  FREE_LISTING_QUOTA,
  getFreeListingIdsForLister,
  getLatestListingPaymentStatusMap,
} from "../lib/listing-quotas";
import {
  listingBodySchema,
  listingStatusValues,
} from "../lib/listings";
import { formatProfileName } from "../lib/profile";

export const listingManagementProcedures = {
  create: protectedProcedure
    .input(listingBodySchema)
    .mutation(async ({ ctx, input }) => {
      assertLister(ctx, "Only listers can create listings.");

      const existingListingCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(listings)
        .where(eq(listings.listerId, ctx.userId));
      const exceedsFreeQuota =
        (existingListingCount[0]?.count ?? 0) >= FREE_LISTING_QUOTA;

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
          status: exceedsFreeQuota ? "paused" : "active",
        })
        .returning();

      if (!listing) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

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

  myListings: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db.query.listings.findMany({
      where: eq(listings.listerId, ctx.userId),
      orderBy: [desc(listings.createdAt)],
      with: {
        photos: {
          columns: { url: true, orderIndex: true },
          limit: 1,
          orderBy: (p, { asc: orderAsc }) => [orderAsc(p.orderIndex)],
        },
      },
    });

    const freeListingIds = await getFreeListingIdsForLister(ctx.userId);
    const paymentStatusMap = await getLatestListingPaymentStatusMap(
      rows.map((row) => row.id),
    );

    return rows.map((row) => ({
      boostPaymentStatus:
        paymentStatusMap.get(row.id)?.boostPaymentStatus ?? null,
      id: row.id,
      title: row.title,
      propertyType: row.propertyType,
      pricePerMonth: row.pricePerMonth,
      city: row.city,
      barangay: row.barangay,
      status: row.status,
      isAvailable: row.isAvailable,
      isFeatured: row.isFeatured,
      hasPaidListingFee:
        (paymentStatusMap.get(row.id)?.listingFeeStatus ?? null) === "paid",
      ratingOverall: row.ratingOverall,
      reviewCount: row.reviewCount,
      listingFeeStatus: paymentStatusMap.get(row.id)?.listingFeeStatus ?? null,
      requiresListingFee: !freeListingIds.has(row.id),
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
          lister: {
            columns: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
          photos: {
            columns: { id: true, url: true, orderIndex: true },
            orderBy: (p, { asc: orderAsc }) => [orderAsc(p.orderIndex)],
          },
        },
      });

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Listing not found.",
        });
      }

      const [saved] = await Promise.all([
        db.query.savedListings.findFirst({
          where: and(
            eq(savedListings.finderId, ctx.userId),
            eq(savedListings.listingId, input.id),
          ),
          columns: { finderId: true },
        }),
      ]);

      let viewCount = row.viewCount;

      if (row.listerId !== ctx.userId) {
        const [updated] = await db
          .update(listings)
          .set({ viewCount: sql`${listings.viewCount} + 1` })
          .where(eq(listings.id, input.id))
          .returning({ viewCount: listings.viewCount });

        viewCount = updated?.viewCount ?? row.viewCount + 1;

        if (ctx.role === "finder" || ctx.role === "admin") {
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
        lister: row.lister
          ? {
              id: row.lister.id,
              displayName: formatProfileName({
                firstName: row.lister.firstName,
                lastName: row.lister.lastName,
              }),
              avatarUrl: row.lister.avatarUrl,
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
      await assertListingOwner({
        listingId: id,
        userId: ctx.userId,
      });

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
        if (fields[key] !== undefined) {
          updatePayload[key] = fields[key];
        }
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
      const existing = await assertListingOwner({
        listingId: input.id,
        userId: ctx.userId,
      });

      if (input.status === "active") {
        const freeListingIds = await getFreeListingIdsForLister(ctx.userId);

        if (!freeListingIds.has(existing.id)) {
          const listingFeePayment = await db.query.payments.findFirst({
            where: and(
              eq(payments.listingId, existing.id),
              eq(payments.type, "listing_fee"),
              eq(payments.status, "paid"),
            ),
            columns: { id: true },
          });

          if (!listingFeePayment) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message:
                "This listing needs a paid listing fee before it can go active.",
            });
          }
        }
      }

      const [updated] = await db
        .update(listings)
        .set({ status: input.status })
        .where(eq(listings.id, input.id))
        .returning({ id: listings.id, status: listings.status });

      return updated;
    }),

  /**
   * Analytics for a lister's own listings.
   * Requires an active lister_analytics subscription (analyticsExpiresAt > now).
   */
  analytics: protectedProcedure
    .input(z.object({ listingId: z.string().uuid().optional() }))
    .query(async ({ ctx, input }) => {
      assertLister(ctx, "Only listers can access listing analytics.");

      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.id, ctx.userId),
        columns: { analyticsExpiresAt: true },
      });

      const hasAnalytics =
        profile?.analyticsExpiresAt != null &&
        profile.analyticsExpiresAt > new Date();

      if (!hasAnalytics) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Active Lister Analytics subscription required.",
        });
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const myListingIds = await db.query.listings.findMany({
        where: input.listingId
          ? and(
              eq(listings.id, input.listingId),
              eq(listings.listerId, ctx.userId),
            )
          : eq(listings.listerId, ctx.userId),
        columns: { id: true, title: true, viewCount: true, bookmarkCount: true, inquiryCount: true, isFeatured: true, boostExpiresAt: true },
      });

      const thirtyDayViews = await db
        .select({
          listingId: searchEvents.listingId,
          views: sql<number>`count(*)::int`,
        })
        .from(searchEvents)
        .where(
          and(
            eq(searchEvents.eventType, "listing_view"),
            gte(searchEvents.createdAt, thirtyDaysAgo),
          ),
        )
        .groupBy(searchEvents.listingId);

      const viewsMap = new Map(
        thirtyDayViews
          .filter((r) => r.listingId != null)
          .map((r) => [r.listingId!, r.views]),
      );

      return myListingIds.map((listing) => ({
        id: listing.id,
        title: listing.title,
        totalViews: listing.viewCount,
        totalSaves: listing.bookmarkCount,
        totalInquiries: listing.inquiryCount,
        viewsLast30Days: viewsMap.get(listing.id) ?? 0,
        isBoosted: listing.isFeatured && (listing.boostExpiresAt == null || listing.boostExpiresAt > new Date()),
        boostExpiresAt: listing.boostExpiresAt?.toISOString() ?? null,
      }));
    }),

  /**
   * Admin-only: trigger the listing expiry job manually.
   * In production this is also called by a Supabase Edge Function cron.
   * Returns the number of listings that were paused.
   */
  runExpiry: adminProcedure.mutation(async () => {
    const result = await db.execute<{ expire_listings: number }>(
      sql`SELECT public.expire_listings()`,
    );
    const count = result.rows[0]?.expire_listings ?? 0;
    return { expiredCount: Number(count) };
  }),
};
