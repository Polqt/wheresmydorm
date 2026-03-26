import Ionicons from "@expo/vector-icons/Ionicons";
import { FlashList } from "@shopify/flash-list";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import { memo, useCallback, useMemo } from "react";
import type { GestureResponderEvent } from "react-native";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useAuth } from "@/providers/auth-provider";
import type { FeedItem, PostReaction } from "@/types/posts";
import { formatMemberSince, getInitials } from "@/utils/profile";
import { postCreateRoute, postDetailRoute } from "@/utils/routes";
import { trpc } from "@/utils/trpc";

function FeedSeparator() {
  return <View style={styles.separator} />;
}

const PostRow = memo(function PostRow({
  item,
  onFollow,
  onReact,
  onPress,
}: {
  item: FeedItem;
  onFollow: (userId: string) => void;
  onReact: (postId: string, reaction: PostReaction) => void;
  onPress: (postId: string) => void;
}) {
  const nameParts = item.author.displayName.split(" ");
  const initials = getInitials(nameParts[0], nameParts[1]);

  const handleReact = useCallback(
    () => onReact(item.id, "like"),
    [item.id, onReact],
  );
  const handlePress = useCallback(() => onPress(item.id), [item.id, onPress]);
  const handleFollow = useCallback(
    () => onFollow(item.author.id),
    [item.author.id, onFollow],
  );

  return (
    <Pressable onPress={handlePress} style={styles.post}>
      <View style={styles.authorRow}>
        <ProfileAvatar
          avatarUrl={item.author.avatarUrl}
          initials={initials}
          size={40}
        />
        <View style={styles.authorMeta}>
          <Text style={styles.authorName}>{item.author.displayName}</Text>
          <Text style={styles.timestamp}>
            {formatMemberSince(String(item.createdAt))}
          </Text>
        </View>
        {item.author.isCurrentUser ? null : (
          <Pressable
            onPress={(event: GestureResponderEvent) => {
              event.stopPropagation();
              handleFollow();
            }}
            style={styles.followButton}
          >
            <Text
              style={[
                styles.followText,
                item.author.isFollowing ? styles.followTextActive : null,
              ]}
            >
              {item.author.isFollowing ? "Following" : "Follow"}
            </Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.body}>{item.body}</Text>

      {item.mediaUrls.length > 0 ? (
        <View style={styles.mediaRow}>
          {item.mediaUrls.slice(0, 3).map((url) => (
            <Image
              key={url}
              contentFit="cover"
              source={{ uri: url }}
              style={styles.mediaThumb}
            />
          ))}
        </View>
      ) : null}

      {item.listing ? (
        <View style={styles.contextRow}>
          <Ionicons color="#0B2D23" name="home-outline" size={12} />
          <Text numberOfLines={1} style={styles.contextText}>
            {item.listing.title}
          </Text>
        </View>
      ) : null}

      {item.hashtags.length > 0 ? (
        <View style={styles.hashtagRow}>
          {item.hashtags.slice(0, 4).map((tag) => (
            <Text key={tag} style={styles.hashtag}>
              #{tag}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          hitSlop={8}
          onPress={(event: GestureResponderEvent) => {
            event.stopPropagation();
            handleReact();
          }}
          style={styles.actionButton}
        >
          <Ionicons
            color={item.viewerReaction === "like" ? "#D14B3F" : "#8C8478"}
            name={item.viewerReaction === "like" ? "heart" : "heart-outline"}
            size={18}
          />
          <Text style={styles.actionText}>{item.reactionSummary.like}</Text>
        </Pressable>
        <Pressable hitSlop={8} onPress={handlePress} style={styles.actionButton}>
          <Ionicons color="#8C8478" name="chatbubble-outline" size={17} />
          <Text style={styles.actionText}>{item.commentCount}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
});

export default function FeedTabScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const feedQuery = useInfiniteQuery(
    trpc.posts.list.infiniteQueryOptions(
      { limit: 10 },
      {
        enabled: Boolean(user),
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      },
    ),
  );

  const reactMutation = useMutation(
    trpc.posts.react.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["trpc", "posts", "list"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["trpc", "posts", "getById"],
          }),
        ]);
      },
    }),
  );

  const followMutation = useMutation(
    trpc.profiles.toggleFollow.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["trpc", "posts", "list"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["trpc", "posts", "getById"],
          }),
        ]);
      },
    }),
  );

  const items = feedQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const handleReact = useCallback(
    (postId: string, reaction: PostReaction) => {
      reactMutation.mutate({ postId, reaction });
    },
    [reactMutation],
  );

  const handleFollow = useCallback(
    (userId: string) => {
      followMutation.mutate({ userId });
    },
    [followMutation],
  );

  const handlePostPress = useCallback((postId: string) => {
    router.push(postDetailRoute(postId));
  }, []);

  const handleCreatePost = useCallback(() => {
    router.push(postCreateRoute());
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => (
      <PostRow
        item={item}
        onFollow={handleFollow}
        onReact={handleReact}
        onPress={handlePostPress}
      />
    ),
    [handleFollow, handlePostPress, handleReact],
  );

  const keyExtractor = useCallback((item: FeedItem) => item.id, []);

  const onEndReached = useCallback(() => {
    if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
      void feedQuery.fetchNextPage();
    }
  }, [feedQuery]);

  const listFooter = feedQuery.isFetchingNextPage ? (
    <ActivityIndicator color="#0B2D23" style={styles.footer} />
  ) : null;

  const listEmpty = !feedQuery.isLoading ? (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>Nothing in your feed yet</Text>
      <Text style={styles.emptyBody}>
        Follow other users or create a post to get things going.
      </Text>
    </View>
  ) : null;

  const contentContainerStyle = useMemo(
    () => [styles.list, items.length === 0 ? styles.listEmpty : null],
    [items.length],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader
        subtitle="Stories, room updates, and local signals from your community."
        title="Feed"
        action={
          <Pressable onPress={handleCreatePost} style={styles.composeButton}>
            <Ionicons color="#ffffff" name="add" size={16} />
            <Text style={styles.composeText}>Write</Text>
          </Pressable>
        }
      />

      {feedQuery.isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#0B2D23" size="large" />
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={keyExtractor}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          renderItem={renderItem}
          ItemSeparatorComponent={FeedSeparator}
          ListEmptyComponent={listEmpty}
          ListFooterComponent={listFooter}
          contentContainerStyle={contentContainerStyle}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F7F4EE",
    flex: 1,
  },
  composeButton: {
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  composeText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  list: {
    paddingBottom: 96,
    paddingHorizontal: 18,
    paddingTop: 6,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  loading: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  footer: {
    paddingVertical: 20,
  },
  separator: {
    backgroundColor: "#EEE6DB",
    height: 1,
  },
  post: {
    paddingVertical: 18,
  },
  authorRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  authorMeta: {
    flex: 1,
  },
  authorName: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
  },
  timestamp: {
    color: "#9B9387",
    fontSize: 12,
    marginTop: 1,
  },
  followButton: {
    backgroundColor: "#F3EEE6",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  followText: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "700",
  },
  followTextActive: {
    color: "#0B2D23",
  },
  body: {
    color: "#334155",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 12,
  },
  mediaRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  mediaThumb: {
    borderRadius: 18,
    flex: 1,
    height: 112,
  },
  contextRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 12,
  },
  contextText: {
    color: "#0B2D23",
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  hashtagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  hashtag: {
    color: "#4C7A67",
    fontSize: 13,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 18,
    marginTop: 14,
  },
  actionButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  actionText: {
    color: "#6F685E",
    fontSize: 13,
    fontWeight: "600",
  },
  empty: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: "#1A1A1A",
    fontSize: 18,
    fontWeight: "800",
  },
  emptyBody: {
    color: "#706A5F",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
    textAlign: "center",
  },
});
