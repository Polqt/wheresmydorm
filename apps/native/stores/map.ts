import { create } from "zustand";
import type { MapFilters } from "@/types/map";
import { MapStore } from "@/types/location";

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
