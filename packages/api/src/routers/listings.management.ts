import { TRPCError } from "@trpc/server";
import {
  db,
  listingPhotos,
  listings,
  payments,
  savedListings,
  searchEvents,
} from "@wheresmydorm/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../index";
import { ensureLister, ensureListingOwner } from "../lib/guards";
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
      await ensureLister({
        message: "Only listers can create listings.",
        userId: ctx.userId,
      });

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
      await ensureListingOwner({
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
      const existing = await ensureListingOwner({
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
};
