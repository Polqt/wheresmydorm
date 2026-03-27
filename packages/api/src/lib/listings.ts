import { db, listings } from "@wheresmydorm/db";
import { and, desc, eq, gte, ilike, inArray, isNull, lte, or } from "drizzle-orm";
import { z } from "zod";

import {
  DEFAULT_FIND_RADIUS_METERS,
  distanceBetweenMeters,
} from "./finder-search";

export const propertyTypeValues = [
  "dorm",
  "apartment",
  "bedspace",
  "condo",
  "boarding_house",
  "studio",
] as const;

export const listingStatusValues = ["active", "paused", "archived"] as const;

export const listingBodySchema = z.object({
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

export const listingListSchema = z.object({
  amenities: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  availableBy: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(150).default(100),
  maxPrice: z.number().nonnegative().max(999_999).optional(),
  minPrice: z.number().nonnegative().max(999_999).optional(),
  minRating: z.number().min(0).max(5).optional(),
  propertyTypes: z.array(z.enum(propertyTypeValues)).max(6).default([]),
  query: z.string().trim().max(80).optional(),
  sortBy: z
    .enum([
      "best_match",
      "nearest",
      "price_low_to_high",
      "price_high_to_low",
      "top_rated",
      "newest",
    ])
    .default("best_match"),
});

export const findNearbySchema = listingListSchema.extend({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusMeters: z.number().int().min(100).max(20_000).default(
    DEFAULT_FIND_RADIUS_METERS,
  ),
});

export type ListingListInput = z.infer<typeof listingListSchema>;
export type FindNearbyInput = z.infer<typeof findNearbySchema>;
export type DiscoveryListingRow = Awaited<
  ReturnType<typeof fetchDiscoveryListingRows>
>[number];

function buildDiscoveryListingWhere(input: ListingListInput) {
  const normalizedQuery = input.query?.trim();
  const searchPattern =
    normalizedQuery && normalizedQuery.length > 0
      ? `%${normalizedQuery.replace(/\s+/g, "%")}%`
      : undefined;

  return and(
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
    input.availableBy !== undefined
      ? or(
          isNull(listings.availableFrom),
          lte(listings.availableFrom, new Date(input.availableBy)),
        )
      : undefined,
    searchPattern
      ? or(
          ilike(listings.title, searchPattern),
          ilike(listings.description, searchPattern),
          ilike(listings.address, searchPattern),
          ilike(listings.city, searchPattern),
          ilike(listings.barangay, searchPattern),
        )
      : undefined,
  );
}

export async function fetchDiscoveryListingRows(input: ListingListInput) {
  return db.query.listings.findMany({
    where: buildDiscoveryListingWhere(input),
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
}

export function toDiscoveryListingItem(row: DiscoveryListingRow) {
  return {
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
  };
}

export function getDiscoveryListingItems(
  rows: DiscoveryListingRow[],
  input: ListingListInput,
) {
  const items = rows
    .filter((row) =>
      input.amenities.every((amenity) => row.amenities.includes(amenity)),
    )
    .map(toDiscoveryListingItem);

  switch (input.sortBy) {
    case "price_low_to_high":
      return items.sort(
        (left, right) =>
          Number(left.pricePerMonth) - Number(right.pricePerMonth),
      );
    case "price_high_to_low":
      return items.sort(
        (left, right) =>
          Number(right.pricePerMonth) - Number(left.pricePerMonth),
      );
    case "top_rated":
      return items.sort((left, right) => {
        const leftRating = left.ratingOverall ?? 0;
        const rightRating = right.ratingOverall ?? 0;

        if (leftRating !== rightRating) {
          return rightRating - leftRating;
        }

        return right.reviewCount - left.reviewCount;
      });
    case "newest":
    case "best_match":
    case "nearest":
    default:
      return items;
  }
}

export function getNearbyDiscoveryItems(
  rows: DiscoveryListingRow[],
  input: FindNearbyInput,
) {
  return getDiscoveryListingItems(rows, input)
    .map((listing) => ({
      distanceMeters: distanceBetweenMeters(
        { lat: input.lat, lng: input.lng },
        { lat: listing.lat, lng: listing.lng },
      ),
      listing,
    }))
    .filter(({ distanceMeters }) => distanceMeters <= input.radiusMeters)
    .sort((left, right) => {
      switch (input.sortBy) {
        case "nearest":
          return left.distanceMeters - right.distanceMeters;
        case "price_low_to_high":
          return (
            Number(left.listing.pricePerMonth) -
            Number(right.listing.pricePerMonth)
          );
        case "price_high_to_low":
          return (
            Number(right.listing.pricePerMonth) -
            Number(left.listing.pricePerMonth)
          );
        case "top_rated": {
          const leftRating = left.listing.ratingOverall ?? 0;
          const rightRating = right.listing.ratingOverall ?? 0;

          if (leftRating !== rightRating) {
            return rightRating - leftRating;
          }

          return right.listing.reviewCount - left.listing.reviewCount;
        }
        case "newest":
          return 0;
        case "best_match":
        default: {
          if (left.listing.isFeatured !== right.listing.isFeatured) {
            return left.listing.isFeatured ? -1 : 1;
          }

          if (left.distanceMeters !== right.distanceMeters) {
            return left.distanceMeters - right.distanceMeters;
          }

          const leftRating = left.listing.ratingOverall ?? 0;
          const rightRating = right.listing.ratingOverall ?? 0;

          if (leftRating !== rightRating) {
            return rightRating - leftRating;
          }

          return right.listing.reviewCount - left.listing.reviewCount;
        }
      }
    })
    .map(({ listing }) => listing);
}
