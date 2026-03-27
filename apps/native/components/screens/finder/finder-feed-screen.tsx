import Ionicons from "@expo/vector-icons/Ionicons";
import { FlashList } from "@shopify/flash-list";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FeedPostCard } from "@/components/feed/post-card";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useFeed } from "@/hooks/use-feed";
import type { FeedItem } from "@/types/posts";

function FeedSeparator() {
  return <View className="h-px bg-[#EEE6DB]" />;
}

export function FinderFeedScreen() {
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

  return (
    <SafeAreaView className="flex-1 bg-[#F7F4EE]" edges={["top"]}>
      <ScreenHeader
        subtitle="Stories, room updates, and local signals from your community."
        title="Feed"
        action={
          <Pressable
            className="flex-row items-center gap-1.5 rounded-full bg-[#111827] px-3.5 py-2.5"
            onPress={() => onCreatePost()}
          >
            <Ionicons color="#ffffff" name="add" size={16} />
            <Text className="text-[13px] font-bold text-white">Write</Text>
          </Pressable>
        }
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0B2D23" size="large" />
        </View>
      ) : (
        <FlashList
          contentContainerStyle={{
            paddingBottom: 96,
            paddingHorizontal: 18,
            paddingTop: 6,
            flexGrow: items.length === 0 ? 1 : undefined,
            justifyContent: items.length === 0 ? "center" : undefined,
          }}
          data={items}
          ItemSeparatorComponent={FeedSeparator}
          keyExtractor={(item: FeedItem) => item.id}
          ListEmptyComponent={
            <View className="items-center px-8">
              <Text className="text-[18px] font-extrabold text-[#1A1A1A]">
                Nothing in your feed yet
              </Text>
              <Text className="mt-2 text-center text-[14px] leading-[22px] text-[#706A5F]">
                Follow other users or create a post to get things going.
              </Text>
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
