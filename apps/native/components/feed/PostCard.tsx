import { haptics } from "@/services/haptics";
import { FeedPost } from "@/types/api";
import { trpc } from "@/utils/trpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";


const reactionEmoji = {
  funny: "😂",
  helpful: "👏",
  like: "❤️",
} as const;

export function PostCard({ post }: { post: FeedPost }) {
  const queryClient = useQueryClient();
  const reactMutation = useMutation(
    trpc.posts.react.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
    }),
  );
  const followMutation = useMutation(
    trpc.profiles.toggleFollow.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
    }),
  );

  const handleReaction = (reaction: keyof typeof reactionEmoji) => {
    haptics.light();
    reactMutation.mutate({
      postId: post.id,
      reaction,
    });
  };

  const handleShare = async () => {
    await sharePost(post);
  };

  return (
    <Pressable
      className="mb-4 rounded-[28px] border border-stone-200 bg-white px-4 py-4"
      onPress={() => router.push(`/post/${post.id}`)}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="font-bold text-brand-teal text-xs uppercase tracking-[1.2px]">
            {post.author.displayName}
          </Text>
          <Text className="mt-2 font-semibold text-base text-slate-900">
            {post.body}
          </Text>
          {post.listing ? (
            <Text className="mt-2 font-semibold text-orange-700 text-xs uppercase tracking-[1px]">
              Tagged listing: {post.listing.title}
            </Text>
          ) : null}
        </View>
        {post.author.isCurrentUser ? null : post.author.isFollowing ? (
          <Text className="ml-3 rounded-full bg-teal-50 px-3 py-2 font-bold text-[11px] text-brand-teal uppercase tracking-[1px]">
            Following
          </Text>
        ) : (
          <Pressable
            className="ml-3 rounded-full border border-stone-200 px-3 py-2"
            onPress={() => followMutation.mutate({ userId: post.author.id })}
          >
            <Text className="font-bold text-[11px] text-slate-700 uppercase tracking-[1px]">
              Follow
            </Text>
          </Pressable>
        )}
      </View>

      {post.mediaUrls[0] ? (
        <Image
          contentFit="cover"
          source={post.mediaUrls[0]}
          style={{
            height: 224,
            width: "100%",
            marginTop: 16,
            borderRadius: 22,
          }}
        />
      ) : null}

      {post.hashtags.length ? (
        <View className="mt-4 flex-row flex-wrap gap-2">
          {post.hashtags.map((hashtag) => (
            <Text
              key={hashtag}
              className="rounded-full bg-orange-50 px-3 py-1 font-semibold text-orange-700 text-xs"
            >
              #{hashtag}
            </Text>
          ))}
        </View>
      ) : null}

      <View className="mt-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          {(Object.keys(reactionEmoji) as (keyof typeof reactionEmoji)[]).map(
            (reaction) => (
              <Pressable
                key={reaction}
                className={`rounded-full px-3 py-2 ${
                  post.viewerReaction === reaction
                    ? "bg-slate-900"
                    : "bg-stone-100"
                }`}
                onPress={() => handleReaction(reaction)}
              >
                <Text
                  className={`font-bold text-xs ${
                    post.viewerReaction === reaction
                      ? "text-white"
                      : "text-slate-700"
                  }`}
                >
                  {reactionEmoji[reaction]} {post.reactionSummary[reaction]}
                </Text>
              </Pressable>
            ),
          )}
        </View>

        <View className="flex-row items-center gap-3">
          <Text className="font-semibold text-slate-500 text-xs">
            {post.commentCount} comments
          </Text>
          <Pressable onPress={handleShare}>
            <Text className="font-bold text-brand-orange text-xs uppercase tracking-[1px]">
              Share
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
