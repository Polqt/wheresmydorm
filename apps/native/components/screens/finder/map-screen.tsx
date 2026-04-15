import Ionicons from "@expo/vector-icons/Ionicons";
import type BottomSheet from "@gorhom/bottom-sheet";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import type MapView from "react-native-maps";
import MapViewComponent, { Callout, Marker } from "react-native-maps";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PinIcon from "@/assets/icons/pin.svg";
import SearchIcon from "@/assets/icons/search.svg";
import { FilterBar } from "@/components/map/FilterBar";
import { ListingSheet } from "@/components/map/ListingSheet";
import { NearbyListingsSheet } from "@/components/map/NearbyListingsSheet";
import { PropertyPin } from "@/components/map/PropertyPin";
import { QuotaUpgradeBanner } from "@/components/ui/quota-upgrade-banner";
import { useDiscoveryListings } from "@/hooks/use-discovery-listings";
import { getFinderQuotaCopy } from "@/services/finder-search";
import { useMapStore } from "@/stores/map";
import { trpc } from "@/utils/api-client";
import { listingDetailRoute } from "@/utils/routes";

function DialButton({
  delayMs,
  icon,
  label,
  loading,
  onPress,
}: {
  delayMs: number;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  loading?: boolean;
  onPress: () => void;
}) {
  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.set(
      withDelay(delayMs, withSpring(0, { damping: 14, stiffness: 160 })),
    );
    opacity.set(withDelay(delayMs, withTiming(1, { duration: 120 })));
    return () => {
      translateY.set(withTiming(40, { duration: 100 }));
      opacity.set(withTiming(0, { duration: 80 }));
    };
  }, [delayMs, opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }],
    opacity: opacity.get(),
  }));

  return (
    <Animated.View style={[animStyle, { alignItems: "center", gap: 4 }]}>
      <Pressable
        className="h-11 w-11 items-center justify-center rounded-full border border-[#DDD8CF] bg-[rgba(255,253,249,0.96)]"
        onPress={onPress}
      >
        {loading ? (
          <Ionicons color="#0B2D23" name="sync-outline" size={18} />
        ) : (
          <Ionicons color="#0B2D23" name={icon} size={18} />
        )}
      </Pressable>
      <Text className="font-bold text-[#0B2D23] text-[10px]">{label}</Text>
    </Animated.View>
  );
}

