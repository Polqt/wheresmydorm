import { router } from "../index";
import { listingDiscoveryProcedures } from "./listings.discovery";
import { listingManagementProcedures } from "./listings.management";
import { listingQuotaProcedures } from "./listings.quotas";
import { listingSearchProcedures } from "./listings.searches";

export const listingsRouter = router({
  ...listingDiscoveryProcedures,
  ...listingSearchProcedures,
  ...listingManagementProcedures,
  ...listingQuotaProcedures,
});
