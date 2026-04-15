# Finder Full Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the finder experience across Map, Discover, Saved, and Feed screens — consolidating floating buttons into a speed-dial FAB, adding property category filtering on Discover, adding a quota upgrade banner, and polishing Saved/Feed.

**Architecture:** Incremental polish — each task modifies a single file or creates one new component. No new routes, no new stores. Sub-project C (API + shared component) runs first because Map and Discover depend on `QuotaUpgradeBanner` and the updated `useDiscoveryListings` hook return.

**Tech Stack:** React Native 0.81, Expo Router, NativeWind v4, `@gorhom/bottom-sheet`, `react-native-reanimated`, `@tanstack/react-query`, tRPC v11, TypeScript strict.

---

## File Map

| File | Action | What changes |
|---|---|---|
| `apps/native/components/ui/quota-upgrade-banner.tsx` | **Create** | New shared amber banner component |
| `apps/native/hooks/use-discovery-listings.ts` | **Modify** | Expose `isPaid` + `remainingFinds` in return |
| `packages/api/src/routers/listings.discovery.ts` | **Modify** | Add `assertFinder` guard to `findQuotaStatus` |
| `apps/native/components/map/FilterBar.tsx` | **Modify** | Add `remainingFinds` prop, replace upgrade text with banner |
| `apps/native/components/screens/finder/map-screen.tsx` | **Modify** | Speed-dial FAB, 3D into search bar, quota banner, slim status bar |
| `apps/native/components/map/ListingSheet.tsx` | **Modify** | Remove "Back to map" button |
| `apps/native/components/screens/finder/discover-screen.tsx` | **Modify** | Remove quick action cards, add category chips, filter sections, move metrics, quota banner |
| `apps/native/components/screens/finder/saved-screen.tsx` | **Modify** | `estimatedItemSize`, third stat block |
| `apps/native/components/screens/finder/finder-feed-screen.tsx` | **Modify** | `estimatedItemSize` |

---

## Task 1: Create `QuotaUpgradeBanner` component

**Files:**
- Create: `apps/native/components/ui/quota-upgrade-banner.tsx`

- [ ] **Step 1: Create the file**

```tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { paymentsRoute } from "@/utils/routes";

export function QuotaUpgradeBanner({
  isPaid,
  remainingFinds,
}: {
  isPaid: boolean;
  remainingFinds: number;
}) {
  if (isPaid || remainingFinds > 10) return null;

  return (
    <Pressable
      className="flex-row items-center gap-2 rounded-[14px] border border-[#FED7AA] bg-[#FFF7ED] px-3.5 py-2.5"
      onPress={() => router.push(paymentsRoute())}
    >
      <Ionicons color="#C2410C" name="flash-outline" size={14} />
      <Text className="flex-1 text-[12px] font-bold text-[#C2410C]">
        {remainingFinds} find{remainingFinds !== 1 ? "s" : ""} left · Upgrade for unlimited
      </Text>
      <Ionicons color="#C2410C" name="chevron-forward" size={14} />
    </Pressable>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd c:/Users/poyhi/wheresmydorm
pnpm check-types
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add apps/native/components/ui/quota-upgrade-banner.tsx
git commit -m "feat(native): add QuotaUpgradeBanner shared component"
```

---

## Task 2: Expose `isPaid` + `remainingFinds` from `useDiscoveryListings`

**Files:**
- Modify: `apps/native/hooks/use-discovery-listings.ts` (lines 152–164)

- [ ] **Step 1: Update the return statement**

Find the `return {` block at the end of `useDiscoveryListings` (currently returns `canUseAdvancedFilters`, `coords`, `error`, `hasSearched`, `isReady`, `isSearching`, `items`, `label`, `quota`, `runSearch`). Add two fields:

```ts
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
```

- [ ] **Step 2: Type-check**

```bash
cd c:/Users/poyhi/wheresmydorm
pnpm check-types
```

Expected: no errors. `isPaid` and `remainingFinds` are now available to callers.

- [ ] **Step 3: Commit**

```bash
git add apps/native/hooks/use-discovery-listings.ts
git commit -m "feat(native): expose isPaid and remainingFinds from useDiscoveryListings"
```

---

## Task 3: Add `assertFinder` guard to `findQuotaStatus`

