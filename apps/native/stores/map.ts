import { MapFilters } from "@/types/map";
import type {
  ListingDetail,
  NearbyListing,
} from "@/services/listings";

import { create } from "zustand";

type MapStore = {
  filters: MapFilters;
  selectedListingId: string | null;
  isFilterOpen: boolean;
  setFilters: (updater: (filters: MapFilters) => MapFilters) => void;
  setSelectedListingId: (listingId: string | null) => void;
  setFilterOpen: (isOpen: boolean) => void;
  resetFilters: () => void;
};

const defaultFilters: MapFilters = {
  propertyTypes: [],
  amenities: [],
  distanceMeters: 4000,
};

export const useMapStore = create<MapStore>((set) => ({
  filters: defaultFilters,
  selectedListingId: null,
  isFilterOpen: false,
  setFilters: (updater) =>
    set((state) => ({
      filters: updater(state.filters),
    })),
  setSelectedListingId: (selectedListingId) => set({ selectedListingId }),
  setFilterOpen: (isFilterOpen) => set({ isFilterOpen }),
  resetFilters: () => set({ filters: defaultFilters }),
}));

export type { ListingDetail, NearbyListing };
