import { create } from "zustand";

import { asyncStorageAdapter } from "@/lib/mmkv";
import {
  dedupeDiscoveryPresets,
  DISCOVERY_STORAGE_KEY,
} from "@/services/discovery";
import type { DiscoverySearchPreset } from "@/types/discovery";

type DiscoveryStore = {
  hydrated: boolean;
  recentSearches: DiscoverySearchPreset[];
  savedSearches: DiscoverySearchPreset[];
  hydrate: () => Promise<void>;
  pushRecentSearch: (preset: DiscoverySearchPreset) => void;
  toggleSavedSearch: (preset: DiscoverySearchPreset) => void;
};

type PersistedDiscoveryStore = {
  recentSearches: DiscoverySearchPreset[];
  savedSearches: DiscoverySearchPreset[];
};

async function persistDiscoveryState(state: PersistedDiscoveryStore) {
  await asyncStorageAdapter.setItem(DISCOVERY_STORAGE_KEY, JSON.stringify(state));
}

export const useDiscoveryStore = create<DiscoveryStore>((set, get) => ({
  hydrated: false,
  recentSearches: [],
  savedSearches: [],
  hydrate: async () => {
    if (get().hydrated) {
      return;
    }

    try {
      const raw = await asyncStorageAdapter.getItem(DISCOVERY_STORAGE_KEY);

      if (!raw) {
        set({ hydrated: true });
        return;
      }

      const parsed = JSON.parse(raw) as PersistedDiscoveryStore;
      set({
        hydrated: true,
        recentSearches: dedupeDiscoveryPresets(parsed.recentSearches ?? []),
        savedSearches: dedupeDiscoveryPresets(parsed.savedSearches ?? []),
      });
    } catch {
      set({ hydrated: true });
    }
  },
  pushRecentSearch: (preset) =>
    set((state) => {
      const nextState = {
        recentSearches: dedupeDiscoveryPresets([preset, ...state.recentSearches]),
        savedSearches: state.savedSearches,
      };

      void persistDiscoveryState(nextState);
      return nextState;
    }),
  toggleSavedSearch: (preset) =>
    set((state) => {
      const exists = state.savedSearches.some((item) => item.id === preset.id);
      const nextSaved = exists
        ? state.savedSearches.filter((item) => item.id !== preset.id)
        : dedupeDiscoveryPresets([preset, ...state.savedSearches]);

      const nextState = {
        recentSearches: state.recentSearches,
        savedSearches: nextSaved,
      };

      void persistDiscoveryState(nextState);
      return nextState;
    }),
}));
