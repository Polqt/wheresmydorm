import Ionicons from "@expo/vector-icons/Ionicons";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FeedPostCard } from "@/components/feed/post-card";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useFeed } from "@/hooks/use-feed";
import type { FeedItem } from "@/types/posts";
import { listerInboxTabRoute, listerListingsTabRoute } from "@/utils/routes";
import { trpc } from "@/utils/api-client";

function FeedSeparator() {
  return <View className="h-px bg-[#EEE6DB]" />;
}

export function ListerFeedScreen() {
  const {
    items,
    isFetchingNextPage,
    isLoading,
    onCreatePost,
    onEndReached,
    onFollow,
    onPressPost,
    onReact,
    onShare,
  } = useFeed();

  const listingsQuery = useQuery(trpc.listings.myListings.queryOptions());
  const threadsQuery = useQuery(trpc.messages.getThreads.queryOptions());

  const recentListings = (listingsQuery.data ?? []).slice(0, 3);
  const unreadThreads = (threadsQuery.data ?? []).reduce(
    (count, thread) => count + thread.unreadCount,
    0,
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F7F4EE]" edges={["top"]}>
      <ScreenHeader
        subtitle="Post vacancy updates, property news, and stay close to your inquiry flow."
        title="Lister feed"
        action={
          <Pressable
            className="flex-row items-center gap-1.5 rounded-full bg-[#111827] px-3.5 py-2.5"
            onPress={() => onCreatePost()}
          >
            <Ionicons color="#ffffff" name="megaphone-outline" size={16} />
            <Text className="text-[13px] font-bold text-white">Announce</Text>
          </Pressable>
        }
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0B2D23" size="large" />
        </View>
      ) : (
        <FlashList
          contentContainerStyle={{ paddingBottom: 110, paddingHorizontal: 18 }}
          data={items}
          ItemSeparatorComponent={FeedSeparator}
          keyExtractor={(item: FeedItem) => item.id}
          ListHeaderComponent={
            <>
              <View className="mb-5 rounded-[30px] bg-[#FFFDFC] px-5 py-5">
                <Text className="text-[24px] font-extrabold tracking-[-0.7px] text-[#111827]">
                  Announce vacancies with context
                </Text>
                <Text className="mt-2 text-[14px] leading-6 text-[#706A5F]">
                  Link one of your listings when you post availability, price
                  updates, or move-in notes so inquiries stay tied to a place.
                </Text>

                <View className="mt-4 flex-row gap-3">
                  <Pressable
                    className="flex-1 rounded-[22px] bg-[#F4EFE6] px-4 py-4"
                    onPress={() => router.push(listerListingsTabRoute())}
                  >
                    <Text className="text-[13px] font-bold text-[#111827]">
                      {listingsQuery.data?.length ?? 0} listings
                    </Text>
                    <Text className="mt-1 text-[12px] leading-5 text-[#706A5F]">
                      Open listing management
                    </Text>
                  </Pressable>
                  <Pressable
                    className="flex-1 rounded-[22px] bg-[#F4EFE6] px-4 py-4"
                    onPress={() => router.push(listerInboxTabRoute())}
                  >
                    <Text className="text-[13px] font-bold text-[#111827]">
                      {unreadThreads} unread
                    </Text>
                    <Text className="mt-1 text-[12px] leading-5 text-[#706A5F]">
                      Review inquiry inbox
                    </Text>
                  </Pressable>
                </View>

                {recentListings.length > 0 ? (
                  <View className="mt-4">
                    <Text className="text-[12px] font-extrabold uppercase tracking-[1px] text-[#0B4A30]">
                      Quick announce
                    </Text>
                    <View className="mt-3 flex-row flex-wrap gap-2">
                      {recentListings.map((listing) => (
                        <Pressable
                          key={listing.id}
                          className="rounded-full bg-[#EEF5F1] px-3.5 py-2"
                          onPress={() => onCreatePost(listing.id)}
                        >
                          <Text className="text-[12px] font-bold text-[#0B2D23]">
                            {listing.title}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>

              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-[18px] font-extrabold text-[#111827]">
                  Community updates
                </Text>
                <Text className="text-[12px] font-semibold text-[#6F685E]">
                  Latest first
                </Text>
              </View>
            </>
          }
          ListEmptyComponent={
            <View className="items-center rounded-[28px] bg-[#FFFDFC] px-8 py-9">
              <Text className="text-[18px] font-extrabold text-[#1A1A1A]">
                Start with a lister announcement
              </Text>
              <Text className="mt-2 text-center text-[14px] leading-[22px] text-[#706A5F]">
                Post a vacancy update, property reminder, or neighborhood note
                so followers see activity from your listings.
              </Text>
              <Pressable
                className="mt-5 rounded-full bg-[#111827] px-5 py-3"
                onPress={() => onCreatePost(recentListings[0]?.id)}
              >
                <Text className="text-[13px] font-bold text-white">
                  Create announcement
                </Text>
              </Pressable>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color="#0B2D23" style={{ paddingVertical: 20 }} />
            ) : null
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <FeedPostCard
              item={item}
              onFollow={onFollow}
              onPress={onPressPost}
              onReact={onReact}
              onShare={onShare}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
