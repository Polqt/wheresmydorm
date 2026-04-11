import type BottomSheet from "@gorhom/bottom-sheet";
import type MapView from "react-native-maps";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import MapViewComponent, {
  Callout,
  Marker,
} from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import LocationIcon from "@/assets/icons/location.svg";
import PinIcon from "@/assets/icons/pin.svg";
import SearchIcon from "@/assets/icons/search.svg";
import { FilterBar } from "@/components/map/FilterBar";
import { ListingSheet } from "@/components/map/ListingSheet";
import { PropertyPin } from "@/components/map/PropertyPin";
import { useDiscoveryListings } from "@/hooks/use-discovery-listings";
import { getFinderQuotaCopy } from "@/services/finder-search";
import { useMapStore } from "@/stores/map";
import { listingDetailRoute } from "@/utils/routes";
import { trpc } from "@/utils/api-client";

function SlidersIcon() {
  return (
    <View className="h-[18px] w-[22px] justify-center gap-1">
      <View className="h-[3px] flex-row items-center gap-[3px]">
        <View className="h-[7px] w-[7px] rounded-full border-[1.5px] border-white bg-[#0B2D23]" />
        <View className="h-[2px] flex-1 rounded-full bg-white" />
      </View>
      <View className="h-[3px] flex-row items-center gap-[3px]">
        <View className="h-[2px] flex-1 rounded-full bg-white" />
        <View className="h-[7px] w-[7px] rounded-full border-[1.5px] border-white bg-[#0B2D23]" />
      </View>
      <View className="h-[3px] flex-row items-center gap-[3px]">
        <View
          className="h-[2px] rounded-full bg-white"
          style={{ flex: 0.45 }}
        />
        <View className="h-[7px] w-[7px] rounded-full border-[1.5px] border-white bg-[#0B2D23]" />
        <View
          className="h-[2px] rounded-full bg-white"
          style={{ flex: 0.45 }}
        />
      </View>
    </View>
  );
}

function LocationButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const [active, setActive] = useState(false);

  const handlePress = useCallback(() => {
    scale.set(
      withSequence(
      withTiming(1.2, { duration: 120, easing: Easing.out(Easing.quad) }),
      withSpring(1.0, { damping: 6, stiffness: 80 }),
      ),
    );
    setActive(true);
    setTimeout(() => setActive(false), 1000);
    onPress();
  }, [onPress, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <Pressable onPress={handlePress} className={FLOATING_BUTTON_CLASS_NAME}>
      <Animated.View style={animStyle}>
        <LocationIcon
          width={22}
          height={22}
          color={active ? "#EA580C" : "#0B2D23"}
        />
      </Animated.View>
    </Pressable>
  );
}

export default function MapTabScreen() {
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const userMarkerRef = useRef<any>(null);

  const {
    canUseAdvancedFilters,
    coords,
    error,
    isSearching,
    items,
    label,
    quota,
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
      {
        ...target,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      400,
    );
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
      { center: { latitude: coords.latitude, longitude: coords.longitude }, pitch: 45, zoom: 16 },
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
        <Text className="text-center text-[22px] font-extrabold text-[#0F172A]">
          Map view is optimized for the Expo native app.
        </Text>
        <Text className="mt-[10px] text-center text-[14px] leading-[22px] text-slate-600">
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
                <Text className="text-[13px] font-bold text-[#3D3830]">
                  You are here
                </Text>
              </View>
            </Callout>
          </Marker>
        )}
      </MapViewComponent>

      <View
        className="absolute left-3 right-3 gap-2"
        style={{ top: insets.top + 10 }}
      >
        <View className="flex-row items-start gap-2.5">
          <Pressable
            className="flex-1 rounded-[26px] border border-[#DDD8CF] bg-[rgba(255,253,249,0.94)] px-4 py-4"
            onPress={() => setFilterOpen(true)}
          >
            <View className="flex-row items-center gap-2">
              <SearchIcon width={17} height={17} color="#706A5F" />
              <Text className="flex-1 text-[14px] font-semibold text-[#0F172A]">
                Search areas, schools, or landmarks
              </Text>
            </View>
            <Text className="mt-2 text-[12px] leading-[18px] text-[#8C8478]">
              Dorm name lookup is coming next. For now, use Find nearby and the
              bottom sheet filters.
            </Text>
          </Pressable>

          <View className="gap-2">
            <Pressable
              onPress={toggle3D}
              className={`${FLOATING_BUTTON_CLASS_NAME} ${
                is3D ? "border-[#0B2D23] bg-[#0B2D23]" : ""
              }`}
            >
              <Text
                className={`text-[13px] font-extrabold tracking-[0.5px] ${
                  is3D ? "text-white" : "text-[#0B2D23]"
                }`}
              >
                3D
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFilterOpen(true)}
              className="h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-[#0B2D23]"
            >
              <SlidersIcon />
            </Pressable>
          </View>
        </View>

        <View className="flex-row gap-2">
          <View className="rounded-full bg-[rgba(255,253,249,0.92)] px-3.5 py-2">
            <Text className="text-[12px] font-bold text-[#0B2D23]">
              Map view
            </Text>
          </View>
          <View className="rounded-full bg-[rgba(17,24,39,0.82)] px-3.5 py-2">
            <Text className="text-[12px] font-bold text-white">
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
        resultCount={items.length}
      />

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

      <View
        className="absolute left-3 rounded-[18px] border border-[#DDD8CF] bg-[rgba(255,253,249,0.95)] px-[14px] py-[12px]"
        style={{ bottom: insets.bottom + 16 }}
      >
        <Text className="text-[11px] font-bold uppercase tracking-[0.7px] text-[#0B2D23]">
          Finder status
        </Text>
        <Text className="mt-1 text-[12px] font-semibold tracking-[0.3px] text-[#111827]">
          {label}
        </Text>
        <Text className="mt-1 max-w-[240px] text-[11px] leading-[16px] text-[#706A5F]">
          {getFinderQuotaCopy(quota)}
        </Text>
        <Text className="mt-2 text-[11px] font-semibold text-[#6F685E]">
          {items.length} places • Sorted by{" "}
          {filters.sortBy.replaceAll("_", " ")}
        </Text>
        {error ? (
          <Text className="mt-1 max-w-[240px] text-[11px] leading-4 text-red-600">
            {error.message}
          </Text>
        ) : null}
      </View>

      <View
        className="absolute right-3 items-center gap-[10px]"
        style={{ bottom: insets.bottom + 16 }}
      >
        <Pressable
          disabled={isSearching}
          onPress={() => {
            void runSearch();
          }}
          className={`h-[56px] w-[56px] items-center justify-center rounded-full bg-[#0B2D23] ${
            isSearching ? "opacity-60" : ""
          }`}
        >
          {isSearching ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <FontAwesome color="#FFFFFF" name="search" size={18} />
          )}
        </Pressable>
        <View className="-mt-1 rounded-full bg-[rgba(255,253,249,0.94)] px-3 py-1.5">
          <Text className="text-[11px] font-bold text-[#0B2D23]">
            Find nearby
          </Text>
        </View>
        <LocationButton onPress={centerOnLocation} />
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

const FLOATING_BUTTON_CLASS_NAME =
  "h-11 w-11 items-center justify-center rounded border border-[#DDD8CF] bg-[rgba(255,253,249,0.92)]";
