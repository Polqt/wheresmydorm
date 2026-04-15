export const DEFAULT_FIND_RADIUS_METERS = 500;
export const FREE_FINDER_LIFETIME_FIND_LIMIT = 5;

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

export function hasAdvancedFinderFilters(input: {
  amenities: string[];
  maxPrice?: number;
  minPrice?: number;
  minRating?: number;
  propertyTypes: readonly string[];
}) {
  return (
    input.amenities.length > 0 ||
    input.propertyTypes.length > 0 ||
    input.minPrice !== undefined ||
    input.maxPrice !== undefined ||
    input.minRating !== undefined
  );
}
