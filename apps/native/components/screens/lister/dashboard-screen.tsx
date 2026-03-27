import Ionicons from "@expo/vector-icons/Ionicons";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { memo, useCallback, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/ui/screen-header";
import { useCurrentProfile } from "@/hooks/use-current-profile";
import { useAuth } from "@/providers/auth-provider";
import type { MyListing } from "@/types/listings";
import { formatCurrency } from "@/utils/profile";
import {
  createListingRoute,
  listerInboxTabRoute,
  listerListingsTabRoute,
  listingEditRoute,
} from "@/utils/routes";
import { trpc } from "@/utils/api-client";

const statusTone: Record<MyListing["status"], { bg: string; text: string }> = {
  active: { bg: "#E8F3EE", text: "#0B4A30" },
  archived: { bg: "#F1ECE5", text: "#746C61" },
  paused: { bg: "#FFF1E6", text: "#C05A18" },
};

const DashboardListingRow = memo(function DashboardListingRow({
  item,
  onPress,
}: {
  item: MyListing;
  onPress: (id: string) => void;
}) {
  const tone = statusTone[item.status];

  return (
    <Pressable className="flex-row items-center gap-3 py-3.5" onPress={() => onPress(item.id)}>
      <View className="flex-1">
        <Text className="text-[15px] font-bold text-[#111827]" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="mt-1 text-[12px] text-[#7B7468]">
          {[item.city, item.barangay].filter(Boolean).join(" - ")}
        </Text>
        <Text className="mt-1.5 text-[13px] font-extrabold text-[#0B2D23]">
          {formatCurrency(item.pricePerMonth)}/mo
        </Text>
      </View>
      <View className="items-end gap-2">
        <View
          className="rounded-full px-2.5 py-1.5"
          style={{ backgroundColor: tone.bg }}
        >
          <Text
            className="text-[11px] font-extrabold uppercase tracking-[0.3px]"
            style={{ color: tone.text }}
          >
            {item.status}
          </Text>
        </View>
        <Text className="text-[12px] font-semibold text-[#7B7468]">
          {item.inquiryCount} inquiries
        </Text>
      </View>
    </Pressable>
  );
});

function StatBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1 rounded-[22px] bg-[#FFFDFC] px-3.5 py-4">
      <Text className="text-[22px] font-extrabold text-[#111827]">{value}</Text>
      <Text className="mt-1 text-[12px] text-[#7B7468]">{label}</Text>
    </View>
  );
}

export default function ListerDashboardTabScreen() {
  const { role, user } = useAuth();
  const profileQuery = useCurrentProfile(user);
  const listingsQuery = useQuery({
    ...trpc.listings.myListings.queryOptions(),
    enabled: role === "lister",
  });
  const threadsQuery = useQuery({
    ...trpc.messages.getThreads.queryOptions(),
    enabled: role === "lister",
  });

  const recentListings = useMemo(
    () => (listingsQuery.data ?? []).slice(0, 4),
    [listingsQuery.data],
  );
  const activeListings = useMemo(
    () =>
      (listingsQuery.data ?? []).filter((listing) => listing.status === "active")
        .length,
    [listingsQuery.data],
  );
  const totalInquiries = useMemo(
    () =>
      (listingsQuery.data ?? []).reduce(
        (count, listing) => count + listing.inquiryCount,
        0,
      ),
    [listingsQuery.data],
  );
  const unreadThreads = useMemo(
    () =>
      (threadsQuery.data ?? []).reduce(
        (count, thread) => count + thread.unreadCount,
        0,
      ),
    [threadsQuery.data],
  );

  const renderItem = useCallback(
    ({ item }: { item: MyListing }) => (
      <DashboardListingRow
        item={item}
        onPress={(id) => router.push(listingEditRoute(id))}
      />
    ),
    [],
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F7F4EE]" edges={["top"]}>
      <ScreenHeader
        subtitle="Track listings, inquiries, and optional boosts in one place."
        title="Dashboard"
        action={
          <Pressable
            className="flex-row items-center gap-1.5 rounded-full bg-[#111827] px-3.5 py-2.5"
            onPress={() => router.push(createListingRoute())}
          >
            <Ionicons color="#ffffff" name="add" size={18} />
            <Text className="text-[13px] font-bold text-white">New</Text>
          </Pressable>
        }
      />

      <FlashList
        contentContainerStyle={{ paddingBottom: 108, paddingHorizontal: 18 }}
        data={recentListings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View className="h-px bg-[#ECE4DA]" />}
        ListHeaderComponent={
          <>
            <View className="mb-4 rounded-[28px] bg-[#FFFDFC] p-[18px]">
              <Text className="text-[24px] font-extrabold tracking-[-0.6px] text-[#111827]">
                Unlimited free listings
              </Text>
              <Text className="mt-1.5 text-[14px] leading-5 text-[#6F685E]">
                {profileQuery.data?.propertyTypes?.length
                  ? `Managing ${profileQuery.data.propertyTypes.join(", ")} with optional boosts when you want more reach.`
                  : "Set your property types in profile to tailor the lister experience."}
              </Text>
            </View>

            <View className="mb-4 flex-row gap-2.5">
              <StatBlock label="Active" value={String(activeListings)} />
              <StatBlock label="Inquiries" value={String(totalInquiries)} />
              <StatBlock label="Unread" value={String(unreadThreads)} />
            </View>

            <View className="mb-5 flex-row gap-3">
              <Pressable
                className="flex-1 rounded-[24px] bg-[#FFFDFC] p-4"
                onPress={() => router.push(listerListingsTabRoute())}
              >
                <Ionicons color="#111827" name="business-outline" size={18} />
                <Text className="mt-2.5 text-[16px] font-bold text-[#111827]">
                  Listings
                </Text>
                <Text className="mt-1.5 text-[13px] leading-[19px] text-[#7B7468]">
                  Edit pricing, status, and photos.
                </Text>
              </Pressable>

              <Pressable
                className="flex-1 rounded-[24px] bg-[#FFFDFC] p-4"
                onPress={() => router.push(listerInboxTabRoute())}
              >
                <Ionicons
                  color="#111827"
                  name="chatbubble-ellipses-outline"
                  size={18}
                />
                <Text className="mt-2.5 text-[16px] font-bold text-[#111827]">
                  Inbox
                </Text>
                <Text className="mt-1.5 text-[13px] leading-[19px] text-[#7B7468]">
                  Reply to finder inquiries quickly.
                </Text>
              </Pressable>
            </View>

            <View className="mb-2.5 flex-row items-center justify-between">
              <Text className="text-[18px] font-extrabold text-[#111827]">
                Recent listings
              </Text>
              <Pressable onPress={() => router.push(listerListingsTabRoute())}>
                <Text className="text-[13px] font-bold text-[#0B4A30]">
                  See all
                </Text>
              </Pressable>
            </View>
          </>
        }
        ListEmptyComponent={
          <View className="mt-2.5 items-center rounded-[28px] bg-[#FFFDFC] px-7 py-9">
            <Text className="text-[18px] font-extrabold text-[#111827]">
              No listings yet
            </Text>
            <Text className="mt-2 text-center text-[14px] leading-[22px] text-[#706A5F]">
              Create your first listing to start receiving inquiries from finders.
            </Text>
            <Pressable
              className="mt-[18px] rounded-full bg-[#111827] px-[22px] py-[13px]"
              onPress={() => router.push(createListingRoute())}
            >
              <Text className="text-[14px] font-bold text-white">
                Create listing
              </Text>
            </Pressable>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
