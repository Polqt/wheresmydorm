export type PropertyTypeFilter =
  | "dorm"
  | "apartment"
  | "bedspace"
  | "condo"
  | "boarding_house"
  | "studio";

export type MapSortOption =
  | "best_match"
  | "nearest"
  | "price_low_to_high"
  | "price_high_to_low"
  | "top_rated"
  | "newest";

export type MapFilters = {
  availableBy?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyTypes: PropertyTypeFilter[];
  amenities: string[];
  minRating?: number;
  distanceMeters: number;
  sortBy: MapSortOption;
};
