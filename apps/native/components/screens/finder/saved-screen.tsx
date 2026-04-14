import Ionicons from "@expo/vector-icons/Ionicons";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import { memo, useCallback } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorRetry } from "@/components/ui/error-retry";
import { ScreenHeader } from "@/components/ui/screen-header";
import type { SavedListing } from "@/types/listings";
import { formatCurrency } from "@/utils/profile";
import { finderHomeRoute, listingDetailRoute } from "@/utils/routes";
import { trpc } from "@/utils/api-client";

const COVER_FALLBACK =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=400";

const SavedRow = memo(function SavedRow({
  item,
  onPress,
}: {
  item: SavedListing;
  onPress: (id: string) => void;
}) {
  const handlePress = useCallback(() => onPress(item.id), [item.id, onPress]);

  return (
    <Pressable className="flex-row gap-3.5 py-3.5" onPress={handlePress}>
      <Image
        className="h-28 w-[108px] rounded-[20px]"
        contentFit="cover"
        source={{ uri: item.coverPhoto ?? COVER_FALLBACK }}
        transition={200}
      />
      <View className="flex-1 justify-center">
        <Text className="text-[16px] font-bold leading-[21px] text-[#111827]" numberOfLines={2}>
          {item.title}
        </Text>
        <Text className="mt-[5px] text-[13px] text-[#736C63]">
          {[item.city, item.barangay].filter(Boolean).join(" - ")}
        </Text>
        <Text className="mt-2 text-[14px] font-extrabold text-[#0B2D23]">
          {formatCurrency(item.pricePerMonth)}/mo
        </Text>
        <View className="mt-2.5 flex-row items-center justify-between">
          <Text className="text-[12px] capitalize text-[#8A8176]">
            {item.propertyType.replaceAll("_", " ")}
          </Text>
          <View className="flex-row items-center gap-1">
            <Ionicons color="#F59E0B" name="star" size={12} />
            <Text className="text-[12px] font-bold text-slate-700">
              {item.ratingOverall ? item.ratingOverall.toFixed(1) : "New"}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

export default function SavedTabScreen() {
  const savedQuery = useQuery(trpc.listings.savedListings.queryOptions());
  const savedItems = savedQuery.data ?? [];

  const handlePress = useCallback((id: string) => {
    router.push(listingDetailRoute(id));
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: SavedListing }) => (
      <SavedRow item={item} onPress={handlePress} />
    ),
    [handlePress],
  );

  const keyExtractor = useCallback((item: SavedListing) => item.id, []);

  const avgPrice =
    savedItems.length > 0
      ? Math.round(
          savedItems.reduce((sum, item) => sum + Number(item.pricePerMonth), 0) /
            savedItems.length,
        )
      : null;
  const topCity =
    savedItems.length > 0
      ? Object.entries(
          savedItems.reduce<Record<string, number>>((acc, item) => {
            const key = item.city.trim();
            acc[key] = (acc[key] ?? 0) + 1;
            return acc;
          }, {}),
        ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
      : null;

  return (
    <SafeAreaView className="flex-1 bg-[#F7F4EE]" edges={["top"]}>
      <ScreenHeader
        subtitle="Places you bookmarked while browsing."
        title="Saved"
      />

      {savedQuery.isError ? (
        <ErrorRetry
          message="Failed to load saved listings."
          onRetry={() => savedQuery.refetch()}
        />
      ) : savedQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0B2D23" size="large" />
        </View>
      ) : (
        <FlashList
          contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 18 }}
          data={savedItems}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={() => <View className="h-px bg-[#E9E2D8]" />}
          ListHeaderComponent={
            savedItems.length > 0 ? (
              <View className="mb-4 rounded-[28px] bg-[#FFFDFC] p-5">
                <Text className="text-[24px] font-extrabold tracking-[-0.6px] text-[#111827]">
                  Your shortlist is ready
                </Text>
                <Text className="mt-1.5 text-[14px] leading-6 text-[#706A5F]">
                  Compare saved places before you message a lister or revisit the
                  map.
                </Text>

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
                </View>

                {topCity ? (
                  <View className="mt-4 rounded-[22px] bg-[#0B2D23] px-4 py-4">
                    <Text className="text-[12px] font-bold uppercase tracking-[0.8px] text-[#D9E7E1]">
                      Strongest cluster
                    </Text>
                    <Text className="mt-1 text-[18px] font-extrabold text-white">
                      {topCity}
                    </Text>
                    <Text className="mt-1 text-[13px] leading-5 text-[#D9E7E1]">
                      Most of your saved inventory is currently centered here.
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              illustration="🏠"
              title="No saved listings yet"
              description="Bookmark listings from the map or discover tab to build your shortlist."
              action={{ label: "Browse map", onPress: () => router.replace(finderHomeRoute()) }}
            />
          }
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