**Files:**
- Modify: `packages/api/src/routers/listings.discovery.ts` (lines 63–78)

- [ ] **Step 1: Update `findQuotaStatus` procedure**

Replace the existing `findQuotaStatus` procedure:

```ts
  findQuotaStatus: protectedProcedure.query(async ({ ctx }) => {
    assertFinder(ctx, "Only finders can check quota status.");
    const quota = await getFinderQuotaRow(ctx.userId);
    return toFinderQuotaStatus(quota);
  }),
```

The old body had an `if (ctx.role !== "finder" && ctx.role !== "admin")` guard returning a zero object. Remove that block entirely — `assertFinder` throws `FORBIDDEN` for non-finder/non-admin roles, which is the correct behavior. Callers already gate with `enabled: role === "finder"` so this never fires in practice.

- [ ] **Step 2: Type-check**

```bash
cd c:/Users/poyhi/wheresmydorm
pnpm check-types
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/routers/listings.discovery.ts
git commit -m "fix(api): assertFinder guard on findQuotaStatus procedure"
```

---

## Task 4: Update `FilterBar` — add `remainingFinds` prop + banner

**Files:**
- Modify: `apps/native/components/map/FilterBar.tsx`

- [ ] **Step 1: Add import at top of file**

After the existing imports, add:

```ts
import { QuotaUpgradeBanner } from "@/components/ui/quota-upgrade-banner";
```

- [ ] **Step 2: Add `remainingFinds` to the props interface**

Find the `FilterBar` function signature (line 62). Add `remainingFinds: number` to the props:

```ts
export function FilterBar({
  advancedFiltersEnabled,
  filters,
  remainingFinds,
  resultCount,
  isOpen,
  onOpenChange,
  onChange,
  onReset,
}: {
  advancedFiltersEnabled: boolean;
  filters: MapFilters;
  remainingFinds: number;
  resultCount: number;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onChange: (filters: MapFilters) => void;
  onReset: () => void;
}) {
```

- [ ] **Step 3: Replace the upgrade text with the banner**

Find this block (around line 163):
```tsx
        {!advancedFiltersEnabled ? (
          <Text className="-mt-1 text-[12px] leading-[18px] text-[#8B5E3C]">
            Upgrade Finder to unlock price, type, amenity, and rating filters.
          </Text>
        ) : null}
```

Replace with:
```tsx
        <QuotaUpgradeBanner
          isPaid={advancedFiltersEnabled}
          remainingFinds={remainingFinds}
        />
```

Note: `advancedFiltersEnabled` maps to `isPaid` here — when `advancedFiltersEnabled` is true (paid finder), the banner returns null. Correct behavior.

- [ ] **Step 4: Type-check**

```bash
cd c:/Users/poyhi/wheresmydorm
pnpm check-types
```

Expected: error about `remainingFinds` missing in `MapTabScreen` caller — fix in next task.

- [ ] **Step 5: Commit after Task 5 fixes the caller** (skip commit here, commit together in Task 5)

---

## Task 5: Rewrite `MapTabScreen` — speed-dial FAB + 3D in search bar + quota banner + slim status bar

**Files:**
- Modify: `apps/native/components/screens/finder/map-screen.tsx`

This is the largest task. Replace the file contents entirely. Read the full current file first to ensure nothing is missed, then write the new version.

- [ ] **Step 1: Replace the full file**

