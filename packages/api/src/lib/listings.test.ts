import { describe, expect, it, vi } from "vitest";

vi.mock("@wheresmydorm/db", () => ({
  db: {
    query: {
      listings: {
        findMany: vi.fn(),
      },
    },
  },
  listings: {
    address: "address",
    availableFrom: "availableFrom",
    barangay: "barangay",
    city: "city",
    createdAt: "createdAt",
    description: "description",
    isAvailable: "isAvailable",
    isFeatured: "isFeatured",
    pricePerMonth: "pricePerMonth",
    propertyType: "propertyType",
    ratingOverall: "ratingOverall",
    status: "status",
    title: "title",
  },
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  desc: vi.fn(),
  eq: vi.fn(),
  gte: vi.fn(),
  ilike: vi.fn(),
  inArray: vi.fn(),
  isNull: vi.fn(),
  lte: vi.fn(),
  or: vi.fn(),
}));

import type { DiscoveryListingRow, FindNearbyInput, ListingListInput } from "./listings";
import {
  getDiscoveryListingItems,
  getNearbyDiscoveryItems,
  toDiscoveryListingItem,
} from "./listings";

function makeRow(overrides: Partial<DiscoveryListingRow> = {}): DiscoveryListingRow {
  return {
    amenities: ["wifi", "ac"],
    barangay: "Mandalagan",
    bookmarkCount: 3,
    city: "Bacolod",
    id: crypto.randomUUID(),
    inquiryCount: 2,
    isAvailable: true,
    isFeatured: false,
    lat: 10.6765,
    lng: 122.9511,
    photos: [{ orderIndex: 0, url: "https://example.com/cover.jpg" }],
    pricePerMonth: "2500",
    propertyType: "dorm",
    ratingOverall: 4.2,
    reviewCount: 7,
    status: "active",
    title: "Dorm A",
    viewCount: 10,
    ...overrides,
  } as DiscoveryListingRow;
}

function makeListInput(overrides: Partial<ListingListInput> = {}): ListingListInput {
  return {
    amenities: [],
    limit: 10,
    propertyTypes: [],
    sortBy: "best_match",
    ...overrides,
  };
}

function makeNearbyInput(overrides: Partial<FindNearbyInput> = {}): FindNearbyInput {
  return {
    amenities: [],
    lat: 10.6765,
    limit: 10,
    lng: 122.9511,
    propertyTypes: [],
    radiusMeters: 2_000,
    sortBy: "best_match",
    ...overrides,
  };
}

describe("listings helpers", () => {
  it("maps a discovery row into a client-safe item", () => {
    const item = toDiscoveryListingItem(
      makeRow({
        photos: [{ orderIndex: 0, url: "https://example.com/a.jpg" }],
      }),
    );

    expect(item.coverPhoto).toBe("https://example.com/a.jpg");
    expect(item.city).toBe("Bacolod");
    expect(item.title).toBe("Dorm A");
  });

  it("filters discovery results by required amenities", () => {
    const items = getDiscoveryListingItems(
      [
        makeRow({ amenities: ["wifi", "ac"], title: "Match" }),
        makeRow({ amenities: ["wifi"], title: "Miss" }),
      ],
      makeListInput({ amenities: ["wifi", "ac"] }),
    );

    expect(items.map((item) => item.title)).toEqual(["Match"]);
  });

  it("sorts discovery results by top-rated score then review count", () => {
    const items = getDiscoveryListingItems(
      [
        makeRow({ ratingOverall: 4.7, reviewCount: 2, title: "Few reviews" }),
        makeRow({ ratingOverall: 4.7, reviewCount: 9, title: "More reviews" }),
        makeRow({ ratingOverall: 4.2, reviewCount: 20, title: "Lower rating" }),
      ],
      makeListInput({ sortBy: "top_rated" }),
    );

    expect(items.map((item) => item.title)).toEqual([
      "More reviews",
      "Few reviews",
      "Lower rating",
    ]);
  });

  it("sorts nearby results by distance when requested", () => {
    const items = getNearbyDiscoveryItems(
      [
        makeRow({ lat: 10.6765, lng: 122.9511, title: "Closest" }),
        makeRow({ lat: 10.6865, lng: 122.9611, title: "Farther" }),
      ],
      makeNearbyInput({ sortBy: "nearest" }),
    );

    expect(items.map((item) => item.title)).toEqual(["Closest", "Farther"]);
  });

  it("drops nearby results outside the requested radius", () => {
    const items = getNearbyDiscoveryItems(
      [
        makeRow({ lat: 10.6765, lng: 122.9511, title: "Inside" }),
        makeRow({ lat: 10.7765, lng: 123.0511, title: "Outside" }),
      ],
      makeNearbyInput({ radiusMeters: 500 }),
    );

    expect(items.map((item) => item.title)).toEqual(["Inside"]);
  });
});
