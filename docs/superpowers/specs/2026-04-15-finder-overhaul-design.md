# Finder Full Overhaul Design

## Goal

Improve the finder experience across all four finder screens (Map, Discover, Saved, Feed) plus the underlying API/quota layer — before Play Store ship. Approach: incremental polish, no new routes, no new stores, each screen independently shippable.

## Scope

Four sub-projects executed in dependency order:

1. **C — API + Quota UX** (unblocks A and B)
2. **A — Map screen**
3. **B — Discover screen**
4. **D — Saved + Feed polish**

---

## Sub-project C: API + Quota UX

### Files

- `packages/api/src/routers/listings.discovery.ts`
- `apps/native/hooks/use-discovery-listings.ts`
- `apps/native/components/ui/quota-upgrade-banner.tsx` ← new
- `apps/native/components/map/FilterBar.tsx`

### Changes

#### 1. `findQuotaStatus` guard

Add `assertFinder(ctx)` at the top of `findQuotaStatus`. Currently it silently returns an all-false object for non-finder roles. Making it explicit server-side matches the existing `findNearby` pattern.

```ts
findQuotaStatus: protectedProcedure.query(async ({ ctx }) => {
  assertFinder(ctx, "Only finders can check quota status.");
  const quota = await getFinderQuotaRow(ctx.userId);
  return toFinderQuotaStatus(quota);
}),
```

Note: callers already gate with `enabled: role === "finder"` — this is a server-side consistency fix only. No client change needed.

#### 2. Expose `remainingFinds` + `isPaid` from `useDiscoveryListings`

Add two explicit fields to the hook return so callers don't need to dig into the `quota` object:

```ts
return {
  // ...existing fields
  isPaid: activeQuota?.isPaid ?? false,
  remainingFinds: activeQuota?.remainingFinds ?? 0,
};
```

#### 3. `QuotaUpgradeBanner` component

New shared component at `apps/native/components/ui/quota-upgrade-banner.tsx`.

Props:
```ts
{
  isPaid: boolean;
  remainingFinds: number;
}
```

Renders: thin amber bar (`bg-[#FFF7ED]`, border `#FED7AA`). Only renders when `!isPaid && remainingFinds <= 10`. Content: `"{remainingFinds} finds left · Upgrade for unlimited →"`. Tap routes to `paymentsRoute()`.

```tsx
if (isPaid || remainingFinds > 10) return null;
return (
  <Pressable onPress={() => router.push(paymentsRoute())} ...>
    <Text>{remainingFinds} finds left · Upgrade for unlimited →</Text>
  </Pressable>
);
```

#### 4. FilterBar inline banner

Replace the plain text `"Upgrade Finder to unlock price, type, amenity, and rating filters."` in `FilterBar.tsx` with `<QuotaUpgradeBanner isPaid={advancedFiltersEnabled} remainingFinds={...} />`.

Add `remainingFinds` prop to `FilterBar`. Pass from `MapTabScreen` via `useDiscoveryListings`.

---

## Sub-project A: Map Screen

### Files

- `apps/native/components/screens/finder/map-screen.tsx`
- `apps/native/components/map/ListingSheet.tsx` (minor)

### Changes

#### 1. Speed-dial FAB

Replace the 4 separate bottom-right controls (Find Nearby button + label chip + Location button + standalone filter button) and the top-right 3D + filter buttons with a single speed-dial FAB system.

**State:** `isDialOpen: boolean` — local `useState`.

**Closed state:** Single 56px dark circle FAB (`bg-[#0B2D23]`) bottom-right. Icon: "+" (Ionicons `add`). Shows spinner overlay when `isSearching`.

**Open state:** FAB rotates to "×". Backdrop `View` covers map at `opacity-[0.15] bg-black`. Three mini-buttons (44px) fan upward with staggered `withSpring` entrance (50ms stagger):
- **Find Nearby** — `search` icon — calls `runSearch()` + `nearbySheetRef.current?.snapToIndex(0)` + closes dial
- **Filter** — `options-outline` icon — calls `setFilterOpen(true)` + closes dial
- **Location** — location SVG icon — calls `centerOnLocation()` + closes dial

Tap backdrop or FAB again → collapses dial.

**Remove:** `LocationButton` component, standalone filter `Pressable`, `SlidersIcon` component, Find Nearby label chip `View`, separate 3D `Pressable` from top-right column.

#### 2. 3D toggle → search bar

Move 3D toggle inside the search bar row as a small pill button on the right side of the search `Pressable`. Replace the search bar's right edge with:

```tsx
<View className="flex-row items-center gap-2">
  {/* existing search icon + text */}
  <Pressable onPress={toggle3D} className="rounded-full bg-[#EEF5F1] px-2.5 py-1.5">
    <Text className={`text-[11px] font-bold ${is3D ? "text-[#0B2D23]" : "text-[#8C8478]"}`}>3D</Text>
  </Pressable>
</View>
```

#### 3. Quota upgrade banner

Below the search bar row, render `<QuotaUpgradeBanner isPaid={isPaid} remainingFinds={remainingFinds} />` (new fields from hook).

