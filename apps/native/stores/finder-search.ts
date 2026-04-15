import { create } from "zustand";

import type { FinderQuotaStatus, FinderSearchCenter } from "@/types/finder";
import type { ListingListItem } from "@/types/listings";

type FinderSearchStore = {
  items: ListingListItem[];
  lastSearchAt: string | null;
  lastSearchCenter: FinderSearchCenter | null;
  lastSearchRadiusMeters: number;
  quota: FinderQuotaStatus | null;
  clearSearch: () => void;
  setQuota: (quota: FinderQuotaStatus) => void;
  setSearchResult: (input: {
    center: FinderSearchCenter;
    items: ListingListItem[];
    quota: FinderQuotaStatus;
    radiusMeters: number;
    searchedAt: string;
  }) => void;
};

export const useFinderSearchStore = create<FinderSearchStore>((set) => ({
  items: [],
  lastSearchAt: null,
  lastSearchCenter: null,
  lastSearchRadiusMeters: 500,
  quota: null,
  clearSearch: () =>
    set({
      items: [],
      lastSearchAt: null,
      lastSearchCenter: null,
      lastSearchRadiusMeters: 500,
    }),
  setQuota: (quota) => set({ quota }),
  setSearchResult: ({ center, items, quota, radiusMeters, searchedAt }) =>
    set({
      items,
      lastSearchAt: searchedAt,
      lastSearchCenter: center,
      lastSearchRadiusMeters: radiusMeters,
      quota,
    }),
}));
