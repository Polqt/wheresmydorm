import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@wheresmydorm/api/routers/index";

type RouterInputs = inferRouterInputs<AppRouter>;
type RouterOutputs = inferRouterOutputs<AppRouter>;

export type ListingListFilters = RouterInputs["listings"]["list"];
export type ListingListItem = RouterOutputs["listings"]["list"][number];
export type ListingDetail = RouterOutputs["listings"]["getById"];
export type MyListing = RouterOutputs["listings"]["myListings"][number];
export type SavedListing = RouterOutputs["listings"]["savedListings"][number];
export type ListingCreateInput = RouterInputs["listings"]["create"];
export type ListingUpdateInput = RouterInputs["listings"]["update"];
export type ListingStatus = RouterInputs["listings"]["setStatus"]["status"];
export type ListingPropertyType = ListingCreateInput["propertyType"];

export type ListingFormValues = {
  title: string;
  description: string;
  propertyType: ListingPropertyType;
  pricePerMonth: string;
  lat: string;
  lng: string;
  address: string;
  city: string;
  barangay: string;
  maxOccupants: string;
  sizeSqm: string;
  amenities: string;
};
