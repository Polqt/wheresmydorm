import Ionicons from "@expo/vector-icons/Ionicons";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
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
import { finderHomeRoute, listingDetailRoute } from "@/utils/routes";

const COVER_FALLBACK =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800";

const PROPERTY_TYPES = [
  { value: "dorm", label: "Dorm", icon: "bed-outline" as const },
  { value: "apartment", label: "Apartment", icon: "business-outline" as const },
  { value: "bedspace", label: "Bedspace", icon: "person-outline" as const },
  { value: "condo", label: "Condo", icon: "home-outline" as const },
  {
    value: "boarding_house",
    label: "Boarding",
    icon: "storefront-outline" as const,
  },
  { value: "studio", label: "Studio", icon: "cube-outline" as const },
];

function filterByTypes(
  items: ListingListItem[],
  types: string[],
): ListingListItem[] {
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
          <Text className="flex-1 text-[#7B7468] text-[12px]" numberOfLines={1}>
            {[item.city, item.barangay].filter(Boolean).join(" • ")}
          </Text>
          <View className="ml-2 flex-row items-center gap-1">
            <Ionicons color="#F59E0B" name="star" size={12} />
            <Text className="font-bold text-[#111827] text-[12px]">
              {item.ratingOverall ? item.ratingOverall.toFixed(1) : "New"}
            </Text>
          </View>
        </View>
        <Text
          className="mt-1 font-bold text-[#111827] text-[18px] tracking-[-0.4px]"
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <View className="mt-1 flex-row items-center justify-between">
          <Text className="text-[#8A8176] text-[13px] capitalize">
            {item.propertyType.replaceAll("_", " ")}
          </Text>
          <Text className="font-extrabold text-[#0B2D23] text-[15px]">
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
        className={`font-bold text-[12px] ${
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
        className={`font-bold text-[12px] ${
          selected ? "text-white" : "text-[#111827]"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FinderMetric({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-[22px] bg-[#F5F0E8] px-4 py-3">
      <Text className="font-extrabold text-[#111827] text-[20px]">{value}</Text>
      <Text className="mt-1 text-[#706A5F] text-[12px]">{label}</Text>
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
          <Text className="font-extrabold text-[#111827] text-[20px] tracking-[-0.5px]">
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-1 text-[#706A5F] text-[13px] leading-5">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {actionLabel && onActionPress ? (
          <Pressable onPress={onActionPress}>
            <Text className="font-bold text-[#0B4A30] text-[13px]">
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
  const finderQuotaQuery = useQuery(
    trpc.listings.findQuotaStatus.queryOptions(),
  );
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

  const activeSearchCount =
    searchText.trim().length > 0 ? searchResults.length : 0;

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
          <Text className="font-extrabold text-[#111827] text-[28px] tracking-[-0.8px]">
            Explore homes with less noise
          </Text>
          <Text className="mt-2 text-[#706A5F] text-[14px] leading-6">
            Search titles and areas, revisit recent finds, or browse curated
            picks like top rated and budget-friendly places.
          </Text>

          <View className="mt-4 flex-row items-center gap-3 rounded-[24px] bg-[#F5F0E8] px-4 py-3">
            <Ionicons color="#6F685E" name="search" size={18} />
            <TextInput
              className="flex-1 py-0 text-[#111827] text-[15px]"
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
              <Text className="font-bold text-[12px] text-white">Search</Text>
            </Pressable>
          </View>

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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3"
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

        {/* Metrics row */}
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

        {savedSearches.length > 0 ? (
          <View className="mt-7">
            <Text className="mb-3 font-extrabold text-[#0B4A30] text-[12px] uppercase tracking-[1px]">
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

        {recentSearches.length > 0 ? (
          <View className="mt-5">
            <Text className="mb-3 font-extrabold text-[#0B4A30] text-[12px] uppercase tracking-[1px]">
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
              action={{
                label: "Clear search",
                onPress: () => setSearchText(""),
              }}
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
