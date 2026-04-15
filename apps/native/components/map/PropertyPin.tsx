import FontAwesome from "@expo/vector-icons/FontAwesome";
import type React from "react";
import { Pressable, Text, View } from "react-native";
import { Marker } from "react-native-maps";

import type { ListingListItem } from "@/types/listings";
import { formatCompactPrice } from "@/utils/profile";

const iconByType: Record<
  ListingListItem["propertyType"],
  React.ComponentProps<typeof FontAwesome>["name"]
> = {
  apartment: "building",
  bedspace: "bed",
  boarding_house: "home",
  condo: "building-o",
  dorm: "university",
  studio: "square",
};

export function PropertyPin({
  listing,
  isSelected,
  onPress,
}: {
  listing: ListingListItem;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Marker
      coordinate={{ latitude: listing.lat, longitude: listing.lng }}
      onPress={onPress}
    >
      <Pressable onPress={onPress} className="items-center">
        <View
          className={`min-w-[84px] rounded-[18px] border bg-[#FFFDF9] px-[10px] py-2 shadow-sm ${
            isSelected ? "border-[#0B2D23] bg-[#EEF5F1]" : "border-[#D8D0C6]"
          }`}
          style={isSelected ? { transform: [{ scale: 1.03 }] } : undefined}
        >
          <View className="flex-row items-center justify-between gap-2">
            <FontAwesome
              name={iconByType[listing.propertyType]}
              color="#0B2D23"
              size={14}
            />
            <Text className="font-extrabold text-[#0F172A] text-[12px]">
              {formatCompactPrice(listing.pricePerMonth)}
            </Text>
          </View>
          <View className="mt-1.5 flex-row self-start rounded-full bg-[#F5F0E7] px-2 py-[3px]">
            <FontAwesome name="star" color="#f59e0b" size={10} />
            <Text className="ml-1 font-bold text-[11px] text-slate-700">
              {listing.ratingOverall ? listing.ratingOverall.toFixed(1) : "New"}
            </Text>
          </View>
        </View>
      </Pressable>
    </Marker>
  );
}
