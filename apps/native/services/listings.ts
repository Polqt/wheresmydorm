import type {
  ListingDetail,
  ListingFormValues,
  ListingListItem,
  ListingPropertyType,
} from "@/types/listings";
import type { MapFilters } from "@/types/map";

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

type DiscoveryInput = {
  filters: MapFilters;
  lat: number;
  lng: number;
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceBetweenMeters(
  left: { lat: number; lng: number },
  right: { lat: number; lng: number },
) {
  const earthRadiusMeters = 6_371_000;
  const latDelta = toRadians(right.lat - left.lat);
  const lngDelta = toRadians(right.lng - left.lng);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRadians(left.lat)) *
      Math.cos(toRadians(right.lat)) *
      Math.sin(lngDelta / 2) ** 2;

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function applyListingFilters(
  listings: ListingListItem[],
  origin: { lat: number; lng: number },
  filters: MapFilters,
) {
  return listings
    .filter((listing) =>
      filters.amenities.every((amenity) => listing.amenities.includes(amenity)),
    )
    .map((listing) => ({
      distanceMeters: distanceBetweenMeters(origin, {
        lat: listing.lat,
        lng: listing.lng,
      }),
      listing,
    }))
    .filter(({ distanceMeters }) => distanceMeters <= filters.distanceMeters)
    .sort((left, right) => {
      if (left.listing.isFeatured !== right.listing.isFeatured) {
        return left.listing.isFeatured ? -1 : 1;
      }

      if (left.distanceMeters !== right.distanceMeters) {
        return left.distanceMeters - right.distanceMeters;
      }

      const leftRating = left.listing.ratingOverall ?? 0;
      const rightRating = right.listing.ratingOverall ?? 0;

      if (leftRating !== rightRating) {
        return rightRating - leftRating;
      }

      return right.listing.reviewCount - left.listing.reviewCount;
    })
    .map(({ listing }) => listing);
}

export function getDiscoveryQueryInput(filters: MapFilters) {
  return {
    amenities: filters.amenities,
    limit: 150,
    maxPrice: filters.maxPrice,
    minPrice: filters.minPrice,
    minRating: filters.minRating,
    propertyTypes: filters.propertyTypes,
  };
}

export function getFilteredDiscoveryListings(
  listings: ListingListItem[],
  input: DiscoveryInput,
) {
  return applyListingFilters(
    listings,
    { lat: input.lat, lng: input.lng },
    input.filters,
  );
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
