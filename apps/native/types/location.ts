import { MapFilters } from "./map";

export type MapStore = {
  filters: MapFilters;
  selectedListingId: string | null;
  isFilterOpen: boolean;
  setFilters: (updater: (filters: MapFilters) => MapFilters) => void;
  setSelectedListingId: (listingId: string | null) => void;
  setFilterOpen: (isOpen: boolean) => void;
  resetFilters: () => void;
};

export type LocationState = {
  coords: { latitude: number; longitude: number };
  label: string;
  isReady: boolean;
};