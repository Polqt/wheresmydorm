import { TRPCError } from "@trpc/server";
import { db, listings } from "@wheresmydorm/db";
import { eq } from "drizzle-orm";

type AppRole = "admin" | "finder" | "lister";

/**
 * Minimal context shape required by role-check guards.
 * Matches the narrowed ctx produced by protectedProcedure.
 */
type RoleCtx = { role: AppRole | null; userId: string };

// ---------------------------------------------------------------------------
// Role guards — use ctx.role injected at createContext time (zero extra DB queries)
// ---------------------------------------------------------------------------

export function assertFinder(ctx: RoleCtx, message?: string): void {
  if (ctx.role !== "finder" && ctx.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: message ?? "This feature is available to finders only.",
    });
  }
}

export function assertLister(ctx: RoleCtx, message?: string): void {
  if (ctx.role !== "lister" && ctx.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: message ?? "This feature is available to listers only.",
    });
  }
}

// ---------------------------------------------------------------------------
// Listing ownership guard — still needs a DB read (ownership is data, not role)
// ---------------------------------------------------------------------------

export async function assertListingOwner(input: {
  listingId: string;
  message?: string;
  userId: string;
}) {
  const listing = await db.query.listings.findFirst({
    where: eq(listings.id, input.listingId),
    columns: { id: true, listerId: true },
  });

  if (!listing) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found." });
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

// ---------------------------------------------------------------------------
// Legacy async wrappers — kept so existing callers that pass { userId } still
// compile.  They delegate to the ctx-aware versions above.
// Prefer assertFinder / assertLister in new code.
// ---------------------------------------------------------------------------

type LegacyOptions = { message?: string; userId: string };

/** @deprecated Pass ctx directly with assertFinder(ctx) */
export async function ensureFinder(options: LegacyOptions): Promise<void> {
  const role = await _fetchRole(options.userId);
  if (role !== "finder" && role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: options.message ?? "This feature is available to finders only.",
    });
  }
}

/** @deprecated Pass ctx directly with assertLister(ctx) */
export async function ensureLister(options: LegacyOptions): Promise<void> {
  const role = await _fetchRole(options.userId);
  if (role !== "lister" && role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: options.message ?? "This feature is available to listers only.",
    });
  }
}

/** @deprecated Use assertListingOwner */
export const ensureListingOwner = assertListingOwner;

/** @deprecated Internal — use ctx.role from createContext */
export async function getCurrentUserRole(
  userId: string,
): Promise<AppRole | null> {
  return _fetchRole(userId);
}

/** @deprecated Use adminProcedure middleware instead */
export async function ensureAdmin(options: LegacyOptions): Promise<void> {
  const role = await _fetchRole(options.userId);
  if (role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: options.message ?? "Only admins can access this resource.",
    });
  }
}

async function _fetchRole(userId: string): Promise<AppRole | null> {
  const { profiles } = await import("@wheresmydorm/db");
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
    columns: { role: true },
  });
  return (profile?.role ?? null) as AppRole | null;
}