```tsx
import type BottomSheet from "@gorhom/bottom-sheet";
import type MapView from "react-native-maps";

import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
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
import { NearbyListingsSheet } from "@/components/map/NearbyListingsSheet";
import { PropertyPin } from "@/components/map/PropertyPin";
import { QuotaUpgradeBanner } from "@/components/ui/quota-upgrade-banner";
import { useDiscoveryListings } from "@/hooks/use-discovery-listings";
import { getFinderQuotaCopy } from "@/services/finder-search";
import { useMapStore } from "@/stores/map";
import { listingDetailRoute } from "@/utils/routes";
import { trpc } from "@/utils/api-client";

// Speed-dial mini button
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
    translateY.set(withDelay(delayMs, withSpring(0, { damping: 14, stiffness: 160 })));
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
      <Text className="text-[10px] font-bold text-[#0B2D23]">{label}</Text>
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
    return () => { isMounted = false; };
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
            coordinate={{ latitude: userCoords.latitude, longitude: userCoords.longitude }}
            anchor={{ x: 0.5, y: 1 }}
            onPress={handleUserMarkerPress}
          >
            <PinIcon width={34} height={38} />
            <Callout tooltip>
              <View className="h-9 min-w-[120px] items-center justify-center rounded border border-[rgba(221,216,207,0.85)] bg-[rgba(255,253,249,0.97)] px-[14px]">
                <Text className="text-[13px] font-bold text-[#3D3830]">You are here</Text>
              </View>
            </Callout>
          </Marker>
        )}
      </MapViewComponent>

      {/* Top controls */}
      <View
        className="absolute left-3 right-3 gap-2"
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
              <Text className="flex-1 text-[14px] font-semibold text-[#0F172A]">
                Search areas, schools, or landmarks
              </Text>
              {/* 3D toggle inside search bar */}
              <Pressable
                onPress={toggle3D}
                className={`rounded-full px-2.5 py-1 ${is3D ? "bg-[#0B2D23]" : "bg-[#EEF5F1]"}`}
              >
                <Text className={`text-[11px] font-bold ${is3D ? "text-white" : "text-[#0B2D23]"}`}>
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
            <Text className="text-[12px] font-bold text-[#0B2D23]">Map view</Text>
          </View>
          <View className="rounded-full bg-[rgba(17,24,39,0.82)] px-3.5 py-2">
            <Text className="text-[12px] font-bold text-white">List view soon</Text>
          </View>
        </View>
      </View>

      {/* Filter sheet */}
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

      {/* Listing sheet */}
      <ListingSheet
        errorMessage={selectedListingQuery.isError ? "This listing couldn't be loaded. Please try again." : null}
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

      {/* Nearby sheet */}
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
        <Text className="text-[12px] font-semibold tracking-[0.3px] text-[#111827]">
          {label}
        </Text>
        <Text className="mt-0.5 max-w-[240px] text-[11px] leading-[16px] text-[#706A5F]">
          {getFinderQuotaCopy(quota)}
        </Text>
        <Text className="mt-1 text-[11px] font-semibold text-[#6F685E]">
          {items.length} places · {filters.sortBy.replaceAll("_", " ")}
        </Text>
        {error ? (
          <Text className="mt-1 max-w-[240px] text-[11px] leading-4 text-red-600">
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

        {/* Main FAB */}
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
```

- [ ] **Step 2: Type-check**

```bash
cd c:/Users/poyhi/wheresmydorm
pnpm check-types
```

Expected: no errors. If `FontAwesome` import removal causes a missing-module error, verify no other component in this file used it (it was only used for the old Find Nearby search icon — now replaced with Ionicons).

- [ ] **Step 3: Commit**

```bash
git add apps/native/components/screens/finder/map-screen.tsx apps/native/components/map/FilterBar.tsx
git commit -m "feat(native): map speed-dial FAB, 3D in search bar, quota banner, slim status"
```

---

## Task 6: Remove "Back to map" button from `ListingSheet`

**Files:**
- Modify: `apps/native/components/map/ListingSheet.tsx` (lines 161–177)

- [ ] **Step 1: Delete the "Back to map" Pressable**

Find and remove this block (lines ~170–177):
```tsx
            <Pressable
              onPress={onClose}
              className="mt-3 items-center rounded-[18px] bg-[#0B2D23] py-[14px]"
            >
              <Text className="text-[14px] font-extrabold text-white">
                Back to map
              </Text>
            </Pressable>
```

Leave the "View details" button untouched. The sheet can still be dismissed by panning down (already enabled via `enablePanDownToClose`).

- [ ] **Step 2: Type-check**

```bash
cd c:/Users/poyhi/wheresmydorm
pnpm check-types
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/native/components/map/ListingSheet.tsx
git commit -m "fix(native): remove redundant Back to map button from ListingSheet"
```

---

## Task 7: Rewrite `FinderDiscoverScreen` — category chips, remove quick actions, move metrics, quota banner

**Files:**
- Modify: `apps/native/components/screens/finder/discover-screen.tsx`

- [ ] **Step 1: Replace the full file**

```tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { memo, useCallback, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorRetry } from "@/components/ui/error-retry";
import { QuotaUpgradeBanner } from "@/components/ui/quota-upgrade-banner";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useFinderDiscovery } from "@/hooks/use-finder-discovery";
import type { DiscoverySearchPreset } from "@/types/discovery";
import type { ListingListItem } from "@/types/listings";
import { trpc } from "@/utils/api-client";
import { formatCurrency } from "@/utils/profile";
import {
  finderHomeRoute,
  listingDetailRoute,
  savedListingsRoute,
} from "@/utils/routes";

const COVER_FALLBACK =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800";

const PROPERTY_TYPES = [
  { value: "dorm", label: "Dorm", icon: "bed-outline" as const },
  { value: "apartment", label: "Apartment", icon: "business-outline" as const },
  { value: "bedspace", label: "Bedspace", icon: "person-outline" as const },
  { value: "condo", label: "Condo", icon: "home-outline" as const },
  { value: "boarding_house", label: "Boarding", icon: "storefront-outline" as const },
  { value: "studio", label: "Studio", icon: "cube-outline" as const },
];

function filterByTypes(items: ListingListItem[], types: string[]): ListingListItem[] {
  if (types.length === 0) return items;
  return items.filter((item) => types.includes(item.propertyType));
}

const DiscoveryListingCard = memo(function DiscoveryListingCard({
  item,
  onPress,
}: {
  item: ListingListItem;
  onPress: (id: string) => void;
}) {
  return (
    <Pressable className="mr-4 w-[252px]" onPress={() => onPress(item.id)}>
      <Image
        className="h-[188px] w-full rounded-[28px]"
        contentFit="cover"
        source={{ uri: item.coverPhoto ?? COVER_FALLBACK }}
      />
      <View className="px-1 pt-3">
        <View className="flex-row items-center justify-between">
          <Text className="flex-1 text-[12px] text-[#7B7468]" numberOfLines={1}>
            {[item.city, item.barangay].filter(Boolean).join(" • ")}
          </Text>
          <View className="ml-2 flex-row items-center gap-1">
            <Ionicons color="#F59E0B" name="star" size={12} />
            <Text className="text-[12px] font-bold text-[#111827]">
              {item.ratingOverall ? item.ratingOverall.toFixed(1) : "New"}
            </Text>
          </View>
        </View>
        <Text
          className="mt-1 text-[18px] font-bold tracking-[-0.4px] text-[#111827]"
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <View className="mt-1 flex-row items-center justify-between">
          <Text className="text-[13px] capitalize text-[#8A8176]">
            {item.propertyType.replaceAll("_", " ")}
          </Text>
          <Text className="text-[15px] font-extrabold text-[#0B2D23]">
            {formatCurrency(item.pricePerMonth)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

function PresetChip({
  highlighted = false,
  label,
  onPress,
}: {
  highlighted?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`mr-2 mb-2 rounded-full px-4 py-2.5 ${
        highlighted ? "bg-[#111827]" : "bg-[#FFFDFC]"
      }`}
      onPress={onPress}
    >
      <Text
        className={`text-[12px] font-bold ${
          highlighted ? "text-white" : "text-[#111827]"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function CategoryChip({
  icon,
  label,
  onPress,
  selected,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      className={`mr-2 flex-row items-center gap-1.5 rounded-full px-3.5 py-2 ${
        selected ? "bg-[#111827]" : "bg-[#FFFDFC]"
      }`}
      onPress={onPress}
    >
      <Ionicons
        color={selected ? "#ffffff" : "#706A5F"}
        name={icon}
        size={14}
      />
      <Text
        className={`text-[12px] font-bold ${
          selected ? "text-white" : "text-[#111827]"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FinderMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1 rounded-[22px] bg-[#F5F0E8] px-4 py-3">
      <Text className="text-[20px] font-extrabold text-[#111827]">{value}</Text>
      <Text className="mt-1 text-[12px] text-[#706A5F]">{label}</Text>
    </View>
  );
}

function DiscoverySection({
  actionLabel,
  onActionPress,
  onPressItem,
  subtitle,
  title,
  items,
}: {
  actionLabel?: string;
  onActionPress?: () => void;
  onPressItem: (id: string) => void;
  subtitle?: string;
  title: string;
  items: ListingListItem[];
}) {
  if (items.length === 0) return null;

  return (
    <View className="mt-8">
      <View className="mb-3 flex-row items-end justify-between">
        <View className="flex-1 pr-4">
          <Text className="text-[20px] font-extrabold tracking-[-0.5px] text-[#111827]">
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-1 text-[13px] leading-5 text-[#706A5F]">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {actionLabel && onActionPress ? (
          <Pressable onPress={onActionPress}>
            <Text className="text-[13px] font-bold text-[#0B4A30]">
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <FlashList
        data={items}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DiscoveryListingCard item={item} onPress={onPressItem} />
        )}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

export function FinderDiscoverScreen() {
  const finderQuotaQuery = useQuery(trpc.listings.findQuotaStatus.queryOptions());
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const {
    applyPreset,
    currentPreset,
    hasSavedCurrentSearch,
    lastNearbyItems,
    newArrivals,
    recentSearches,
    savedSearches,
    searchResults,
    searchText,
    setSearchText,
    submitSearch,
    toggleSaveCurrentSearch,
    topRated,
    underBudget,
  } = useFinderDiscovery();

  const handleListingPress = useCallback((id: string) => {
    router.push(listingDetailRoute(id));
  }, []);

  const handlePresetPress = useCallback(
    (preset: DiscoverySearchPreset) => applyPreset(preset),
    [applyPreset],
  );

  const toggleType = useCallback((value: string) => {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value],
    );
  }, []);

  const activeSearchCount = searchText.trim().length > 0 ? searchResults.length : 0;

  const isPaid = finderQuotaQuery.data?.isPaid ?? false;
  const remainingFinds = finderQuotaQuery.data?.remainingFinds ?? 0;

  if (finderQuotaQuery.isError) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7F4EE]" edges={["top"]}>
        <ErrorRetry
          context="discover"
          onRetry={() => finderQuotaQuery.refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F7F4EE]" edges={["top"]}>
      <ScreenHeader
        subtitle="Curated finder picks with a calmer browse-first flow."
        title="Discover"
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 112, paddingHorizontal: 18 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View className="rounded-[32px] bg-[#FFFDFC] px-5 py-5">
          <Text className="text-[28px] font-extrabold tracking-[-0.8px] text-[#111827]">
            Explore homes with less noise
          </Text>
          <Text className="mt-2 text-[14px] leading-6 text-[#706A5F]">
            Search titles and areas, revisit recent finds, or browse curated
            picks like top rated and budget-friendly places.
          </Text>

          {/* Search input */}
          <View className="mt-4 flex-row items-center gap-3 rounded-[24px] bg-[#F5F0E8] px-4 py-3">
            <Ionicons color="#6F685E" name="search" size={18} />
            <TextInput
              className="flex-1 py-0 text-[15px] text-[#111827]"
              onChangeText={setSearchText}
              onSubmitEditing={submitSearch}
              placeholder="Search titles, barangays, or landmarks"
              placeholderTextColor="#9A9388"
              returnKeyType="search"
              value={searchText}
            />
            <Pressable
              className="rounded-full bg-[#111827] px-3.5 py-2"
              onPress={submitSearch}
            >
              <Text className="text-[12px] font-bold text-white">Search</Text>
            </Pressable>
          </View>

          {/* Preset chips */}
          <View className="mt-4 flex-row flex-wrap">
            <PresetChip
              highlighted={hasSavedCurrentSearch}
              label={hasSavedCurrentSearch ? "Saved search" : "Save search"}
              onPress={toggleSaveCurrentSearch}
            />
            <PresetChip
              label="Open map"
              onPress={() => router.push(finderHomeRoute())}
            />
            {currentPreset.query ? (
              <PresetChip
                label={`Current: ${currentPreset.label}`}
                onPress={submitSearch}
              />
            ) : null}
          </View>

          {/* Category chip bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3"
            contentContainerStyle={{ gap: 0 }}
          >
            {PROPERTY_TYPES.map((type) => (
              <CategoryChip
                key={type.value}
                icon={type.icon}
                label={type.label}
                selected={selectedTypes.includes(type.value)}
                onPress={() => toggleType(type.value)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Metrics row — outside hero card */}
        <View className="mt-4 flex-row gap-2.5">
          <FinderMetric
            label={isPaid ? "Finder plan" : "Finds left"}
            value={isPaid ? "Unlimited" : String(remainingFinds)}
          />
          <FinderMetric
            label="Saved searches"
            value={String(savedSearches.length)}
          />
          <FinderMetric
            label="Nearby picks"
            value={String(lastNearbyItems.length || activeSearchCount)}
          />
        </View>

        {/* Quota upgrade banner */}
        <View className="mt-3">
          <QuotaUpgradeBanner isPaid={isPaid} remainingFinds={remainingFinds} />
        </View>

        {/* Saved searches */}
        {savedSearches.length > 0 ? (
          <View className="mt-7">
            <Text className="mb-3 text-[12px] font-extrabold uppercase tracking-[1px] text-[#0B4A30]">
              Saved searches
            </Text>
            <View className="flex-row flex-wrap">
              {savedSearches.map((preset) => (
                <PresetChip
                  key={preset.id}
                  label={preset.label}
                  onPress={() => handlePresetPress(preset)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {/* Recent searches */}
        {recentSearches.length > 0 ? (
          <View className="mt-5">
            <Text className="mb-3 text-[12px] font-extrabold uppercase tracking-[1px] text-[#0B4A30]">
              Recent searches
            </Text>
            <View className="flex-row flex-wrap">
              {recentSearches.map((preset) => (
                <PresetChip
                  key={preset.id}
                  label={preset.label}
                  onPress={() => handlePresetPress(preset)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {/* Search results */}
        {searchText.trim().length > 0 ? (
          searchResults.length > 0 ? (
            <DiscoverySection
              items={filterByTypes(searchResults, selectedTypes)}
              onPressItem={handleListingPress}
              subtitle={`${filterByTypes(searchResults, selectedTypes).length} matches across titles, descriptions, and location fields.`}
              title="Search results"
            />
          ) : (
            <EmptyState
              illustration="🔍"
              title="No results found"
              description={`No listings matched "${searchText}". Try a different area, barangay, or landmark.`}
              action={{ label: "Clear search", onPress: () => setSearchText("") }}
            />
          )
        ) : null}

        <DiscoverySection
          actionLabel="Use map"
          items={filterByTypes(lastNearbyItems, selectedTypes)}
          onActionPress={() => router.push(finderHomeRoute())}
          onPressItem={handleListingPress}
          subtitle="Your last nearby find from the map is kept here for quick review."
          title="Recent nearby"
        />

        <DiscoverySection
          items={filterByTypes(topRated, selectedTypes)}
          onPressItem={handleListingPress}
          subtitle="Places with stronger community ratings and better review depth."
          title="Top rated"
        />

        <DiscoverySection
          items={filterByTypes(newArrivals, selectedTypes)}
          onPressItem={handleListingPress}
          subtitle="Freshly added listings worth checking before they get crowded."
          title="New arrivals"
        />

        <DiscoverySection
          items={filterByTypes(underBudget, selectedTypes)}
          onPressItem={handleListingPress}
          subtitle="Budget-friendly picks curated for the P3,000-and-below range."
          title="Under P3,000"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd c:/Users/poyhi/wheresmydorm
pnpm check-types
```

Expected: no errors. `savedListingsRoute` import is present but no longer used (removed with QuickActionCards) — remove it if the type-checker flags an unused import warning from Biome.

- [ ] **Step 3: Remove unused import if needed**

If `savedListingsRoute` is flagged as unused, remove it from the import line:
```ts
import {
  finderHomeRoute,
  listingDetailRoute,
} from "@/utils/routes";
```

- [ ] **Step 4: Run Biome check**

```bash
cd c:/Users/poyhi/wheresmydorm
pnpm check
```

Expected: no errors or warnings.

- [ ] **Step 5: Commit**

```bash
git add apps/native/components/screens/finder/discover-screen.tsx
git commit -m "feat(native): discover category chips, remove quick actions, quota banner"
```

---

## Task 8: Polish `SavedTabScreen` — `estimatedItemSize` + third stat block

**Files:**
- Modify: `apps/native/components/screens/finder/saved-screen.tsx`

- [ ] **Step 1: Add `estimatedItemSize` to FlashList**

Find the `<FlashList` opening tag (line ~116). Add the prop:

```tsx
<FlashList
  contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 18 }}
  data={savedItems}
  estimatedItemSize={128}
  keyExtractor={keyExtractor}
```

- [ ] **Step 2: Add third stat block**

Find the stats row in `ListHeaderComponent` — the `<View className="mt-4 flex-row gap-2.5">` containing "Saved places" and "Avg monthly" blocks. Add the third block after "Avg monthly":

```tsx
                <View className="mt-4 flex-row gap-2.5">
                  <View className="flex-1 rounded-[22px] bg-[#F5F0E8] px-4 py-3">
                    <Text className="text-[20px] font-extrabold text-[#111827]">
                      {savedItems.length}
                    </Text>
                    <Text className="mt-1 text-[12px] text-[#706A5F]">
                      Saved places
                    </Text>
                  </View>
                  <View className="flex-1 rounded-[22px] bg-[#F5F0E8] px-4 py-3">
                    <Text className="text-[20px] font-extrabold text-[#111827]">
                      {avgPrice ? formatCurrency(avgPrice) : "-"}
                    </Text>
                    <Text className="mt-1 text-[12px] text-[#706A5F]">
                      Avg monthly
                    </Text>
                  </View>
                  <View className="flex-1 rounded-[22px] bg-[#F5F0E8] px-4 py-3">
                    <Text className="text-[20px] font-extrabold text-[#111827]">
                      {new Set(savedItems.map((i) => i.propertyType)).size}
                    </Text>
                    <Text className="mt-1 text-[12px] text-[#706A5F]">
                      Types
                    </Text>
                  </View>
                </View>
```

- [ ] **Step 3: Type-check**

```bash
cd c:/Users/poyhi/wheresmydorm
pnpm check-types
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/native/components/screens/finder/saved-screen.tsx
git commit -m "fix(native): estimatedItemSize and types stat on saved screen"
```

---

## Task 9: Polish `FinderFeedScreen` — `estimatedItemSize`

**Files:**
- Modify: `apps/native/components/screens/finder/finder-feed-screen.tsx`

- [ ] **Step 1: Add `estimatedItemSize` to FlashList**

Find the `<FlashList` opening tag. Add the prop:

```tsx
        <FlashList
          contentContainerStyle={{
            paddingBottom: 96,
            paddingHorizontal: 18,
            paddingTop: 6,
            flexGrow: items.length === 0 ? 1 : undefined,
            justifyContent: items.length === 0 ? "center" : undefined,
          }}
          data={items}
          estimatedItemSize={180}
```

- [ ] **Step 2: Type-check + Biome**

```bash
cd c:/Users/poyhi/wheresmydorm
pnpm check-types && pnpm check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/native/components/screens/finder/finder-feed-screen.tsx
git commit -m "fix(native): estimatedItemSize on finder feed FlashList"
```

---

## Task 10: Final type-check + Biome pass

- [ ] **Step 1: Full check**

```bash
cd c:/Users/poyhi/wheresmydorm
pnpm check-types && pnpm check
```

Expected: zero errors, zero warnings. If any Biome `noUnusedImports` warnings appear, remove the flagged imports.

- [ ] **Step 2: Visual smoke-test checklist**

Run `pnpm dev:native` and verify on device/simulator:

- [ ] Map screen: single FAB bottom-right, tap opens 3 mini-buttons fanning up (Find, Filter, Location)
- [ ] Map screen: 3D toggle visible inside search bar as small pill
- [ ] Map screen: quota banner appears below search bar when `remainingFinds <= 10` and `!isPaid`
- [ ] Map screen: status bar shows no "Finder status" label, just quota copy + count
- [ ] Map screen: ListingSheet has no "Back to map" button — only "View details"
- [ ] Discover screen: no "Map search" / "Saved list" quick action cards
- [ ] Discover screen: category chips (Dorm, Apartment, etc.) appear inside hero card below presets
- [ ] Discover screen: tapping a category chip filters sections below; deselecting shows all
- [ ] Discover screen: metrics row appears outside/below hero card
- [ ] Discover screen: quota banner appears below metrics when applicable
- [ ] Saved screen: 3 stat blocks visible (Saved places, Avg monthly, Types)
- [ ] Feed screen: no visible change (internal `estimatedItemSize` only)

- [ ] **Step 3: Done**

All 4 sub-projects complete. No regressions. Ready for Play Store build prep.
