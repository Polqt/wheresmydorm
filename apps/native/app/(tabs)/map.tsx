import type BottomSheet from "@gorhom/bottom-sheet";
import type MapView from "react-native-maps";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import MapViewComponent, { Callout, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import LocationIcon from "@/assets/icons/location.svg";
import PinIcon from "@/assets/icons/pin.svg";
import SearchIcon from "@/assets/icons/search.svg";
import { FilterBar } from "@/components/map/FilterBar";
import { ListingSheet } from "@/components/map/ListingSheet";
import { PropertyPin } from "@/components/map/PropertyPin";
import { useDiscoveryListings } from "@/hooks/use-discovery-listings";
import { useMapStore } from "@/stores/map";
import { listingDetailRoute } from "@/utils/routes";
import { trpc } from "@/utils/trpc";

function SlidersIcon() {
  return (
    <View style={sliderStyles.root}>
      <View style={sliderStyles.row}>
        <View style={sliderStyles.dot} />
        <View style={[sliderStyles.track, { flex: 1 }]} />
      </View>
      <View style={sliderStyles.row}>
        <View style={[sliderStyles.track, { flex: 1 }]} />
        <View style={sliderStyles.dot} />
      </View>
      <View style={sliderStyles.row}>
        <View style={[sliderStyles.track, { flex: 0.45 }]} />
        <View style={sliderStyles.dot} />
        <View style={[sliderStyles.track, { flex: 0.45 }]} />
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  root: { width: 22, height: 18, gap: 4, justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", height: 3, gap: 3 },
  track: { height: 2, backgroundColor: "#ffffff", borderRadius: 1 },
  dot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: "#0B2D23", borderWidth: 1.5, borderColor: "#ffffff",
  },
});

function LocationButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const [active, setActive] = useState(false);

  const handlePress = useCallback(() => {
    scale.value = withSequence(
      withTiming(1.2, { duration: 120, easing: Easing.out(Easing.quad) }),
      withSpring(1.0, { damping: 6, stiffness: 80 }),
    );
    setActive(true);
    setTimeout(() => setActive(false), 1000);
    onPress();
  }, [onPress, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={handlePress} style={styles.squareBtn}>
      <Animated.View style={animStyle}>
        <LocationIcon width={22} height={22} color={active ? "#EA580C" : "#0B2D23"} />
      </Animated.View>
    </Pressable>
  );
}

export default function MapTabScreen() {
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const userMarkerRef = useRef<any>(null);

  const { coords, items, label, query } = useDiscoveryListings();
  const filters = useMapStore((s) => s.filters);
  const selectedListingId = useMapStore((s) => s.selectedListingId);
  const isFilterOpen = useMapStore((s) => s.isFilterOpen);
  const setFilters = useMapStore((s) => s.setFilters);
  const setSelectedListingId = useMapStore((s) => s.setSelectedListingId);
  const setFilterOpen = useMapStore((s) => s.setFilterOpen);
  const resetFilters = useMapStore((s) => s.resetFilters);

  const [userCoords, setUserCoords] = useState<typeof coords | null>(null);
  const [searchText, setSearchText] = useState("");
  const [calloutVisible, setCalloutVisible] = useState(false);
  const [is3D, setIs3D] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (!isMounted) return;
      setUserCoords({
        ...coords,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
    }
    loadLocation().catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const centerOnLocation = useCallback(() => {
    const target = userCoords ?? coords;
    mapRef.current?.animateToRegion(target, 400);
  }, [userCoords, coords]);

  const toggle3D = useCallback(() => {
    const next = !is3D;
    setIs3D(next);
    mapRef.current?.animateCamera(
      { pitch: next ? 45 : 0, zoom: next ? 17 : 14 },
      { duration: 600 },
    );
  }, [is3D]);

  const handleUserMarkerPress = useCallback(() => {
    if (calloutVisible) {
      userMarkerRef.current?.hideCallout();
      setCalloutVisible(false);
    } else {
      userMarkerRef.current?.showCallout();
      setCalloutVisible(true);
    }
  }, [calloutVisible]);

  const selectedListingQuery = useQuery({
    ...trpc.listings.getById.queryOptions(
      { id: selectedListingId ?? "" },
      { enabled: Boolean(selectedListingId) },
    ),
  });

  const initialRegion = {
    latitude: coords.latitude,
    longitude: coords.longitude,
    latitudeDelta: 0.07,
    longitudeDelta: 0.05,
  };

  if (Platform.OS === "web") {
    return (
      <View style={styles.webFallback}>
        <Text style={styles.webTitle}>Map view is optimized for the Expo native app.</Text>
        <Text style={styles.webBody}>
          Open this screen on Android or iOS to see GPS centering, property
          clustering, and the bottom sheet listing preview.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapViewComponent
        ref={mapRef}
        initialRegion={initialRegion}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
      >
        {items.map((listing) => (
          <PropertyPin
            key={listing.id}
            isSelected={selectedListingId === listing.id}
            listing={listing}
            onPress={() => setSelectedListingId(listing.id)}
          />
        ))}

        {userCoords && (
          <Marker
            ref={userMarkerRef}
            coordinate={{ latitude: userCoords.latitude, longitude: userCoords.longitude }}
            anchor={{ x: 0.5, y: 1 }}
            onPress={handleUserMarkerPress}
          >
            <PinIcon width={34} height={38} />
            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.calloutText}>You are here</Text>
              </View>
            </Callout>
          </Marker>
        )}
      </MapViewComponent>

      <View style={[styles.topOverlay, { top: insets.top + 10 }]}>
        <View style={styles.searchBar}>
          <SearchIcon width={17} height={17} color="#706A5F" />
          <TextInput
            placeholder="Search dorms, areas, landmarks…"
            placeholderTextColor="#9E9890"
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {query.isFetching && (
            <ActivityIndicator color="#706A5F" size="small" />
          )}
        </View>

        <View style={styles.subRow}>
          <Pressable
            onPress={() => router.push("/notifications")}
            style={styles.squareBtn}
          >
            <FontAwesome name="bell" size={16} color="#0B2D23" />
          </Pressable>

          <Pressable
            onPress={toggle3D}
            style={[styles.squareBtn, is3D && styles.squareBtnActive]}
          >
            <Text style={[styles.btn3DText, is3D && styles.btn3DTextActive]}>
              3D
            </Text>
          </Pressable>
        </View>
      </View>

      <FilterBar
        filters={filters}
        isOpen={isFilterOpen}
        onChange={(nextFilters) => setFilters(() => nextFilters)}
        onOpenChange={setFilterOpen}
        onReset={resetFilters}
        resultCount={items.length}
      />

      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Live search area</Text>
          {query.isFetching ? (
            <ActivityIndicator color="#0B2D23" size="small" />
          ) : null}
        </View>
        <Text style={styles.statusBody}>{label}</Text>
        {query.error ? (
          <Text style={styles.errorText}>
            We couldn't load nearby listings yet. Refresh auth or try again in a
            moment.
          </Text>
        ) : null}
      </View>

      <ListingSheet
        errorMessage={selectedListingQuery.error?.message ?? null}
        isLoading={selectedListingQuery.isLoading}
        isOpen={Boolean(selectedListingId)}
        listing={selectedListingQuery.data ?? null}
        onClose={() => setSelectedListingId(null)}
        onViewDetails={(id) => {
          setSelectedListingId(null);
          router.push(listingDetailRoute(id));
        }}
        sheetRef={bottomSheetRef}
      />

      <View style={[styles.bottomRight, { bottom: insets.bottom + 16 }]}>
        <LocationButton onPress={centerOnLocation} />
        <Pressable onPress={() => setFilterOpen(true)} style={styles.filterFab}>
          <SlidersIcon />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ebe7de",
  },

  topOverlay: {
    position: "absolute",
    left: 12,
    right: 12,
    gap: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255, 253, 249, 0.80)",
    borderWidth: 1,
    borderColor: "rgba(221, 216, 207, 0.70)",
    borderRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 17,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    padding: 0,
    textAlignVertical: "center",
  },
  subRow: {
    alignItems: "flex-end",
    gap: 8,
  },
  squareBtn: {
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: "rgba(255, 253, 249, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(221, 216, 207, 0.80)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 4,
  },
  squareBtnActive: {
    backgroundColor: "#0B2D23",
    borderColor: "#0B2D23",
  },
  btn3DText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0B2D23",
    letterSpacing: 0.5,
  },
  btn3DTextActive: {
    color: "#ffffff",
  },

  bottomRight: {
    position: "absolute",
    right: 12,
    gap: 10,
    alignItems: "center",
  },
  filterFab: {
    width: 46,
    height: 46,
    borderRadius: 5,
    backgroundColor: "#0B2D23",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0B2D23",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 10,
  },

  callout: {
    height: 36,
    minWidth: 120,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(221, 216, 207, 0.85)",
    backgroundColor: "rgba(255, 253, 249, 0.97)",
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  calloutText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3D3830",
  },

  webFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#f7f4ee",
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
