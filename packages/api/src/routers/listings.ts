import { TRPCError } from "@trpc/server";
import {
  db,
  listingPhotos,
  listings,
  profiles,
  savedListings,
} from "@wheresmydorm/db";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../index.js";
import { formatProfileName } from "../lib/profile.js";

const propertyTypeValues = [
  "dorm",
  "apartment",
  "bedspace",
  "condo",
  "boarding_house",
  "studio",
] as const;

const listingStatusValues = ["active", "paused", "archived"] as const;

const listingBodySchema = z.object({
  title: z.string().trim().min(4).max(120),
  description: z.string().trim().min(10).max(2000),
  propertyType: z.enum(propertyTypeValues),
  pricePerMonth: z.number().positive().max(999_999),
  sizeSqm: z.number().positive().max(9999).optional(),
  maxOccupants: z.number().int().positive().max(100).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().trim().min(4).max(300),
  city: z.string().trim().min(2).max(100),
  barangay: z.string().trim().max(100).optional(),
  amenities: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  photoUrls: z.array(z.string().url()).max(10).default([]),
});

const listingListSchema = z.object({
  amenities: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  limit: z.number().int().min(1).max(150).default(100),
  maxPrice: z.number().nonnegative().max(999_999).optional(),
  minPrice: z.number().nonnegative().max(999_999).optional(),
  minRating: z.number().min(0).max(5).optional(),
  propertyTypes: z.array(z.enum(propertyTypeValues)).max(6).default([]),
});

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
    const rows = await db.query.listings.findMany({
      where: and(
        eq(listings.status, "active"),
        eq(listings.isAvailable, true),
        input.propertyTypes.length > 0
          ? inArray(listings.propertyType, input.propertyTypes)
          : undefined,
        input.minPrice !== undefined
          ? gte(listings.pricePerMonth, String(input.minPrice))
          : undefined,
        input.maxPrice !== undefined
          ? lte(listings.pricePerMonth, String(input.maxPrice))
          : undefined,
        input.minRating !== undefined
          ? gte(listings.ratingOverall, input.minRating)
          : undefined,
      ),
      orderBy: [desc(listings.isFeatured), desc(listings.createdAt)],
      limit: input.limit,
      with: {
        photos: {
          columns: { url: true, orderIndex: true },
          limit: 1,
          orderBy: (p, { asc }) => [asc(p.orderIndex)],
        },
      },
    });

    return rows
      .filter((row) =>
        input.amenities.every((amenity) => row.amenities.includes(amenity)),
      )
      .map((row) => ({
        amenities: row.amenities,
        barangay: row.barangay,
        bookmarkCount: row.bookmarkCount,
        city: row.city,
        coverPhoto: row.photos[0]?.url ?? null,
        id: row.id,
        inquiryCount: row.inquiryCount,
        isAvailable: row.isAvailable,
        isFeatured: row.isFeatured,
        lat: row.lat,
        lng: row.lng,
        pricePerMonth: row.pricePerMonth,
        propertyType: row.propertyType,
        ratingOverall: row.ratingOverall,
        reviewCount: row.reviewCount,
        status: row.status,
        title: row.title,
        viewCount: row.viewCount,
      }));
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
        "title", "description", "propertyType", "sizeSqm",
        "maxOccupants", "lat", "lng", "address", "city", "barangay", "amenities",
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
        await db
          .insert(listingPhotos)
          .values(
            photoUrls.map((url, i) => ({ listingId: id, url, orderIndex: i })),
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
        await db
          .update(listings)
          .set({
            bookmarkCount: sql`greatest(${listings.bookmarkCount} - 1, 0)`,
          })
          .where(eq(listings.id, input.listingId));
        return { saved: false };
      }

      await db.insert(savedListings).values({
        finderId: ctx.userId,
        listingId: input.listingId,
      });
      await db
        .update(listings)
        .set({ bookmarkCount: sql`${listings.bookmarkCount} + 1` })
        .where(eq(listings.id, input.listingId));

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
