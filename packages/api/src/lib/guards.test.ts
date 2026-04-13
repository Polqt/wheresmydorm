import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockListingsFindFirst, mockProfilesFindFirst } = vi.hoisted(() => ({
  mockListingsFindFirst: vi.fn(),
  mockProfilesFindFirst: vi.fn(),
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => ({ kind: "eq" })),
}));

vi.mock("@wheresmydorm/db", () => ({
  db: {
    query: {
      listings: {
        findFirst: mockListingsFindFirst,
      },
      profiles: {
        findFirst: mockProfilesFindFirst,
      },
    },
  },
  listings: {
    id: "listings.id",
    listerId: "listings.listerId",
  },
  profiles: {
    id: "profiles.id",
  },
}));

import {
  ensureAdmin,
  ensureFinder,
  ensureListingOwner,
  ensureLister,
  getCurrentUserRole,
} from "./guards";

describe("guards", () => {
  beforeEach(() => {
    mockProfilesFindFirst.mockReset();
    mockListingsFindFirst.mockReset();
  });

  it("returns the current user role when the profile exists", async () => {
    mockProfilesFindFirst.mockResolvedValue({ role: "finder" });

    await expect(getCurrentUserRole("user-1")).resolves.toBe("finder");
  });

  it("allows finder-only access for finder users", async () => {
    mockProfilesFindFirst.mockResolvedValue({ role: "finder" });

    await expect(ensureFinder({ userId: "user-1" })).resolves.toBe("finder");
  });

  it("rejects admin-only access for non-admin users", async () => {
    mockProfilesFindFirst.mockResolvedValue({ role: "lister" });

    await expect(ensureAdmin({ userId: "user-1" })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Only admins can access this resource.",
    } satisfies Partial<TRPCError>);
  });

  it("allows lister-only access for admins", async () => {
    mockProfilesFindFirst.mockResolvedValue({ role: "admin" });

    await expect(ensureLister({ userId: "user-1" })).resolves.toBe("admin");
  });

  it("returns the listing when the current user owns it", async () => {
    mockListingsFindFirst.mockResolvedValue({
      id: "listing-1",
      listerId: "user-1",
    });

    await expect(
      ensureListingOwner({ listingId: "listing-1", userId: "user-1" }),
    ).resolves.toEqual({
      id: "listing-1",
      listerId: "user-1",
    });
  });

  it("throws not found when the listing does not exist", async () => {
    mockListingsFindFirst.mockResolvedValue(undefined);

    await expect(
      ensureListingOwner({ listingId: "listing-1", userId: "user-1" }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Listing not found.",
    } satisfies Partial<TRPCError>);
  });

  it("throws forbidden when another user owns the listing", async () => {
    mockListingsFindFirst.mockResolvedValue({
      id: "listing-1",
      listerId: "user-2",
    });

    await expect(
      ensureListingOwner({ listingId: "listing-1", userId: "user-1" }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Only the listing owner can perform this action.",
    } satisfies Partial<TRPCError>);
  });
});
