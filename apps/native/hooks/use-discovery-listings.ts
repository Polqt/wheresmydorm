import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { useCurrentProfile } from "@/hooks/use-current-profile";
import { useAuth } from "@/providers/auth-provider";
import {
  createFindNearbyInput,
  getFinderSearchLabel,
  isAdvancedFinderFiltersEnabled,
} from "@/services/finder-search";
import { useFinderSearchStore } from "@/stores/finder-search";
import { useMapStore } from "@/stores/map";
import { trpc } from "@/utils/api-client";
import { areMapFiltersEqual } from "@/utils/map-filters";

import { useLocation } from "./use-location";

export function useDiscoveryListings() {
  const { role, user } = useAuth();
  const { coords, isReady, label } = useLocation();
  const profileQuery = useCurrentProfile(user);
  const filters = useMapStore((state) => state.filters);
  const setFilters = useMapStore((state) => state.setFilters);
  const clearSearch = useFinderSearchStore((state) => state.clearSearch);
  const items = useFinderSearchStore((state) => state.items);
  const lastSearchAt = useFinderSearchStore((state) => state.lastSearchAt);
  const lastSearchCenter = useFinderSearchStore(
    (state) => state.lastSearchCenter,
  );
  const lastSearchRadiusMeters = useFinderSearchStore(
    (state) => state.lastSearchRadiusMeters,
  );
  const quota = useFinderSearchStore((state) => state.quota);
  const setQuota = useFinderSearchStore((state) => state.setQuota);
  const setSearchResult = useFinderSearchStore(
    (state) => state.setSearchResult,
  );
  const appliedProfileDefaultsForUserId = useRef<string | null>(null);

  const quotaQuery = useQuery({
    ...trpc.listings.findQuotaStatus.queryOptions(),
    enabled: role === "finder",
  });

  useEffect(() => {
    if (quotaQuery.data) {
      setQuota(quotaQuery.data);
    }
  }, [quotaQuery.data, setQuota]);

  useEffect(() => {
    if (role !== "finder") {
      clearSearch();
      appliedProfileDefaultsForUserId.current = null;
    }
  }, [clearSearch, role]);

  useEffect(() => {
    const profile = profileQuery.data;
    const isDefaultFilterState =
      filters.availableBy === undefined &&
      filters.amenities.length === 0 &&
      filters.distanceMeters === 500 &&
      filters.maxPrice === undefined &&
      filters.minPrice === undefined &&
      filters.minRating === undefined &&
      filters.propertyTypes.length === 0;

    if (!profile || role !== "finder" || lastSearchAt) {
      return;
    }

    if (appliedProfileDefaultsForUserId.current === profile.id) {
      return;
    }

    if (!isDefaultFilterState) {
      appliedProfileDefaultsForUserId.current = profile.id;
      return;
    }

    const nextPropertyTypes = profile.finderPropertyTypes.filter(
      (value): value is (typeof filters.propertyTypes)[number] =>
        [
          "dorm",
          "apartment",
          "bedspace",
          "condo",
          "boarding_house",
          "studio",
        ].includes(value),
    );

    const nextFilters = {
      ...filters,
      maxPrice: profile.finderBudgetMax
        ? Number(profile.finderBudgetMax)
        : undefined,
      minPrice: profile.finderBudgetMin
        ? Number(profile.finderBudgetMin)
        : undefined,
      propertyTypes: nextPropertyTypes,
    };

    if (areMapFiltersEqual(filters, nextFilters)) {
      appliedProfileDefaultsForUserId.current = profile.id;
      return;
    }

    appliedProfileDefaultsForUserId.current = profile.id;
    setFilters(() => nextFilters);
  }, [filters, lastSearchAt, profileQuery.data, role, setFilters]);

  const findMutation = useMutation(
    trpc.listings.findNearby.mutationOptions({
      onSuccess: (result) => {
        setSearchResult({
          center: {
            label,
            latitude: coords.latitude,
            longitude: coords.longitude,
          },
          items: result.items,
          quota: result.quota,
          radiusMeters: filters.distanceMeters,
          searchedAt: new Date().toISOString(),
        });
      },
    }),
  );

  const runSearch = useCallback(async () => {
    if (role !== "finder") {
      return null;
    }

    return findMutation.mutateAsync(
      createFindNearbyInput({
        coords,
        filters,
      }),
    );
  }, [coords, filters, findMutation, role]);

  const activeQuota = quotaQuery.data ?? quota;
  const activeLabel = useMemo(
    () =>
      getFinderSearchLabel({
        center: lastSearchCenter,
        fallbackLabel: label,
        radiusMeters: lastSearchRadiusMeters,
      }),
    [label, lastSearchCenter, lastSearchRadiusMeters],
  );

  return {
    canUseAdvancedFilters:
      role !== "finder" || isAdvancedFinderFiltersEnabled(activeQuota),
    coords,
    error: findMutation.error ?? quotaQuery.error ?? null,
    hasSearched: Boolean(lastSearchAt),
    isPaid: activeQuota?.isPaid ?? false,
    isReady,
    isSearching: findMutation.isPending,
    items,
    label: activeLabel,
    quota: activeQuota,
    remainingFinds: activeQuota?.remainingFinds ?? 0,
    runSearch,
  };
}
