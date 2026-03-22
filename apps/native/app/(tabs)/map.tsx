import type BottomSheet from "@gorhom/bottom-sheet";

import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";

import { FilterBar } from "@/components/map/FilterBar";
import { ListingSheet } from "@/components/map/ListingSheet";
import { PropertyPin } from "@/components/map/PropertyPin";
import { getListingById, getNearbyListings } from "@/services/listings";
import { useMapStore } from "@/stores/map";

const FALLBACK_COORDINATES = {
  latitude: 10.6765,
  longitude: 122.9511,
  latitudeDelta: 0.07,
  longitudeDelta: 0.05,
};

export default function MapTabScreen() {
  const bottomSheetRef = useRef<BottomSheet | null>(null);
  const filters = useMapStore((state) => state.filters);
  const selectedListingId = useMapStore((state) => state.selectedListingId);
  const isFilterOpen = useMapStore((state) => state.isFilterOpen);
  const setFilters = useMapStore((state) => state.setFilters);
  const setSelectedListingId = useMapStore(
    (state) => state.setSelectedListingId,
  );
  const setFilterOpen = useMapStore((state) => state.setFilterOpen);
  const resetFilters = useMapStore((state) => state.resetFilters);
  const [coordinates, setCoordinates] = useState(FALLBACK_COORDINATES);
  const [locationLabel, setLocationLabel] = useState(
    "Using Bacolod as the launch city fallback.",
  );

  useEffect(() => {
    let isMounted = true;

    async function loadLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        if (isMounted) {
          setLocationLabel(
            "Location permission denied. Showing Bacolod launch-area listings.",
          );
        }
        return;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (!isMounted) {
        return;
      }

      setCoordinates((current) => ({
        ...current,
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      }));
      setLocationLabel("Centered on your current location.");
    }

    loadLocation().catch(() => {
      if (isMounted) {
        setLocationLabel(
          "We couldn't read your GPS yet, so the map is using Bacolod.",
        );
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const nearbyQuery = useQuery({
    placeholderData: (previousData) => previousData,
    queryFn: () =>
      getNearbyListings({
        filters,
        lat: coordinates.latitude,
        lng: coordinates.longitude,
      }),
    queryKey: [
      "nearby-listings",
      coordinates.latitude,
      coordinates.longitude,
      filters,
    ],
  });

  const selectedListingQuery = useQuery({
    enabled: Boolean(selectedListingId),
    queryFn: () => getListingById(selectedListingId!),
    queryKey: ["listing-detail", selectedListingId],
  });

  const results = nearbyQuery.data ?? [];
  const isSheetOpen = Boolean(selectedListingId);

  if (Platform.OS === "web") {
    return (
      <View style={styles.webFallback}>
        <Text style={styles.webTitle}>
          Map view is optimized for the Expo native app.
        </Text>
        <Text style={styles.webBody}>
          Open this screen on Android or iOS to see GPS centering, property
          clustering, and the bottom sheet listing preview.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        initialRegion={coordinates}
        provider={PROVIDER_GOOGLE}
        region={coordinates}
        style={StyleSheet.absoluteFill}
      >
        {results.map((listing) => (
          <PropertyPin
            key={listing.id}
            isSelected={selectedListingId === listing.id}
            listing={listing}
            onPress={() => setSelectedListingId(listing.id)}
          />
        ))}
      </MapView>

      <FilterBar
        filters={filters}
        isOpen={isFilterOpen}
        onChange={(nextFilters) => setFilters(() => nextFilters)}
        onOpenChange={setFilterOpen}
        onReset={resetFilters}
        resultCount={results.length}
      />

      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Live search area</Text>
          {nearbyQuery.isFetching ? (
            <ActivityIndicator color="#0f766e" size="small" />
          ) : null}
        </View>
        <Text style={styles.statusBody}>{locationLabel}</Text>
        {nearbyQuery.error ? (
          <Text style={styles.errorText}>
            We couldn't load nearby listings yet. Pull fresh auth or try again
            in a moment.
          </Text>
        ) : null}
      </View>

      <ListingSheet
        errorMessage={selectedListingQuery.error?.message ?? null}
        isLoading={selectedListingQuery.isLoading}
        isOpen={isSheetOpen}
        listing={selectedListingQuery.data ?? null}
        onClose={() => setSelectedListingId(null)}
        sheetRef={bottomSheetRef}
      />

      <Pressable
        onPress={() => setFilterOpen(true)}
        style={styles.floatingAction}
      >
        <Text style={styles.floatingActionText}>Filters</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e2e8f0",
  },
  statusCard: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 110,
    borderRadius: 20,
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  statusTitle: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "800",
  },
  statusBody: {
    marginTop: 6,
    color: "#cbd5e1",
    fontSize: 13,
    lineHeight: 20,
  },
  errorText: {
    marginTop: 8,
    color: "#fdba74",
    fontSize: 12,
    lineHeight: 18,
  },
  floatingAction: {
    position: "absolute",
    right: 18,
    bottom: 42,
    borderRadius: 999,
    backgroundColor: "#ea580c",
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: "#7c2d12",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  floatingActionText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  webFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#fff7ed",
  },
  webTitle: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  webBody: {
    marginTop: 10,
    color: "#475569",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
});
