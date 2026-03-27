import { useQueries } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useCurrentProfile } from "@/hooks/use-current-profile";
import { useAuth } from "@/providers/auth-provider";
import { buildDiscoveryPreset } from "@/services/discovery";
import { getDiscoveryQueryInput } from "@/services/listings";
import { useDiscoveryStore } from "@/stores/discovery";
import { useFinderSearchStore } from "@/stores/finder-search";
import type { DiscoverySearchPreset } from "@/types/discovery";
import type { PropertyTypeFilter } from "@/types/map";
import { trpc } from "@/utils/api-client";

const VALID_PROPERTY_TYPES = new Set<PropertyTypeFilter>([
  "dorm",
  "apartment",
  "bedspace",
  "condo",
  "boarding_house",
  "studio",
]);

function normalizePropertyTypes(values: string[] | undefined) {
  return (values ?? []).filter(
    (value): value is PropertyTypeFilter =>
      VALID_PROPERTY_TYPES.has(value as PropertyTypeFilter),
  );
}

export function useFinderDiscovery() {
  const { user } = useAuth();
  const profileQuery = useCurrentProfile(user);
  const lastNearbyItems = useFinderSearchStore((state) => state.items);
  const hydrate = useDiscoveryStore((state) => state.hydrate);
  const hydrated = useDiscoveryStore((state) => state.hydrated);
  const recentSearches = useDiscoveryStore((state) => state.recentSearches);
  const savedSearches = useDiscoveryStore((state) => state.savedSearches);
  const pushRecentSearch = useDiscoveryStore((state) => state.pushRecentSearch);
  const toggleSavedSearch = useDiscoveryStore((state) => state.toggleSavedSearch);

  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const finderPropertyTypes = useMemo(
    () => normalizePropertyTypes(profileQuery.data?.finderPropertyTypes),
    [profileQuery.data?.finderPropertyTypes],
  );
  const budgetMax = profileQuery.data?.finderBudgetMax
    ? Number(profileQuery.data.finderBudgetMax)
    : undefined;
  const query = searchText.trim();

  const currentPreset = useMemo(
    () =>
      buildDiscoveryPreset({
        label: query ? `Search: ${query}` : undefined,
        maxPrice: budgetMax,
        propertyTypes: finderPropertyTypes,
        query,
        sortBy: query ? "best_match" : "top_rated",
      }),
    [budgetMax, finderPropertyTypes, query],
  );

  const [
    topRatedQuery,
    newArrivalsQuery,
    budgetQuery,
    searchResultsQuery,
  ] = useQueries({
    queries: [
      trpc.listings.list.queryOptions(
        getDiscoveryQueryInput({
          amenities: [],
          limit: 10,
          propertyTypes: finderPropertyTypes,
          sortBy: "top_rated",
        }),
      ),
      trpc.listings.list.queryOptions(
        getDiscoveryQueryInput({
          amenities: [],
          limit: 10,
          propertyTypes: finderPropertyTypes,
          sortBy: "newest",
        }),
      ),
      trpc.listings.list.queryOptions(
        getDiscoveryQueryInput({
          amenities: [],
          limit: 10,
          maxPrice: budgetMax ?? 3000,
          propertyTypes: finderPropertyTypes,
          sortBy: "price_low_to_high",
        }),
      ),
      {
        ...trpc.listings.list.queryOptions(
          getDiscoveryQueryInput({
            amenities: [],
            limit: 12,
            maxPrice: budgetMax,
            propertyTypes: finderPropertyTypes,
            query,
            sortBy: "best_match",
          }),
        ),
        enabled: hydrated && query.length > 0,
      },
    ],
  });

  const submitSearch = useCallback(() => {
    if (!query) {
      return;
    }

    pushRecentSearch(
      buildDiscoveryPreset({
        label: `Search: ${query}`,
        maxPrice: budgetMax,
        propertyTypes: finderPropertyTypes,
        query,
      }),
    );
  }, [budgetMax, finderPropertyTypes, pushRecentSearch, query]);

  const applyPreset = useCallback(
    (preset: DiscoverySearchPreset) => {
      setSearchText(preset.query);
      pushRecentSearch(preset);
    },
    [pushRecentSearch],
  );

  const toggleSaveCurrentSearch = useCallback(() => {
    toggleSavedSearch(currentPreset);
  }, [currentPreset, toggleSavedSearch]);

  return {
    applyPreset,
    currentPreset,
    hasSavedCurrentSearch: savedSearches.some(
      (preset) => preset.id === currentPreset.id,
    ),
    hydrated,
    lastNearbyItems,
    newArrivals: newArrivalsQuery.data ?? [],
    recentSearches,
    savedSearches,
    searchResults: searchResultsQuery.data ?? [],
    searchText,
    setSearchText,
    submitSearch,
    toggleSaveCurrentSearch,
    topRated: topRatedQuery.data ?? [],
    underBudget: budgetQuery.data ?? [],
  };
}