#### 4. Status bar slim

Remove `"Finder status"` label line. Keep quota copy + result count + error line. Reduces height by ~1 line.

#### 5. ListingSheet — remove "Back to map" button

The "Back to map" `Pressable` at the bottom of `ListingSheet` is redundant — user can pan-down to close. Remove it. Keep "View details" only.

---

## Sub-project B: Discover Screen

### Files

- `apps/native/components/screens/finder/discover-screen.tsx`
- `apps/native/hooks/use-finder-discovery.ts`

### Changes

#### 1. Remove QuickActionCard row

Delete the `QuickActionCard` component definition and the `<View className="mt-5 flex-row gap-3">` row containing Map search + Saved list cards. Delete `QuickActionCard` function entirely — not used elsewhere.

#### 2. Category chip bar

Add local state to `FinderDiscoverScreen`:
```ts
const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
```

Add horizontal `ScrollView` (no indicator) inside the hero card, below the search input + preset chips row:

```tsx
<ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3 -mx-1">
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
```

`PROPERTY_TYPES` constant:
```ts
const PROPERTY_TYPES = [
  { value: "dorm", label: "Dorm", icon: "bed-outline" },
  { value: "apartment", label: "Apartment", icon: "business-outline" },
  { value: "bedspace", label: "Bedspace", icon: "person-outline" },
  { value: "condo", label: "Condo", icon: "home-outline" },
  { value: "boarding_house", label: "Boarding", icon: "storefront-outline" },
  { value: "studio", label: "Studio", icon: "cube-outline" },
];
```

`CategoryChip` sub-component: icon (Ionicons 16px) + label, pill shape, selected = dark fill.

`toggleType`: if already selected → remove; else add. All deselected = no filter (show all).

#### 3. Filter sections by selected categories

Add `filteredBy` helper:
```ts
function filterByTypes(items: ListingListItem[], types: string[]) {
  if (types.length === 0) return items;
  return items.filter((item) => types.includes(item.propertyType));
}
```

Apply to every `DiscoverySection` `items` prop:
```tsx
<DiscoverySection items={filterByTypes(topRated, selectedTypes)} ... />
<DiscoverySection items={filterByTypes(newArrivals, selectedTypes)} ... />
<DiscoverySection items={filterByTypes(underBudget, selectedTypes)} ... />
<DiscoverySection items={filterByTypes(lastNearbyItems, selectedTypes)} ... />
```

#### 4. Metrics row — move out of hero card

Extract `FinderMetric` row from inside the `bg-[#FFFDFC]` hero card `View`. Render it immediately below the hero card as a standalone `<View className="mt-4 flex-row gap-2.5">`. Keep same three metrics.

#### 5. Quota upgrade banner

Render `<QuotaUpgradeBanner isPaid={...} remainingFinds={...} />` below the metrics row. Source `isPaid` and `remainingFinds` from `finderQuotaQuery.data`.

---

## Sub-project D: Saved + Feed Polish

### Files

- `apps/native/components/screens/finder/saved-screen.tsx`
- `apps/native/components/screens/finder/finder-feed-screen.tsx`

### Changes

#### Saved screen

1. Add `estimatedItemSize={128}` to `FlashList`.
2. Add third stat block to the stats row in `ListHeaderComponent`:

```tsx
<View className="flex-1 rounded-[22px] bg-[#F5F0E8] px-4 py-3">
  <Text className="text-[20px] font-extrabold text-[#111827]">
    {new Set(savedItems.map((i) => i.propertyType)).size}
  </Text>
  <Text className="mt-1 text-[12px] text-[#706A5F]">Types</Text>
</View>
```

Add to the existing `flex-row gap-2.5` stats row alongside "Saved places" and "Avg monthly". Three blocks total.

#### Feed screen

1. Add `estimatedItemSize={180}` to `FlashList`.

---

## Component Inventory

| Component | File | New / Modified |
|---|---|---|
| `QuotaUpgradeBanner` | `components/ui/quota-upgrade-banner.tsx` | New |
| `MapTabScreen` | `components/screens/finder/map-screen.tsx` | Modified |
| `ListingSheet` | `components/map/ListingSheet.tsx` | Modified |
| `FilterBar` | `components/map/FilterBar.tsx` | Modified |
| `FinderDiscoverScreen` | `components/screens/finder/discover-screen.tsx` | Modified |
| `SavedTabScreen` | `components/screens/finder/saved-screen.tsx` | Modified |
| `FinderFeedScreen` | `components/screens/finder/finder-feed-screen.tsx` | Modified |
| `useDiscoveryListings` | `hooks/use-discovery-listings.ts` | Modified |
| `listingDiscoveryProcedures` | `packages/api/src/routers/listings.discovery.ts` | Modified |

---

## What Is NOT Changing

- No new routes
- No new Zustand stores
- No changes to `use-finder-discovery.ts` hook internals
- No changes to `NearbyListingsSheet`
- No changes to `PropertyPin`
- No API schema changes (no new input fields shipped to prod)
- No pagination changes
- Feed logic, follow-gate, cursor pagination — untouched
