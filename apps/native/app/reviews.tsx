import FontAwesome from "@expo/vector-icons/FontAwesome";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { trpc } from "@/utils/api-client";
import { formatCurrency } from "@/utils/profile";
import { listingDetailRoute } from "@/utils/routes";

function formatReviewDate(value: string | Date) {
  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ReviewsScreen() {
  const insets = useSafeAreaInsets();
  const reviewsQuery = useQuery(trpc.reviews.myReviews.queryOptions());
  const items = reviewsQuery.data ?? [];

  return (
    <View className="flex-1 bg-[#f7f4ee]" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center border-b border-[#E7E0D5] bg-[#fffdf9] px-4 py-3.5">
        <Pressable
          className="h-9 w-9 items-center justify-center rounded-full bg-[#F0EBE3]"
          onPress={() => router.back()}
        >
          <FontAwesome color="#0f172a" name="arrow-left" size={16} />
        </Pressable>
        <Text className="flex-1 text-center text-base font-extrabold text-slate-900">
          My reviews
        </Text>
        <View className="w-9" />
      </View>

      {/* Summary */}
      <View className="mx-4 mt-3.5 rounded-3xl bg-[#fffdf9] px-4 py-4">
        <Text className="text-xl font-extrabold text-slate-900">
          {items.length} reviews written
        </Text>
        <Text className="mt-1 text-[13px] leading-5 text-[#706A5F]">
          Revisit your published feedback and any lister responses.
        </Text>
      </View>

      {/* Error state */}
      {reviewsQuery.isError ? (
        <View className="mx-4 mt-3 rounded-2xl bg-red-50 px-4 py-3">
          <Text className="text-[13px] font-semibold text-red-700">
            Failed to load reviews.
          </Text>
          <Pressable
            className="mt-2 self-start"
            onPress={() => reviewsQuery.refetch()}
          >
            <Text className="text-[13px] font-bold text-red-700 underline">
              Retry
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* List */}
      <FlashList
        contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 16 }}
        data={items}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          reviewsQuery.isLoading ? null : (
            <Text className="py-8 text-center text-[13px] font-semibold text-[#9E9890]">
              You have not written any reviews yet
            </Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            className="mb-3 rounded-3xl bg-[#fffdf9] px-4 py-4"
            onPress={() => router.push(listingDetailRoute(item.listingId))}
          >
            {/* Card header */}
            <View className="flex-row items-center justify-between gap-2">
              <Text
                className="flex-1 text-[15px] font-extrabold text-slate-900"
                numberOfLines={1}
              >
                {item.listing.title}
              </Text>
              <Text className="text-[13px] font-extrabold text-[#0B4A30]">
                {item.ratingOverall.toFixed(1)}★
              </Text>
            </View>

            {/* Location */}
            <Text className="mt-1 text-[12px] text-[#706A5F]">
              {[item.listing.city, item.listing.barangay]
                .filter(Boolean)
                .join(" • ")}
            </Text>

            {/* Review body */}
            <Text
              className="mt-2.5 text-[13px] leading-5 text-[#3f3a33]"
              numberOfLines={4}
            >
              {item.body}
            </Text>

            {/* Footer */}
            <View className="mt-3 flex-row items-center justify-between">
              <Text className="text-[12px] font-semibold text-[#8B857C]">
                {formatReviewDate(item.createdAt)}
              </Text>
              <Text className="text-[12px] font-extrabold text-[#0B2D23]">
                {formatCurrency(item.listing.pricePerMonth ?? "0")}
              </Text>
            </View>

            {/* Lister response */}
            {item.listerResponse ? (
              <View className="mt-3.5 rounded-[18px] bg-[#F3F7F4] px-3 py-3">
                <Text className="text-[11px] font-extrabold uppercase tracking-wide text-[#0B4A30]">
                  Lister response
                </Text>
                <Text
                  className="mt-1 text-[12px] leading-[18px] text-[#264136]"
                  numberOfLines={3}
                >
                  {item.listerResponse}
                </Text>
              </View>
            ) : null}
          </Pressable>
        )}
      />
    </View>
  );
}
