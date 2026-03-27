import type { MapSortOption, PropertyTypeFilter } from "@/types/map";

export type DiscoverySearchPreset = {
  id: string;
  createdAt: string;
  label: string;
  maxPrice?: number;
  propertyTypes: PropertyTypeFilter[];
  query: string;
  sortBy: MapSortOption;
};
