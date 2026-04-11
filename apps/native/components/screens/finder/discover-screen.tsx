import Ionicons from "@expo/vector-icons/Ionicons";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { router } from "expo-router";
import { memo, useCallback } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/ui/screen-header";
import { useFinderDiscovery } from "@/hooks/use-finder-discovery";
import type { DiscoverySearchPreset } from "@/types/discovery";
import type { ListingListItem } from "@/types/listings";
import { formatCurrency } from "@/utils/profile";
import {
  finderHomeRoute,
  listingDetailRoute,
  savedListingsRoute,
} from "@/utils/routes";

const COVER_FALLBACK =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800";

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

function QuickActionCard({
  description,
  icon,
  onPress,
  title,
}: {
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  title: string;
}) {
  return (
    <Pressable className="flex-1 rounded-[24px] bg-[#FFFDFC] p-4" onPress={onPress}>
      <View className="h-10 w-10 items-center justify-center rounded-full bg-[#F5F0E8]">
        <Ionicons color="#111827" name={icon} size={18} />
      </View>
      <Text className="mt-3 text-[16px] font-extrabold text-[#111827]">
        {title}
      </Text>
      <Text className="mt-1.5 text-[13px] leading-5 text-[#706A5F]">
        {description}
      </Text>
    </Pressable>
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
  if (items.length === 0) {
    return null;
  }

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
    (preset: DiscoverySearchPreset) => {
      applyPreset(preset);
    },
    [applyPreset],
  );

  const activeSearchCount = searchText.trim().length > 0 ? searchResults.length : 0;

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
        <View className="rounded-[32px] bg-[#FFFDFC] px-5 py-5">
          <Text className="text-[28px] font-extrabold tracking-[-0.8px] text-[#111827]">
            Explore homes with less noise
          </Text>
          <Text className="mt-2 text-[14px] leading-6 text-[#706A5F]">
            Search titles and areas, revisit recent finds, or browse curated
            picks like top rated and budget-friendly places.
          </Text>

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

          <View className="mt-5 flex-row gap-2.5">
            <FinderMetric
              label="Saved searches"
              value={String(savedSearches.length)}
            />
            <FinderMetric
              label="Nearby picks"
              value={String(lastNearbyItems.length)}
            />
            <FinderMetric
              label="Live results"
              value={String(activeSearchCount)}
            />
          </View>
        </View>

        <View className="mt-5 flex-row gap-3">
          <QuickActionCard
            description="Jump back into the full map with your nearby inventory."
            icon="map-outline"
            onPress={() => router.push(finderHomeRoute())}
            title="Map search"
          />
          <QuickActionCard
            description="Review the shortlist you bookmarked while comparing options."
            icon="bookmark-outline"
            onPress={() => router.push(savedListingsRoute())}
            title="Saved list"
          />
        </View>

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

        {searchText.trim().length > 0 ? (
          <DiscoverySection
            items={searchResults}
            onPressItem={handleListingPress}
            subtitle={`${searchResults.length} matches across titles, descriptions, and location fields.`}
            title="Search results"
          />
        ) : null}

        <DiscoverySection
          actionLabel="Use map"
          items={lastNearbyItems}
          onActionPress={() => router.push(finderHomeRoute())}
          onPressItem={handleListingPress}
          subtitle="Your last nearby find from the map is kept here for quick review."
          title="Recent nearby"
        />

        <DiscoverySection
          items={topRated}
          onPressItem={handleListingPress}
          subtitle="Places with stronger community ratings and better review depth."
          title="Top rated"
        />

        <DiscoverySection
          items={newArrivals}
          onPressItem={handleListingPress}
          subtitle="Freshly added listings worth checking before they get crowded."
          title="New arrivals"
        />

        <DiscoverySection
          items={underBudget}
          onPressItem={handleListingPress}
          subtitle="Budget-friendly picks to keep your shortlist realistic."
          title="Under your budget"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
