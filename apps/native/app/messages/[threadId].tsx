import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { useAuth } from "@/providers/auth-provider";
import { uploadPickedAsset } from "@/services/storage";
import { supabase } from "@/utils/supabase";
import { trpc } from "@/utils/api-client";

export default function ThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(
    null,
  );
  const threadQuery = useQuery(
    trpc.messages.getMessages.queryOptions({
      threadId,
    }),
  );
  const markRead = useMutation(trpc.messages.markRead.mutationOptions());
  const sendMessage = useMutation(
    trpc.messages.send.mutationOptions({
      onSuccess: () => {
        setBody("");
        setAttachmentPreview(null);
        queryClient.invalidateQueries();
      },
    }),
  );
  const blockUser = useMutation(trpc.messages.blockUser.mutationOptions());

  useEffect(() => {
    if (!threadId) {
      return;
    }

    markRead.mutate({ threadId });
    const channel = supabase
      .channel(`messages:${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          queryClient.invalidateQueries();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [markRead, queryClient, threadId]);

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      selectionLimit: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const uploadedUrl = await uploadPickedAsset("message-media", asset);
      setAttachmentPreview(uploadedUrl);
    }
  };

  const handleSend = () => {
    if (!threadQuery.data?.otherUser || !threadQuery.data.listing) {
      return;
    }

    sendMessage.mutate({
      body,
      listingId: threadQuery.data.listing.id,
      mediaUrl: attachmentPreview ?? undefined,
      receiverId: threadQuery.data.otherUser.id,
    });
  };

  return (
    <View className="flex-1 bg-[#f8fafc] px-4 pt-5">
      <View className="rounded-[28px] border border-stone-200 bg-white px-4 py-4">
        <Text className="font-extrabold text-brand-teal text-xs uppercase tracking-[1.2px]">
          {threadQuery.data?.otherUser?.displayName ?? "Conversation"}
        </Text>
        <Text className="mt-2 font-black text-2xl text-slate-900">
          {threadQuery.data?.listing?.title ?? "Listing chat"}
        </Text>
        <Pressable
          className="mt-3 self-start rounded-full border border-red-200 px-3 py-2"
          onPress={() =>
            threadQuery.data?.otherUser
              ? blockUser.mutate({ userId: threadQuery.data.otherUser.id })
              : undefined
          }
        >
          <Text className="font-extrabold text-[11px] text-red-600 uppercase tracking-[1px]">
            Block user
          </Text>
        </Pressable>
      </View>

      <ScrollView
        className="mt-4 flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {(threadQuery.data?.items ?? []).map((message) => {
          const isOwnMessage = message.senderId === user?.id;

          return (
            <View
              key={message.id}
              className={`mb-3 max-w-[82%] rounded-[24px] px-4 py-3 ${
                isOwnMessage
                  ? "ml-auto bg-brand-orange"
                  : "mr-auto border border-stone-200 bg-white"
              }`}
            >
              <Text
                className={`text-sm leading-6 ${isOwnMessage ? "text-white" : "text-slate-700"}`}
              >
                {message.body || "Attachment"}
              </Text>
              {message.mediaUrl ? (
                <Image
                  contentFit="cover"
                  source={message.mediaUrl}
                  style={{
                    height: 180,
                    width: 220,
                    borderRadius: 18,
                    marginTop: 10,
                  }}
                />
              ) : null}
              <Text
                className={`mt-2 text-[11px] ${isOwnMessage ? "text-orange-100" : "text-slate-400"}`}
              >
                {new Date(message.createdAt).toLocaleTimeString()}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View className="pb-6">
        {attachmentPreview ? (
          <Image
            contentFit="cover"
            source={attachmentPreview}
            style={{
              height: 112,
              width: 112,
              borderRadius: 24,
              marginBottom: 12,
            }}
          />
        ) : null}
        <TextInput
          className="rounded-[24px] border border-stone-200 bg-white px-4 py-4 text-slate-900 text-sm"
          multiline
          onChangeText={setBody}
          placeholder="Type a message..."
          placeholderTextColor="#94a3b8"
          value={body}
        />
        <View className="mt-3 flex-row gap-3">
          <Pressable
            className="rounded-full border border-stone-300 px-4 py-4"
            onPress={handlePickPhoto}
          >
            <Text className="font-extrabold text-slate-700 text-xs uppercase tracking-[1px]">
              Photo
            </Text>
          </Pressable>
          <Pressable
            className="flex-1 rounded-full bg-brand-orange px-4 py-4"
            onPress={handleSend}
          >
            <Text className="text-center font-extrabold text-white text-xs uppercase tracking-[1px]">
              {sendMessage.isPending ? "Sending..." : "Send"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
