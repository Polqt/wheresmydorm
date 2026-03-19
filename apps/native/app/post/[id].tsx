import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { PostCard } from "@/components/feed/PostCard";
import { supabase } from "@/utils/supabase";
import { trpc } from "@/utils/trpc";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [commentBody, setCommentBody] = useState("");
  const postQuery = useQuery(
    trpc.posts.getById.queryOptions({
      postId: id,
    }),
  );
  const commentsQuery = useQuery(
    trpc.posts.getComments.queryOptions({
      postId: id,
    }),
  );
  const commentMutation = useMutation(
    trpc.posts.comment.mutationOptions({
      onSuccess: () => {
        setCommentBody("");
        queryClient.invalidateQueries();
      },
    }),
  );

  useEffect(() => {
    const channel = supabase
      .channel(`post-comments:${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          filter: `post_id=eq.${id}`,
          schema: "public",
          table: "post_comments",
        },
        () => {
          queryClient.invalidateQueries();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  return (
    <ScrollView
      className="flex-1 bg-[#f8fafc]"
      contentContainerStyle={{ padding: 16 }}
    >
      {postQuery.data ? <PostCard post={postQuery.data} /> : null}

      <View className="rounded-[28px] border border-stone-200 bg-white px-4 py-4">
        <Text className="font-extrabold text-brand-teal text-xs uppercase tracking-[1.2px]">
          Threaded comments
        </Text>
        <TextInput
          className="mt-4 rounded-[22px] bg-stone-100 px-4 py-4 text-slate-900 text-sm"
          multiline
          onChangeText={setCommentBody}
          placeholder="Add a comment or reply..."
          placeholderTextColor="#94a3b8"
          textAlignVertical="top"
          value={commentBody}
        />
        <Pressable
          className="mt-4 rounded-full bg-brand-orange px-4 py-4"
          onPress={() =>
            commentMutation.mutate({
              body: commentBody,
              postId: id,
            })
          }
        >
          <Text className="text-center font-extrabold text-white text-xs uppercase tracking-[1.2px]">
            {commentMutation.isPending ? "Posting..." : "Post comment"}
          </Text>
        </Pressable>
      </View>

      <View className="mt-4 gap-3">
        {(commentsQuery.data ?? []).map((comment) => (
          <View
            key={comment.id}
            className={`rounded-[24px] bg-white px-4 py-4 ${
              comment.parentCommentId
                ? "ml-8 border-orange-200 border-l-4"
                : "border border-stone-200"
            }`}
          >
            <View className="flex-row items-center justify-between">
              <Text className="font-extrabold text-brand-teal text-xs uppercase tracking-[1px]">
                {comment.author.displayName}
              </Text>
              <Text className="font-medium text-[11px] text-slate-400">
                {new Date(comment.createdAt).toLocaleString()}
              </Text>
            </View>
            <Text className="mt-3 text-slate-700 text-sm leading-6">
              {comment.body}
            </Text>
            {comment.author.avatarUrl ? (
              <Image
                contentFit="cover"
                source={comment.author.avatarUrl}
                style={{
                  height: 32,
                  width: 32,
                  borderRadius: 999,
                  marginTop: 12,
                }}
              />
            ) : null}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
