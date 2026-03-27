import { create } from "zustand";

import type { MapStore } from "@/types/location";
import {
  areMapFiltersEqual,
  cloneMapFilters,
  DEFAULT_MAP_FILTERS,
} from "@/utils/map-filters";

export const useMapStore = create<MapStore>((set) => ({
  filters: cloneMapFilters(DEFAULT_MAP_FILTERS),
  selectedListingId: null,
  isFilterOpen: false,
  setFilters: (updater) =>
    set((state) => {
      const nextFilters = updater(state.filters);

      if (areMapFiltersEqual(state.filters, nextFilters)) {
        return state;
      }

      return {
        filters: cloneMapFilters(nextFilters),
      };
    }),
  setSelectedListingId: (selectedListingId) => set({ selectedListingId }),
  setFilterOpen: (isFilterOpen) => set({ isFilterOpen }),
  resetFilters: () =>
    set((state) => {
      if (areMapFiltersEqual(state.filters, DEFAULT_MAP_FILTERS)) {
        return state;
      }

      return {
        filters: cloneMapFilters(DEFAULT_MAP_FILTERS),
      };
    }),
}));
