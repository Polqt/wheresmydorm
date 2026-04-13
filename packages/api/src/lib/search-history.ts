import { z } from "zod";

import { listingListSchema } from "./listings";

export const savedSearchFiltersSchema = listingListSchema.extend({
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  radiusMeters: z.number().int().min(100).max(20_000).optional(),
});

export const SAVEABLE_SEARCH_LIMIT = 25;

export const saveSearchSchema = z.object({
  filters: savedSearchFiltersSchema,
  label: z.string().trim().min(1).max(80),
});

export function normalizeSearchText(input: z.infer<typeof listingListSchema>) {
  return input.query?.trim() || null;
}

export function buildSearchFiltersPayload(
  input: z.infer<typeof savedSearchFiltersSchema>,
) {
  return {
    amenities: input.amenities,
    availableBy: input.availableBy ?? null,
    lat: input.lat ?? null,
    limit: input.limit,
    lng: input.lng ?? null,
    maxPrice: input.maxPrice ?? null,
    minPrice: input.minPrice ?? null,
    minRating: input.minRating ?? null,
    propertyTypes: input.propertyTypes,
    query: input.query ?? null,
    radiusMeters: input.radiusMeters ?? null,
    sortBy: input.sortBy,
  };
}
