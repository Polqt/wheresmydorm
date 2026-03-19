export type PropertyTypeFilter =
  | "dorm"
  | "apartment"
  | "bedspace"
  | "condo"
  | "boarding_house"
  | "studio";

export type MapFilters = {
  minPrice?: number;
  maxPrice?: number;
  propertyTypes: PropertyTypeFilter[];
  amenities: string[];
  minRating?: number;
  distanceMeters: number;
};
