import type {
  ListingDetail,
  ListingFormValues,
  ListingPropertyType,
} from "@/types/listings";
import type { MapSortOption } from "@/types/map";

export const DISCOVERY_FALLBACK_COORDS = {
  latitude: 10.6765,
  longitude: 122.9511,
};

export const LISTING_PROPERTY_TYPES: Array<{
  label: string;
  value: ListingPropertyType;
}> = [
  { value: "dorm", label: "Dorm" },
  { value: "apartment", label: "Apartment" },
  { value: "bedspace", label: "Bedspace" },
  { value: "condo", label: "Condo" },
  { value: "boarding_house", label: "Boarding House" },
  { value: "studio", label: "Studio" },
];

export const DEFAULT_LISTING_FORM: ListingFormValues = {
  title: "",
  description: "",
  propertyType: "dorm",
  pricePerMonth: "",
  lat: String(DISCOVERY_FALLBACK_COORDS.latitude),
  lng: String(DISCOVERY_FALLBACK_COORDS.longitude),
  address: "",
  city: "Bacolod",
  barangay: "",
  maxOccupants: "",
  sizeSqm: "",
  amenities: "",
};
export function getDiscoveryQueryInput(filters: {
  amenities: string[];
  availableBy?: string;
  maxPrice?: number;
  minPrice?: number;
  minRating?: number;
  propertyTypes: ListingPropertyType[];
  query?: string;
  sortBy?: MapSortOption;
  limit?: number;
}) {
  return {
    amenities: filters.amenities,
    availableBy: filters.availableBy,
    limit: filters.limit ?? 150,
    maxPrice: filters.maxPrice,
    minPrice: filters.minPrice,
    minRating: filters.minRating,
    propertyTypes: filters.propertyTypes,
    query: filters.query,
    sortBy: filters.sortBy ?? "best_match",
  };
}

export function createListingFormValues(
  listing?: ListingDetail,
): ListingFormValues {
  if (!listing) {
    return DEFAULT_LISTING_FORM;
  }

  return {
    title: listing.title,
    description: listing.description,
    propertyType: listing.propertyType,
    pricePerMonth: String(Number(listing.pricePerMonth)),
    lat: String(listing.lat),
    lng: String(listing.lng),
    address: listing.address,
    city: listing.city,
    barangay: listing.barangay ?? "",
    maxOccupants: listing.maxOccupants ? String(listing.maxOccupants) : "",
    sizeSqm: listing.sizeSqm ? String(listing.sizeSqm) : "",
    amenities: listing.amenities.join(", "),
  };
}

export function parseAmenities(value: string) {
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}
