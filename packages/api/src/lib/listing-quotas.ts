import { TRPCError } from "@trpc/server";
import { db, listings, payments } from "@wheresmydorm/db";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import type { FindNearbyInput } from "./listings";

export type FinderQuotaRow = {
  allowed: boolean;
  daily_limit: number;
  is_paid: boolean;
  remaining_finds: number;
  used_today: number;
};

export const FREE_LISTING_QUOTA = 2;

export function toFinderQuotaStatus(row: FinderQuotaRow) {
  return {
    advancedFiltersEnabled: row.is_paid,
    canFind: row.allowed,
    dailyLimit: row.daily_limit,
    hasUnlimitedFinds: row.is_paid,
    isPaid: row.is_paid,
    remainingFinds: row.remaining_finds,
    usedToday: row.used_today,
  };
}

function normalizeFinderQuotaRow(row: Record<string, unknown>): FinderQuotaRow {
  return {
    allowed: Boolean(row.allowed),
    daily_limit: Number(row.daily_limit ?? 0),
    is_paid: Boolean(row.is_paid),
    remaining_finds: Number(row.remaining_finds ?? 0),
    used_today: Number(row.used_today ?? 0),
  };
}

export async function getFinderQuotaRow(userId: string): Promise<FinderQuotaRow> {
  const result = await db.execute(sql<FinderQuotaRow>`
    select *
    from public.get_finder_find_quota(${userId})
  `);
  const row = result.rows[0];

  if (!row) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Finder quota is unavailable right now.",
    });
  }

  return normalizeFinderQuotaRow(row);
}

export async function consumeFinderFindRow(
  userId: string,
  input: Pick<FindNearbyInput, "lat" | "lng" | "radiusMeters">,
): Promise<FinderQuotaRow> {
  const result = await db.execute(sql<FinderQuotaRow>`
    select *
    from public.consume_finder_find(${userId}, ${input.lat}, ${input.lng}, ${input.radiusMeters})
  `);
  const row = result.rows[0];

  if (!row) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Finder quota could not be updated.",
    });
  }

  return normalizeFinderQuotaRow(row);
}

export async function getFreeListingIdsForLister(userId: string) {
  const ownedListings = await db.query.listings.findMany({
    where: eq(listings.listerId, userId),
    columns: {
      id: true,
    },
    orderBy: [asc(listings.createdAt)],
    limit: FREE_LISTING_QUOTA,
  });

  return new Set(ownedListings.map((listing) => listing.id));
}

export async function getLatestListingPaymentStatusMap(listingIds: string[]) {
  if (listingIds.length === 0) {
    return new Map<
      string,
      {
        boostPaymentStatus: "failed" | "paid" | "pending" | "refunded" | null;
        listingFeeStatus: "failed" | "paid" | "pending" | "refunded" | null;
      }
    >();
  }

  const paymentRows = await db.query.payments.findMany({
    where: and(
      inArray(payments.listingId, listingIds),
      inArray(payments.type, ["listing_boost", "listing_fee"]),
    ),
    orderBy: [desc(payments.createdAt)],
    columns: {
      listingId: true,
      status: true,
      type: true,
    },
  });

  const paymentMap = new Map<
    string,
    {
      boostPaymentStatus: "failed" | "paid" | "pending" | "refunded" | null;
      listingFeeStatus: "failed" | "paid" | "pending" | "refunded" | null;
    }
  >();

  for (const payment of paymentRows) {
    if (!payment.listingId) {
      continue;
    }

    const current = paymentMap.get(payment.listingId) ?? {
      boostPaymentStatus: null,
      listingFeeStatus: null,
    };

    if (payment.type === "listing_fee" && current.listingFeeStatus == null) {
      current.listingFeeStatus = payment.status;
    }

    if (payment.type === "listing_boost" && current.boostPaymentStatus == null) {
      current.boostPaymentStatus = payment.status;
    }

    paymentMap.set(payment.listingId, current);
  }

  return paymentMap;
}