export default function MapTabScreen() {
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet | null>(null);
  const nearbySheetRef = useRef<BottomSheet | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const userMarkerRef = useRef<any>(null);

  const {
    canUseAdvancedFilters,
    coords,
    error,
    isPaid,
    isSearching,
    items,
    label,
    quota,
    remainingFinds,
    runSearch,
  } = useDiscoveryListings();

  const filters = useMapStore((s) => s.filters);
  const selectedListingId = useMapStore((s) => s.selectedListingId);
  const isFilterOpen = useMapStore((s) => s.isFilterOpen);
  const setFilters = useMapStore((s) => s.setFilters);
  const setSelectedListingId = useMapStore((s) => s.setSelectedListingId);
  const setFilterOpen = useMapStore((s) => s.setFilterOpen);
  const resetFilters = useMapStore((s) => s.resetFilters);

  const [userCoords, setUserCoords] = useState<typeof coords | null>(null);
  const [calloutVisible, setCalloutVisible] = useState(false);
  const [is3D, setIs3D] = useState(true);
  const [isDialOpen, setIsDialOpen] = useState(false);

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
    return () => {
      isMounted = false;
    };
  }, [coords]);

  const centerOnLocation = useCallback(() => {
    const target = userCoords ?? coords;
    mapRef.current?.animateToRegion(
      { ...target, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      400,
    );
    setIsDialOpen(false);
  }, [userCoords, coords]);

  const toggle3D = useCallback(() => {
    const next = !is3D;
    setIs3D(next);
    mapRef.current?.animateCamera(
      { pitch: next ? 45 : 0, zoom: next ? 17 : 14 },
      { duration: 600 },
    );
  }, [is3D]);

  const handleMapReady = useCallback(() => {
    mapRef.current?.animateCamera(
      {
        center: { latitude: coords.latitude, longitude: coords.longitude },
        pitch: 45,
        zoom: 16,
      },
      { duration: 600 },
    );
  }, [coords.latitude, coords.longitude]);

  const handleUserMarkerPress = useCallback(() => {
    if (calloutVisible) {
      userMarkerRef.current?.hideCallout();
      setCalloutVisible(false);
    } else {
      userMarkerRef.current?.showCallout();
      setCalloutVisible(true);
    }
  }, [calloutVisible]);

  const handleFindNearby = useCallback(async () => {
    setIsDialOpen(false);
    await runSearch();
    nearbySheetRef.current?.snapToIndex(0);
  }, [runSearch]);

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

  if (process.env.EXPO_OS === "web") {
    return (
      <View className="flex-1 items-center justify-center bg-[#F7F4EE] px-7">
        <Text className="text-center font-extrabold text-[#0F172A] text-[22px]">
          Map view is optimized for the Expo native app.
        </Text>
        <Text className="mt-[10px] text-center text-[14px] text-slate-600 leading-[22px]">
          Open this screen on Android or iOS to see GPS centering, property
          clustering, and the bottom sheet listing preview.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#EBE7DE]">
      <MapViewComponent
        ref={mapRef}
        initialRegion={initialRegion}
        mapType={process.env.EXPO_OS === "ios" ? "mutedStandard" : "standard"}
        onMapReady={handleMapReady}
        pitchEnabled
        rotateEnabled
        showsBuildings
        showsCompass={false}
        style={MAP_FILL_STYLE}
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
            coordinate={{
              latitude: userCoords.latitude,
              longitude: userCoords.longitude,
            }}
            anchor={{ x: 0.5, y: 1 }}
            onPress={handleUserMarkerPress}
          >
            <PinIcon width={34} height={38} />
            <Callout tooltip>
              <View className="h-9 min-w-[120px] items-center justify-center rounded border border-[rgba(221,216,207,0.85)] bg-[rgba(255,253,249,0.97)] px-[14px]">
                <Text className="font-bold text-[#3D3830] text-[13px]">
                  You are here
                </Text>
              </View>
            </Callout>
          </Marker>
        )}
      </MapViewComponent>

      {/* Top controls */}
      <View
        className="absolute right-3 left-3 gap-2"
        style={{ top: insets.top + 10 }}
      >
        {/* Search bar row */}
        <View className="flex-row items-center gap-2.5">
          <Pressable
            className="flex-1 rounded-[26px] border border-[#DDD8CF] bg-[rgba(255,253,249,0.94)] px-4 py-3.5"
            onPress={() => setFilterOpen(true)}
          >
            <View className="flex-row items-center gap-2">
              <SearchIcon width={17} height={17} color="#706A5F" />
              <Text className="flex-1 font-semibold text-[#0F172A] text-[14px]">
                Search areas, schools, or landmarks
              </Text>
              <Pressable
                onPress={toggle3D}
                className={`rounded-full px-2.5 py-1 ${is3D ? "bg-[#0B2D23]" : "bg-[#EEF5F1]"}`}
              >
                <Text
                  className={`font-bold text-[11px] ${is3D ? "text-white" : "text-[#0B2D23]"}`}
                >
                  3D
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </View>

        {/* Quota upgrade banner */}
        <QuotaUpgradeBanner isPaid={isPaid} remainingFinds={remainingFinds} />

        {/* Map/List chips */}
        <View className="flex-row gap-2">
          <View className="rounded-full bg-[rgba(255,253,249,0.92)] px-3.5 py-2">
            <Text className="font-bold text-[#0B2D23] text-[12px]">
              Map view
            </Text>
          </View>
          <View className="rounded-full bg-[rgba(17,24,39,0.82)] px-3.5 py-2">
            <Text className="font-bold text-[12px] text-white">
              List view soon
            </Text>
          </View>
        </View>
      </View>

      <FilterBar
        advancedFiltersEnabled={canUseAdvancedFilters}
        filters={filters}
        isOpen={isFilterOpen}
        onChange={(nextFilters) => setFilters(() => nextFilters)}
        onOpenChange={setFilterOpen}
        onReset={resetFilters}
        remainingFinds={remainingFinds}
        resultCount={items.length}
      />

      <ListingSheet
        errorMessage={
          selectedListingQuery.isError
            ? "This listing couldn't be loaded. Please try again."
            : null
        }
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

      <NearbyListingsSheet
        items={items}
        onClose={() => nearbySheetRef.current?.close()}
        onPressDetails={(id) => {
          nearbySheetRef.current?.close();
          router.push(listingDetailRoute(id));
        }}
        onSelectListing={(id) => {
          nearbySheetRef.current?.close();
          setSelectedListingId(id);
        }}
        sheetRef={nearbySheetRef}
      />

      {/* Status bar bottom-left — slimmed */}
      <View
        className="absolute left-3 rounded-[18px] border border-[#DDD8CF] bg-[rgba(255,253,249,0.95)] px-[14px] py-[10px]"
        style={{ bottom: insets.bottom + 16 }}
      >
        <Text className="font-semibold text-[#111827] text-[12px] tracking-[0.3px]">
          {label}
        </Text>
        <Text className="mt-0.5 max-w-[240px] text-[#706A5F] text-[11px] leading-[16px]">
          {getFinderQuotaCopy(quota)}
        </Text>
        <Text className="mt-1 font-semibold text-[#6F685E] text-[11px]">
          {items.length} places · {filters.sortBy.replaceAll("_", " ")}
        </Text>
        {error ? (
          <Text className="mt-1 max-w-[240px] text-[11px] text-red-600 leading-4">
            Search failed. Please try again.
          </Text>
        ) : null}
      </View>

      {/* Speed-dial backdrop */}
      {isDialOpen ? (
        <Pressable
          className="absolute inset-0 bg-black/[0.15]"
          onPress={() => setIsDialOpen(false)}
        />
      ) : null}

      {/* Speed-dial FAB bottom-right */}
      <View
        className="absolute right-3 items-center gap-3"
        style={{ bottom: insets.bottom + 16 }}
      >
        {isDialOpen ? (
          <>
            <DialButton
              delayMs={0}
              icon="location-outline"
              label="Location"
              onPress={centerOnLocation}
            />
            <DialButton
              delayMs={50}
              icon="options-outline"
              label="Filter"
              onPress={() => {
                setFilterOpen(true);
                setIsDialOpen(false);
              }}
            />
            <DialButton
              delayMs={100}
              icon="search-outline"
              label="Find"
              loading={isSearching}
              onPress={handleFindNearby}
            />
          </>
        ) : null}

        <Pressable
          className={`h-14 w-14 items-center justify-center rounded-full bg-[#0B2D23] ${
            isSearching ? "opacity-70" : ""
          }`}
          disabled={isSearching}
          onPress={() => setIsDialOpen((prev) => !prev)}
        >
          <Ionicons
            color="#FFFFFF"
            name={isDialOpen ? "close" : "add"}
            size={26}
          />
        </Pressable>
      </View>
    </View>
  );
}

const MAP_FILL_STYLE = {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
} as const;
