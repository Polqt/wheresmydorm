import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";

import { usePostRealtime } from "@/hooks/use-post-realtime";
import { refreshPostQueries } from "@/lib/post-query";
import { buildPostShareMessage } from "@/services/posts";
import type { PostComment } from "@/types/posts";
import { trpc } from "@/utils/api-client";

function CommentCard({
  comment,
  onReply,
}: {
  comment: PostComment;
  onReply: (comment: PostComment) => void;
}) {
  return (
    <View
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
      <View className="mt-3 flex-row items-center justify-between">
        {comment.author.avatarUrl ? (
          <Image
            contentFit="cover"
            source={{ uri: comment.author.avatarUrl }}
            style={{
              height: 32,
              width: 32,
              borderRadius: 999,
            }}
          />
        ) : (
          <View />
        )}
        <Pressable onPress={() => onReply(comment)}>
          <Text className="font-bold text-[11px] text-brand-orange uppercase tracking-[1px]">
            Reply
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [commentBody, setCommentBody] = useState("");
  const [replyTarget, setReplyTarget] = useState<PostComment | null>(null);

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

  usePostRealtime({ enabled: Boolean(id), postId: id });

  const commentMutation = useMutation(
    trpc.posts.comment.mutationOptions({
      onSuccess: async () => {
        setCommentBody("");
        setReplyTarget(null);
        await refreshPostQueries(queryClient);
      },
    }),
  );

  const orderedComments = useMemo(() => {
    const comments = commentsQuery.data ?? [];
    const parents = comments.filter((comment) => !comment.parentCommentId);
    const repliesByParent = new Map<string, PostComment[]>();

    for (const comment of comments) {
      if (!comment.parentCommentId) continue;
      const parentReplies = repliesByParent.get(comment.parentCommentId) ?? [];
      parentReplies.push(comment);
      repliesByParent.set(comment.parentCommentId, parentReplies);
    }

    return parents.flatMap((comment) => [
      comment,
      ...(repliesByParent.get(comment.id) ?? []),
    ]);
  }, [commentsQuery.data]);

  return (
    <ScrollView
      className="flex-1 bg-[#f8fafc]"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="font-extrabold text-brand-teal text-xs uppercase tracking-[1.2px]">
          Post thread
        </Text>
        <View className="flex-row items-center gap-4">
          {postQuery.data ? (
            <Pressable
              onPress={() =>
                Share.share({
                  message: buildPostShareMessage({
                    authorName: postQuery.data.author.displayName,
                    body: postQuery.data.body,
                    listingTitle: postQuery.data.listing?.title,
                  }),
                  title: "Share post",
                })
              }
            >
              <Text className="font-bold text-brand-orange text-sm">Share</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={() => router.back()}>
            <Text className="font-bold text-slate-600 text-sm">Back</Text>
          </Pressable>
        </View>
      </View>

      {postQuery.data ? (
        <View className="mb-4 rounded-[28px] border border-stone-200 bg-white px-4 py-4">
          <Text className="font-bold text-[16px] text-slate-900">
            {postQuery.data.body}
          </Text>
          {postQuery.data.listing ? (
            <Text className="mt-3 font-bold text-brand-orange text-xs uppercase tracking-[1px]">
              Linked to {postQuery.data.listing.title}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View className="rounded-[28px] border border-stone-200 bg-white px-4 py-4">
        <Text className="font-extrabold text-brand-teal text-xs uppercase tracking-[1.2px]">
          Threaded comments
        </Text>
        {replyTarget ? (
          <View className="mt-4 rounded-[18px] bg-orange-50 px-4 py-3">
            <Text className="font-bold text-[11px] text-orange-700 uppercase tracking-[1px]">
              Replying to {replyTarget.author.displayName}
            </Text>
            <Text className="mt-1 text-slate-600 text-sm" numberOfLines={2}>
              {replyTarget.body}
            </Text>
            <Pressable
              className="mt-2 self-start"
              onPress={() => setReplyTarget(null)}
            >
              <Text className="font-bold text-[11px] text-slate-500 uppercase tracking-[1px]">
                Cancel reply
              </Text>
            </Pressable>
          </View>
        ) : null}
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
              parentCommentId: replyTarget?.id,
              postId: id,
            })
          }
        >
          <Text className="text-center font-extrabold text-white text-xs uppercase tracking-[1.2px]">
            {commentMutation.isPending
              ? "Posting..."
              : replyTarget
                ? "Post reply"
                : "Post comment"}
          </Text>
        </Pressable>
      </View>

      <View className="mt-4 gap-3">
        {orderedComments.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            onReply={setReplyTarget}
          />
        ))}
      </View>
    </ScrollView>
  );
}
