import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useCurrentProfile } from "@/hooks/use-current-profile";
import { useAuth } from "@/providers/auth-provider";
import {
  buildDiscoveryPreset,
  mapRecentSearchToPreset,
  mapSavedSearchToPreset,
} from "@/services/discovery";
import { getDiscoveryQueryInput } from "@/services/listings";
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
  return (values ?? []).filter((value): value is PropertyTypeFilter =>
    VALID_PROPERTY_TYPES.has(value as PropertyTypeFilter),
  );
}

export function useFinderDiscovery() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const profileQuery = useCurrentProfile(user);
  const lastNearbyItems = useFinderSearchStore((state) => state.items);

  const [searchText, setSearchText] = useState("");
  const [submittedSearchText, setSubmittedSearchText] = useState("");

  const finderPropertyTypes = useMemo(
    () => normalizePropertyTypes(profileQuery.data?.finderPropertyTypes),
    [profileQuery.data?.finderPropertyTypes],
  );
  const budgetMax = profileQuery.data?.finderBudgetMax
    ? Number(profileQuery.data.finderBudgetMax)
    : undefined;
  const query = submittedSearchText.trim();

  const discoverQuery = useQuery(trpc.listings.discover.queryOptions());
  const recentSearchesQuery = useQuery(
    trpc.listings.recentSearches.queryOptions(),
  );
  const savedSearchesQuery = useQuery(
    trpc.listings.savedSearches.queryOptions(),
  );

  const saveSearchMutation = useMutation(
    trpc.listings.saveSearch.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ["trpc", "listings", "savedSearches"],
        });
      },
    }),
  );

  const deleteSavedSearchMutation = useMutation(
    trpc.listings.deleteSavedSearch.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ["trpc", "listings", "savedSearches"],
        });
      },
    }),
  );

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

  const recentSearches = useMemo(
    () => (recentSearchesQuery.data ?? []).map(mapRecentSearchToPreset),
    [recentSearchesQuery.data],
  );
  const savedSearches = useMemo(
    () => (savedSearchesQuery.data ?? []).map(mapSavedSearchToPreset),
    [savedSearchesQuery.data],
  );

  const [searchResultsQuery] = useQueries({
    queries: [
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
        enabled: query.length > 0,
      },
    ],
  });

  useEffect(() => {
    if (query.length === 0 || !searchResultsQuery.data) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: ["trpc", "listings", "recentSearches"],
    });
  }, [query, queryClient, searchResultsQuery.data]);

  const submitSearch = useCallback(() => {
    setSubmittedSearchText(searchText.trim());
  }, [searchText]);

  const applyPreset = useCallback((preset: DiscoverySearchPreset) => {
    setSearchText(preset.query);
    setSubmittedSearchText(preset.query);
  }, []);

  const toggleSaveCurrentSearch = useCallback(() => {
    const existingPreset = savedSearches.find(
      (preset) => preset.id === currentPreset.id,
    );

    if (existingPreset?.serverId) {
      deleteSavedSearchMutation.mutate({ id: existingPreset.serverId });
      return;
    }

    saveSearchMutation.mutate({
      filters: getDiscoveryQueryInput({
        amenities: [],
        maxPrice: currentPreset.maxPrice,
        propertyTypes: currentPreset.propertyTypes,
        query: currentPreset.query || undefined,
        sortBy: currentPreset.sortBy,
      }),
      label: currentPreset.label,
    });
  }, [
    currentPreset,
    deleteSavedSearchMutation,
    saveSearchMutation,
    savedSearches,
  ]);

  return {
    applyPreset,
    currentPreset,
    hasSavedCurrentSearch: savedSearches.some(
      (preset) => preset.id === currentPreset.id,
    ),
    lastNearbyItems,
    newArrivals: discoverQuery.data?.newArrivals ?? [],
    recentSearches,
    savedSearches,
    searchResults: searchResultsQuery.data ?? [],
    searchText,
    setSearchText,
    submitSearch,
    toggleSaveCurrentSearch,
    topRated: discoverQuery.data?.topRated ?? [],
    underBudget: discoverQuery.data?.underThreeThousand ?? [],
  };
}
