import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("./listings", () => ({
  listingListSchema: z.object({
    amenities: z.array(z.string()),
    availableBy: z.string().optional(),
    limit: z.number(),
    maxPrice: z.number().optional(),
    minPrice: z.number().optional(),
    minRating: z.number().optional(),
    propertyTypes: z.array(
      z.enum([
        "dorm",
        "apartment",
        "bedspace",
        "condo",
        "boarding_house",
        "studio",
      ]),
    ),
    query: z.string().optional(),
    sortBy: z.enum([
      "best_match",
      "nearest",
      "price_low_to_high",
      "price_high_to_low",
      "top_rated",
      "newest",
    ]),
  }),
}));

import {
  buildSearchFiltersPayload,
  normalizeSearchText,
  SAVEABLE_SEARCH_LIMIT,
} from "./search-history";

describe("search-history helpers", () => {
  it("normalizes blank queries to null", () => {
    expect(
      normalizeSearchText({
        amenities: [],
        limit: 10,
        propertyTypes: [],
        query: "   ",
        sortBy: "best_match",
      }),
    ).toBeNull();
  });

  it("preserves non-empty search text", () => {
    expect(
      normalizeSearchText({
        amenities: [],
        limit: 10,
        propertyTypes: [],
        query: " Lacson dorm ",
        sortBy: "best_match",
      }),
    ).toBe("Lacson dorm");
  });

  it("builds a complete filters payload with explicit nulls", () => {
    expect(
      buildSearchFiltersPayload({
        amenities: ["wifi"],
        limit: 12,
        maxPrice: 3000,
        minPrice: 1800,
        minRating: 4.2,
        propertyTypes: ["dorm"],
        query: "University",
        radiusMeters: 900,
        sortBy: "nearest",
        lat: 10.67,
        lng: 122.95,
      }),
    ).toEqual({
      amenities: ["wifi"],
      availableBy: null,
      lat: 10.67,
      limit: 12,
      lng: 122.95,
      maxPrice: 3000,
      minPrice: 1800,
      minRating: 4.2,
      propertyTypes: ["dorm"],
      query: "University",
      radiusMeters: 900,
      sortBy: "nearest",
    });
  });

  it("exposes the saved-search cap as a stable boundary", () => {
    expect(SAVEABLE_SEARCH_LIMIT).toBe(25);
  });
});
