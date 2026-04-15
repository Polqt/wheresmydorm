import Ionicons from "@expo/vector-icons/Ionicons";
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import type { RefObject } from "react";
import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";

import type { ListingListItem } from "@/types/listings";
import { formatCurrency } from "@/utils/profile";

const SNAP_POINTS = ["28%", "60%"];
const COVER_FALLBACK =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800";

function NearbyCard({
  item,
  onPress,
  onSelect,
}: {
  item: ListingListItem;
  onPress: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const handlePress = useCallback(() => onSelect(item.id), [item.id, onSelect]);
  const handleDetail = useCallback(() => onPress(item.id), [item.id, onPress]);

  return (
    <Pressable
      className="mb-3 flex-row gap-3 rounded-[22px] bg-white px-3.5 py-3.5"
      onPress={handlePress}
    >
      <Image
        className="h-20 w-20 rounded-2xl"
        contentFit="cover"
        source={{ uri: item.coverPhoto ?? COVER_FALLBACK }}
        transition={200}
      />
      <View className="flex-1 justify-center">
        <Text
          className="font-bold text-[#0F172A] text-[15px] leading-5"
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Text className="mt-1 text-[#706A5F] text-[12px]" numberOfLines={1}>
          {[item.barangay, item.city].filter(Boolean).join(", ")}
        </Text>
        <View className="mt-1.5 flex-row items-center gap-2">
          <Text className="font-extrabold text-[#0B2D23] text-[14px]">
            {formatCurrency(item.pricePerMonth)}
          </Text>
          <View className="flex-row items-center gap-1">
            <Ionicons color="#F59E0B" name="star" size={11} />
            <Text className="font-bold text-[12px] text-slate-700">
              {item.ratingOverall ? item.ratingOverall.toFixed(1) : "New"}
            </Text>
          </View>
        </View>
      </View>
      <Pressable
        className="self-center rounded-full bg-[#EEF5F1] px-3 py-2"
        hitSlop={8}
        onPress={handleDetail}
      >
        <Text className="font-bold text-[#0B4A30] text-[11px]">Details</Text>
      </Pressable>
    </Pressable>
  );
}

export function NearbyListingsSheet({
  items,
  onClose,
  onPressDetails,
  onSelectListing,
  sheetRef,
}: {
  items: ListingListItem[];
  onClose: () => void;
  onPressDetails: (id: string) => void;
  onSelectListing: (id: string) => void;
  sheetRef: RefObject<BottomSheet | null>;
}) {
  const renderItem = useCallback(
    ({ item }: { item: ListingListItem }) => (
      <NearbyCard
        item={item}
        onPress={onPressDetails}
        onSelect={onSelectListing}
      />
    ),
    [onPressDetails, onSelectListing],
  );

  const keyExtractor = useCallback((item: ListingListItem) => item.id, []);

  return (
    <BottomSheet
      ref={sheetRef}
      backgroundStyle={BACKGROUND_STYLE}
      enablePanDownToClose
      handleIndicatorStyle={HANDLE_STYLE}
      index={-1}
      onClose={onClose}
      snapPoints={SNAP_POINTS}
    >
      <View className="flex-row items-center justify-between px-4 pt-1 pb-2">
        <Text className="font-extrabold text-[#0F172A] text-[16px]">
          {items.length} nearby place{items.length !== 1 ? "s" : ""}
        </Text>
        <Pressable hitSlop={12} onPress={onClose}>
          <Ionicons color="#706A5F" name="close" size={20} />
        </Pressable>
      </View>

      <BottomSheetFlatList
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center py-10">
            <Text className="font-semibold text-[#9E9890] text-[14px]">
              No listings in this area yet.
            </Text>
          </View>
        }
      />
    </BottomSheet>
  );
}

const BACKGROUND_STYLE = {
  backgroundColor: "#FFFDF9",
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
} as const;

const HANDLE_STYLE = {
  backgroundColor: "#D8D0C6",
  width: 44,
} as const;
