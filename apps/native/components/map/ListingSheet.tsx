import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import type { RefObject } from "react";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";

import type { ListingDetail } from "@/types/listings";
import { formatCurrency } from "@/utils/profile";

const SHEET_SNAP_POINTS = ["36%", "72%"];

export function ListingSheet({
  sheetRef,
  isOpen,
  isLoading,
  listing,
  errorMessage,
  onClose,
  onViewDetails,
}: {
  sheetRef: RefObject<BottomSheet | null>;
  isOpen: boolean;
  isLoading: boolean;
  listing: ListingDetail | null;
  errorMessage: string | null;
  onClose: () => void;
  onViewDetails: (id: string) => void;
}) {
  useEffect(() => {
    if (!sheetRef.current) {
      return;
    }

    if (isOpen) {
      sheetRef.current.snapToIndex(0);
    } else {
      sheetRef.current.close();
    }
  }, [isOpen, sheetRef]);

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={SHEET_SNAP_POINTS}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={SHEET_BACKGROUND_STYLE}
      handleIndicatorStyle={HANDLE_STYLE}
    >
      <BottomSheetScrollView contentContainerStyle={CONTENT_CONTAINER_STYLE}>
        {isLoading ? (
          <BottomSheetView className="py-2">
            <Text className="text-[20px] font-extrabold text-[#0F172A]">
              Loading listing
            </Text>
            <Text className="mt-2 text-[14px] leading-[22px] text-slate-600">
              Fetching details, photos, and the full review snapshot.
            </Text>
          </BottomSheetView>
        ) : null}

        {errorMessage ? (
          <BottomSheetView className="py-2">
            <Text className="text-[20px] font-extrabold text-[#0F172A]">
              Listing unavailable
            </Text>
            <Text className="mt-2 text-[14px] leading-[22px] text-slate-600">
              {errorMessage}
            </Text>
          </BottomSheetView>
        ) : null}

        {listing ? (
          <BottomSheetView>
            <Image
              className="h-[196px] rounded-[22px]"
              contentFit="cover"
              source={
                listing.photos[0]?.url ??
                "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop"
              }
            />

            <View className="mt-[18px] flex-row gap-3">
              <View className="flex-1">
                <Text className="text-[22px] font-extrabold text-[#0B2D23]">
                  {formatCurrency(listing.pricePerMonth)}
                </Text>
                <Text className="mt-1 text-[22px] font-extrabold text-[#0F172A]">
                  {listing.title}
                </Text>
                <Text className="mt-1 text-[14px] text-slate-600">
                  {listing.barangay ? `${listing.barangay}, ` : ""}
                  {listing.city}
                </Text>
              </View>
              <View className="items-center justify-center rounded-[20px] bg-[#F3ECE0] px-[14px] py-[10px]">
                <Text className="text-[18px] font-extrabold text-[#0B2D23]">
                  {listing.ratingOverall
                    ? listing.ratingOverall.toFixed(1)
                    : "New"}
                </Text>
                <Text className="text-[11px] uppercase tracking-[0.8px] text-[#6C6A64]">
                  rating
                </Text>
              </View>
            </View>

            <View className="mt-4 flex-row flex-wrap gap-2">
              <View className="rounded-full bg-[#EEF5F1] px-3 py-2">
                <Text className="text-[12px] font-bold capitalize text-[#0B2D23]">
                  {listing.propertyType.replaceAll("_", " ")}
                </Text>
              </View>
              <View className="rounded-full bg-[#EEF5F1] px-3 py-2">
                <Text className="text-[12px] font-bold capitalize text-[#0B2D23]">
                  {listing.maxOccupants ?? "?"} occupants
                </Text>
              </View>
              <View className="rounded-full bg-[#EEF5F1] px-3 py-2">
                <Text className="text-[12px] font-bold capitalize text-[#0B2D23]">
                  {listing.sizeSqm ? `${listing.sizeSqm} sqm` : "Size TBC"}
                </Text>
              </View>
            </View>

            <Text className="mt-5 text-[16px] font-extrabold text-[#0F172A]">
              About this place
            </Text>
            <Text className="mt-2 text-[14px] leading-[22px] text-slate-600">
              {listing.description}
            </Text>

            <Text className="mt-5 text-[16px] font-extrabold text-[#0F172A]">
              Amenities
            </Text>
            <View className="mt-[10px] flex-row flex-wrap gap-2">
              {listing.amenities.map((amenity: string) => (
                <View
                  key={amenity}
                  className="rounded-full border border-[#D9D1C6] bg-[#F7F2E9] px-[10px] py-[6px]"
                >
                  <Text className="text-[12px] font-bold capitalize text-[#5F5A51]">
                    {amenity.replaceAll("_", " ")}
                  </Text>
                </View>
              ))}
            </View>

            <Text className="mt-5 text-[16px] font-extrabold text-[#0F172A]">
              Lister
            </Text>
            <Text className="mt-2 text-[14px] leading-[22px] text-slate-600">
              {listing.lister?.displayName ?? "Unknown lister"}
            </Text>

            <Pressable
              onPress={() => onViewDetails(listing.id)}
              className="mt-[22px] items-center rounded-[18px] border border-[#0B2D23] bg-[#EEF5F1] py-[14px]"
            >
              <Text className="text-[14px] font-extrabold text-[#0B2D23]">
                View details
              </Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              className="mt-3 items-center rounded-[18px] bg-[#0B2D23] py-[14px]"
            >
              <Text className="text-[14px] font-extrabold text-white">
                Back to map
              </Text>
            </Pressable>
          </BottomSheetView>
        ) : null}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const SHEET_BACKGROUND_STYLE = {
  backgroundColor: "#FFFDF9",
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
} as const;

const HANDLE_STYLE = {
  backgroundColor: "#D8D0C6",
  width: 44,
} as const;

const CONTENT_CONTAINER_STYLE = {
  paddingHorizontal: 18,
  paddingBottom: 28,
} as const;
