import Ionicons from "@expo/vector-icons/Ionicons";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import { memo, useCallback } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

  return (
    <SafeAreaView className="flex-1 bg-[#F7F4EE]" edges={["top"]}>
      <ScreenHeader
        subtitle="Places you bookmarked while browsing."
        title="Saved"
      />

      {savedQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0B2D23" size="large" />
        </View>
      ) : (
        <FlashList
          contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 18 }}
          data={savedQuery.data ?? []}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={() => <View className="h-px bg-[#E9E2D8]" />}
          ListEmptyComponent={
            <View className="mt-20 items-center px-8">
              <Text className="text-[18px] font-extrabold text-[#1A1A1A]">
                No saved listings
              </Text>
              <Text className="mt-2 text-center text-[14px] leading-[22px] text-[#706A5F]">
                Bookmark listings from the map or discover tab.
              </Text>
              <Pressable
                className="mt-5 rounded-full bg-[#111827] px-[22px] py-[13px]"
                onPress={() => router.replace(finderHomeRoute())}
              >
                <Text className="text-[14px] font-bold text-white">
                  Browse map
                </Text>
              </Pressable>
            </View>
          }
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
