import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  getDiscoveryQueryInput,
  getFilteredDiscoveryListings,
} from "@/services/listings";
import { useMapStore } from "@/stores/map";
import { trpc } from "@/utils/trpc";

import { useLocation } from "./use-location";

export function useDiscoveryListings() {
  const { coords, isReady, label } = useLocation();
  const filters = useMapStore((state) => state.filters);

  const query = useQuery(
    trpc.listings.list.queryOptions(getDiscoveryQueryInput(filters), {
      enabled: isReady,
    }),
  );

  const items = useMemo(
    () =>
      getFilteredDiscoveryListings(query.data ?? [], {
        filters,
        lat: coords.latitude,
        lng: coords.longitude,
      }),
    [coords.latitude, coords.longitude, filters, query.data],
  );

  return {
    coords,
    isReady,
    items,
    label,
    query,
  };
}
