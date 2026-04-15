import { db, listings } from "@wheresmydorm/db";
import { eq } from "drizzle-orm";

import { protectedProcedure } from "../index";
import { assertLister } from "../lib/guards";
import {
  FREE_LISTING_QUOTA,
  getFreeListingIdsForLister,
  getLatestListingPaymentStatusMap,
} from "../lib/listing-quotas";

export const listingQuotaProcedures = {
  listerQuotaStatus: protectedProcedure.query(async ({ ctx }) => {
    assertLister(ctx, "Only listers can access listing quota status.");

    const ownedListings = await db.query.listings.findMany({
      where: eq(listings.listerId, ctx.userId),
      columns: { id: true },
    });
    const listingIds = ownedListings.map((listing) => listing.id);
    const freeListingIds = await getFreeListingIdsForLister(ctx.userId);
    const paymentStatusMap = await getLatestListingPaymentStatusMap(listingIds);
    const listingsRequiringPayment = listingIds.filter(
      (listingId) => !freeListingIds.has(listingId),
    );
    const pendingListingFeesCount = listingsRequiringPayment.filter(
      (listingId) =>
        paymentStatusMap.get(listingId)?.listingFeeStatus === "pending",
    ).length;
    const paidListingFeesCount = listingsRequiringPayment.filter(
      (listingId) =>
        paymentStatusMap.get(listingId)?.listingFeeStatus === "paid",
    ).length;

    return {
      freeListingQuota: FREE_LISTING_QUOTA,
      listingsRequiringPayment: listingsRequiringPayment.length,
      paidListingFeesCount,
      pendingListingFeesCount,
      remainingFreeListings: Math.max(
        FREE_LISTING_QUOTA - ownedListings.length,
        0,
      ),
      totalListings: ownedListings.length,
    };
  }),
};
