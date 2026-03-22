import { formatProfileName } from "@/lib/profile";
import type { MapFilters, PropertyTypeFilter } from "@/types/map";
import { supabase } from "@/utils/supabase";

type ListingSummaryRow = {
  amenities: string[] | null;
  barangay: string | null;
  city: string;
  id: string;
  is_featured: boolean;
  lat: number;
  lng: number;
  price_per_month: string;
  property_type: PropertyTypeFilter;
  rating_overall: number | null;
  review_count: number;
  title: string;
};

type ListingDetailRow = ListingSummaryRow & {
  address: string;
  description: string;
  lister_id: string;
  max_occupants: number | null;
  size_sqm: number | null;
};

type ListingPhotoRow = {
  id: string;
  order_index: number;
  url: string;
};

type ProfileRow = {
  first_name: string;
  id: string;
  last_name: string | null;
};

export type NearbyListing = {
  amenities: string[];
  barangay: string | null;
  city: string;
  id: string;
  isFeatured: boolean;
  lat: number;
  lng: number;
  pricePerMonth: string;
  propertyType: PropertyTypeFilter;
  ratingOverall: number | null;
  reviewCount: number;
  title: string;
};

export type ListingDetail = NearbyListing & {
  address: string;
  description: string;
  lister: {
    displayName: string;
    id: string;
  };
  maxOccupants: number | null;
  photos: Array<{
    id: string;
    orderIndex: number;
    url: string;
  }>;
  sizeSqm: number | null;
};

type NearbyListingsInput = {
  filters: MapFilters;
  lat: number;
  lng: number;
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceBetweenMeters(
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

function normalizeNearbyListing(row: ListingSummaryRow): NearbyListing {
  return {
    amenities: row.amenities ?? [],
    barangay: row.barangay,
    city: row.city,
    id: row.id,
    isFeatured: row.is_featured,
    lat: row.lat,
    lng: row.lng,
    pricePerMonth: row.price_per_month,
    propertyType: row.property_type,
    ratingOverall: row.rating_overall,
    reviewCount: row.review_count,
    title: row.title,
  };
}

function applyClientFilters(
  listings: NearbyListing[],
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

export async function getNearbyListings({
  filters,
  lat,
  lng,
}: NearbyListingsInput) {
  let query = supabase
    .from("listings")
    .select(
      "id, title, property_type, price_per_month, lat, lng, city, barangay, rating_overall, review_count, amenities, is_featured",
    )
    .eq("status", "active")
    .eq("is_available", true)
    .limit(150);

  if (filters.propertyTypes.length > 0) {
    query = query.in("property_type", filters.propertyTypes);
  }

  if (filters.minPrice !== undefined) {
    query = query.gte("price_per_month", filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    query = query.lte("price_per_month", filters.maxPrice);
  }

  if (filters.minRating !== undefined) {
    query = query.gte("rating_overall", filters.minRating);
  }

  const { data, error } = await query.returns<ListingSummaryRow[]>();

  if (error) {
    throw error;
  }

  return applyClientFilters(
    (data ?? []).map(normalizeNearbyListing),
    { lat, lng },
    filters,
  );
}

export async function getListingById(id: string) {
  const { data: listingRow, error: listingError } = await supabase
    .from("listings")
    .select(
      "id, lister_id, title, description, property_type, price_per_month, size_sqm, max_occupants, lat, lng, address, city, barangay, amenities, is_featured, rating_overall, review_count",
    )
    .eq("id", id)
    .maybeSingle<ListingDetailRow>();

  if (listingError) {
    throw listingError;
  }

  if (!listingRow) {
    throw new Error("Listing not found.");
  }

  const [{ data: photoRows, error: photosError }, { data: listerRow, error: listerError }] =
    await Promise.all([
      supabase
        .from("listing_photos")
        .select("id, url, order_index")
        .eq("listing_id", id)
        .order("order_index", { ascending: true })
        .returns<ListingPhotoRow[]>(),
      supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("id", listingRow.lister_id)
        .maybeSingle<ProfileRow>(),
    ]);

  if (photosError) {
    throw photosError;
  }

  if (listerError) {
    throw listerError;
  }

  const listing = normalizeNearbyListing(listingRow);

  return {
    ...listing,
    address: listingRow.address,
    description: listingRow.description,
    lister: {
      displayName: listerRow
        ? formatProfileName({
            firstName: listerRow.first_name,
            lastName: listerRow.last_name,
          })
        : "Unknown lister",
      id: listingRow.lister_id,
    },
    maxOccupants: listingRow.max_occupants,
    photos: (photoRows ?? []).map((photo) => ({
      id: photo.id,
      orderIndex: photo.order_index,
      url: photo.url,
    })),
    sizeSqm: listingRow.size_sqm,
  } satisfies ListingDetail;
}
