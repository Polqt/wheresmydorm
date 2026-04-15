import type { MapSortOption, PropertyTypeFilter } from "@/types/map";

export type DiscoverySearchPreset = {
  id: string;
  serverId?: string;
  createdAt: string;
  label: string;
  maxPrice?: number;
  propertyTypes: PropertyTypeFilter[];
  query: string;
  sortBy: MapSortOption;
};
