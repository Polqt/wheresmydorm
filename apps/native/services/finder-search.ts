import type {
  FinderFindNearbyInput,
  FinderQuotaStatus,
  FinderSearchCenter,
} from "@/types/finder";
import type { MapFilters } from "@/types/map";

export const DEFAULT_FIND_RADIUS_METERS = 500;
export const FREE_FINDER_LIFETIME_FIND_LIMIT = 5;

type CreateFindNearbyInputArgs = {
  coords: { latitude: number; longitude: number };
  filters: MapFilters;
};

export function createFindNearbyInput({
  coords,
  filters,
}: CreateFindNearbyInputArgs): FinderFindNearbyInput {
  return {
    amenities: filters.amenities,
    availableBy: filters.availableBy,
    lat: coords.latitude,
    limit: 150,
    lng: coords.longitude,
    maxPrice: filters.maxPrice,
    minPrice: filters.minPrice,
    minRating: filters.minRating,
    propertyTypes: filters.propertyTypes,
    radiusMeters: filters.distanceMeters,
    sortBy: filters.sortBy,
  };
}

export function formatFindRadius(radiusMeters: number) {
  return radiusMeters >= 1000
    ? `${(radiusMeters / 1000).toFixed(radiusMeters % 1000 === 0 ? 0 : 1)} km`
    : `${radiusMeters} m`;
}

export function isAdvancedFinderFiltersEnabled(
  quota: FinderQuotaStatus | null | undefined,
) {
  return Boolean(quota?.advancedFiltersEnabled);
}

export function getFinderQuotaCopy(
  quota: FinderQuotaStatus | null | undefined,
) {
  if (!quota) {
    return `Free finder accounts get ${FREE_FINDER_LIFETIME_FIND_LIMIT} nearby finds total.`;
  }

  if (quota.hasUnlimitedFinds) {
    return "Unlimited nearby finds and advanced filters are active.";
  }

  if (quota.remainingFinds <= 0) {
    return `You used all ${quota.lifetimeLimit} free finds.`;
  }

  return `${quota.remainingFinds} of ${quota.lifetimeLimit} free finds remaining.`;
}

export function getFinderSearchLabel(input: {
  center: FinderSearchCenter | null;
  fallbackLabel: string;
  radiusMeters: number;
}) {
  if (!input.center) {
    return input.fallbackLabel;
  }

  return `Showing listings within ${formatFindRadius(input.radiusMeters)} of ${input.center.label}.`;
}
