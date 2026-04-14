import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { router } from "expo-router";
import { useCallback } from "react";
import { Share } from "react-native";

import { usePostRealtime } from "@/hooks/use-post-realtime";
import { refreshPostQueries } from "@/lib/post-query";
import { useAuth } from "@/providers/auth-provider";
import { buildPostShareMessage } from "@/services/posts";
import type { FeedItem, PostReaction } from "@/types/posts";
import { postCreateRoute, postDetailRoute } from "@/utils/routes";
import { trpc } from "@/utils/api-client";

export function useFeed() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  usePostRealtime({ enabled: Boolean(user) });

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
        await refreshPostQueries(queryClient);
      },
    }),
  );

  const followMutation = useMutation(
    trpc.profiles.toggleFollow.mutationOptions({
      onSuccess: async () => {
        await refreshPostQueries(queryClient);
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

  const handleCreatePost = useCallback((listingId?: string) => {
    router.push(postCreateRoute(listingId));
  }, []);

  const handleShare = useCallback(async (item: FeedItem) => {
    await Share.share({
      message: buildPostShareMessage({
        authorName: item.author.displayName,
        body: item.body,
        listingTitle: item.listing?.title,
      }),
      title: "Share post",
    });
  }, []);

  const onEndReached = useCallback(() => {
    if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
      void feedQuery.fetchNextPage();
    }
  }, [feedQuery]);

  return {
    items,
    isError: feedQuery.isError,
    isFetchingNextPage: feedQuery.isFetchingNextPage,
    isLoading: feedQuery.isLoading,
    onCreatePost: handleCreatePost,
    onEndReached,
    onFollow: handleFollow,
    onPressPost: handlePostPress,
    onReact: handleReact,
    onRefetch: () => feedQuery.refetch(),
    onShare: handleShare,
  };
}
