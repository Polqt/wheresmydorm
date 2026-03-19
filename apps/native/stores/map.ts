import { MapFilters } from "@/types/map";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@wheresmydorm/api/routers/index";

import { create } from "zustand";

type RouterOutputs = inferRouterOutputs<AppRouter>;

export type NearbyListing = RouterOutputs["listings"]["getNearby"][number];
export type ListingDetail = RouterOutputs["listings"]["getById"];

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
