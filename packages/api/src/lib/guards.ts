import { TRPCError } from "@trpc/server";
import { db, listings, profiles } from "@wheresmydorm/db";
import { eq } from "drizzle-orm";

type AppRole = "admin" | "finder" | "lister";

type EnsureRoleOptions = {
  message?: string;
  userId: string;
};

export async function getCurrentUserRole(userId: string) {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
    columns: { role: true },
  });

  return profile?.role ?? null;
}

async function ensureRole(
  allowedRoles: AppRole[],
  options: EnsureRoleOptions,
) {
  const role = await getCurrentUserRole(options.userId);

  if (!role || !allowedRoles.includes(role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: options.message ?? "You do not have access to this resource.",
    });
  }

  return role;
}

export async function ensureAdmin(options: EnsureRoleOptions) {
  return ensureRole(["admin"], {
    ...options,
    message: options.message ?? "Only admins can access this resource.",
  });
}

export async function ensureFinder(options: EnsureRoleOptions) {
  return ensureRole(["finder", "admin"], {
    ...options,
    message: options.message ?? "This feature is available to finders only.",
  });
}

export async function ensureLister(options: EnsureRoleOptions) {
  return ensureRole(["lister", "admin"], {
    ...options,
    message: options.message ?? "This feature is available to listers only.",
  });
}

export async function ensureListingOwner(input: {
  listingId: string;
  message?: string;
  userId: string;
}) {
  const listing = await db.query.listings.findFirst({
    where: eq(listings.id, input.listingId),
    columns: {
      id: true,
      listerId: true,
    },
  });

  if (!listing) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Listing not found.",
    });
  }

  if (listing.listerId !== input.userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        input.message ?? "Only the listing owner can perform this action.",
    });
  }

  return listing;
}
