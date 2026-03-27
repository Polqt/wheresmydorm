import type { MapFilters } from "@/types/map";

export const DEFAULT_MAP_FILTERS: MapFilters = {
  availableBy: undefined,
  propertyTypes: [],
  amenities: [],
  distanceMeters: 500,
  maxPrice: undefined,
  minPrice: undefined,
  minRating: undefined,
  sortBy: "best_match",
};

function areStringArraysEqual(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

export function areMapFiltersEqual(left: MapFilters, right: MapFilters) {
  return (
    left.availableBy === right.availableBy &&
    left.distanceMeters === right.distanceMeters &&
    left.maxPrice === right.maxPrice &&
    left.minPrice === right.minPrice &&
    left.minRating === right.minRating &&
    left.sortBy === right.sortBy &&
    areStringArraysEqual(left.amenities, right.amenities) &&
    areStringArraysEqual(left.propertyTypes, right.propertyTypes)
  );
}

export function cloneMapFilters(filters: MapFilters): MapFilters {
  return {
    ...filters,
    amenities: [...filters.amenities],
    propertyTypes: [...filters.propertyTypes],
  };
}
