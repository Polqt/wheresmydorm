import Ionicons from "@expo/vector-icons/Ionicons";
import { FlashList } from "@shopify/flash-list";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import { memo, useCallback } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ErrorRetry } from "@/components/ui/error-retry";
import { ScreenHeader } from "@/components/ui/screen-header";
import type { MyListing } from "@/types/listings";
import { trpc } from "@/utils/api-client";
import { formatCurrency } from "@/utils/profile";
import { createListingRoute, listingEditRoute } from "@/utils/routes";

const STATUS_COLORS: Record<MyListing["status"], { bg: string; text: string }> =
  {
    active: { bg: "#EEF5F1", text: "#0B2D23" },
    paused: { bg: "#FFF3E0", text: "#E65100" },
    archived: { bg: "#F5F0EA", text: "#706A5F" },
  };

const COVER_FALLBACK =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=400";

const ListingRow = memo(function ListingRow({
  item,
  onPress,
  onTogglePause,
}: {
  item: MyListing;
  onPress: (id: string) => void;
  onTogglePause: (id: string, current: MyListing["status"]) => void;
}) {
  const statusStyle = STATUS_COLORS[item.status];

  return (
    <Pressable
      className="mb-3 flex-row items-center gap-3 overflow-hidden rounded-[22px] bg-[#FFFDFC]"
      onPress={() => onPress(item.id)}
    >
      <Image
        className="h-[88px] w-[88px]"
        contentFit="cover"
        source={{ uri: item.coverPhoto ?? COVER_FALLBACK }}
        transition={200}
      />
      <View className="flex-1 py-3">
        <Text
          className="pr-2 font-bold text-[#111827] text-[14px] leading-[19px]"
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Text className="mt-0.5 text-[#706A5F] text-[12px]">
          {[item.city, item.barangay].filter(Boolean).join(" - ")}
        </Text>
        <Text className="mt-1 font-extrabold text-[#0B2D23] text-[13px]">
          {formatCurrency(item.pricePerMonth)}/mo
        </Text>
        <View className="mt-2 flex-row items-center justify-between pr-2">
          <View
            className="rounded-full px-2 py-1"
            style={{ backgroundColor: statusStyle.bg }}
          >
            <Text
              className="font-bold text-[11px] uppercase tracking-[0.3px]"
              style={{ color: statusStyle.text }}
            >
              {item.status}
            </Text>
          </View>
          <View className="items-end">
            <Text className="font-semibold text-[#7B7468] text-[12px]">
              {item.inquiryCount} inquiries
            </Text>
            {item.requiresListingFee ? (
              <Text
                className={`mt-1 font-bold text-[11px] ${
                  item.listingFeeStatus === "paid"
                    ? "text-[#0B4A30]"
                    : "text-[#C05A18]"
                }`}
              >
                {item.listingFeeStatus === "paid"
                  ? "Fee cleared"
                  : item.listingFeeStatus === "pending"
                    ? "Fee pending"
                    : "Fee required"}
              </Text>
            ) : (
              <Text className="mt-1 font-bold text-[#0B4A30] text-[11px]">
                Free slot
              </Text>
            )}
          </View>
        </View>
      </View>

      <Pressable
        className="px-3"
        hitSlop={10}
        onPress={() => onTogglePause(item.id, item.status)}
      >
        <Ionicons
          color="#706A5F"
          name={
            item.status === "active"
              ? "pause-circle-outline"
              : "play-circle-outline"
          }
          size={22}
        />
      </Pressable>
    </Pressable>
  );
});

export default function ListerListingsTabScreen() {
  const queryClient = useQueryClient();
  const listingsQuery = useQuery(trpc.listings.myListings.queryOptions());

  const setStatusMutation = useMutation(
    trpc.listings.setStatus.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["trpc", "listings", "myListings"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["trpc", "listings", "list"],
          }),
        ]);
      },
    }),
  );

  const handleTogglePause = useCallback(
    (id: string, current: MyListing["status"]) => {
      const next: MyListing["status"] =
        current === "active" ? "paused" : "active";

      Alert.alert(
        next === "paused" ? "Pause listing?" : "Reactivate listing?",
        next === "paused"
          ? "Finders will not see it while paused."
          : "Finders will see it again once active.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: next === "paused" ? "Pause" : "Reactivate",
            style: next === "paused" ? "destructive" : "default",
            onPress: () => setStatusMutation.mutate({ id, status: next }),
          },
        ],
      );
    },
    [setStatusMutation],
  );

  const renderItem = useCallback(
    ({ item }: { item: MyListing }) => (
      <ListingRow
        item={item}
        onPress={(id) => router.push(listingEditRoute(id))}
        onTogglePause={handleTogglePause}
      />
    ),
    [handleTogglePause],
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F7F4EE]" edges={["top"]}>
      <ScreenHeader
        subtitle="Manage pricing, status, and analytics for your active properties."
        title="Listings"
        action={
          <Pressable
            className="flex-row items-center gap-1.5 rounded-full bg-[#111827] px-3.5 py-2.5"
            onPress={() => router.push(createListingRoute())}
          >
            <Ionicons color="#ffffff" name="add" size={18} />
            <Text className="font-bold text-[13px] text-white">New</Text>
          </Pressable>
        }
      />

      {listingsQuery.isError ? (
        <ErrorRetry
          context="listings"
          onRetry={() => listingsQuery.refetch()}
        />
      ) : null}

      {listingsQuery.isError ? null : (
        <FlashList
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 100 }}
          data={listingsQuery.data ?? []}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View className="mt-2.5 items-center rounded-[28px] bg-[#FFFDFC] px-7 py-9">
              <Text className="font-extrabold text-[#111827] text-[18px]">
                No listings yet
              </Text>
              <Text className="mt-2 text-center text-[#706A5F] text-[14px] leading-[22px]">
                Publish your first property to start appearing in finder
                searches.
              </Text>
              <Pressable
                className="mt-[18px] rounded-full bg-[#111827] px-[22px] py-[13px]"
                onPress={() => router.push(createListingRoute())}
              >
                <Text className="font-bold text-[14px] text-white">
                  Create listing
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
