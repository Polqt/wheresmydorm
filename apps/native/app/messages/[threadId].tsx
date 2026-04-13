import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/providers/auth-provider";
import { uploadPickedAsset } from "@/services/storage";
import { supabase } from "@/utils/supabase";
import { trpc } from "@/utils/api-client";

function statusTone(status: "closed" | "pending" | "responded") {
  switch (status) {
    case "closed":
      return {
        bg: "#F5EDE5",
        label: "Closed",
        text: "#8A4B1F",
      };
    case "responded":
      return {
        bg: "#E8F3EE",
        label: "Responded",
        text: "#0B4A30",
      };
    default:
      return {
        bg: "#FFF4E5",
        label: "Pending",
        text: "#B45309",
      };
  }
}

export default function ThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const { role, user } = useAuth();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(
    null,
  );
  const [feedback, setFeedback] = useState<{
    tone: "error" | "success";
    message: string;
  } | null>(null);
  const threadQuery = useQuery(
    trpc.messages.getMessages.queryOptions({
      threadId,
    }),
  );
  const markRead = useMutation(trpc.messages.markRead.mutationOptions());
  const sendMessage = useMutation(
    trpc.messages.send.mutationOptions({
      onError: (error) => {
        setFeedback({
          tone: "error",
          message: error.message || "Message could not be sent.",
        });
      },
      onSuccess: async () => {
        setBody("");
        setAttachmentPreview(null);
        setFeedback(null);
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["trpc", "messages", "getMessages"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["trpc", "messages", "getThreads"],
          }),
        ]);
      },
    }),
  );
  const blockUser = useMutation(
    trpc.messages.blockUser.mutationOptions({
      onError: (error) => {
        setFeedback({
          tone: "error",
          message: error.message || "User block failed.",
        });
      },
      onSuccess: () => {
        setFeedback({
          tone: "success",
          message: "User blocked.",
        });
      },
    }),
  );
  const reportConversation = useMutation(
    trpc.messages.reportConversation.mutationOptions({
      onError: (error) => {
        setFeedback({
          tone: "error",
          message: error.message || "Conversation report failed.",
        });
      },
      onSuccess: () => {
        setFeedback({
          tone: "success",
          message: "Conversation reported for admin review.",
        });
      },
    }),
  );
  const setInquiryStatus = useMutation(
    trpc.messages.setInquiryStatus.mutationOptions({
      onError: (error) => {
        setFeedback({
          tone: "error",
          message: error.message || "Inquiry status update failed.",
        });
      },
      onSuccess: async (_, variables) => {
        setFeedback({
          tone: "success",
          message: `Inquiry marked ${variables.status}.`,
        });
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["trpc", "messages", "getMessages"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["trpc", "messages", "getThreads"],
          }),
        ]);
      },
    }),
  );

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

  const currentStatus =
    role === "lister" && threadQuery.data?.inquiryStatus
      ? statusTone(threadQuery.data.inquiryStatus)
      : null;

  return (
    <View className="flex-1 bg-[#f8fafc] px-4 pt-5">
      <View className="rounded-[28px] border border-stone-200 bg-white px-4 py-4">
        <Text className="font-extrabold text-brand-teal text-xs uppercase tracking-[1.2px]">
          {threadQuery.data?.otherUser?.displayName ?? "Conversation"}
        </Text>
        <Text className="mt-2 font-black text-2xl text-slate-900">
          {threadQuery.data?.listing?.title ?? "Listing chat"}
        </Text>
        {currentStatus ? (
          <View
            className="mt-3 self-start rounded-full px-3 py-1.5"
            style={{ backgroundColor: currentStatus.bg }}
          >
            <Text
              className="text-[11px] font-extrabold uppercase tracking-[0.8px]"
              style={{ color: currentStatus.text }}
            >
              Inquiry {currentStatus.label}
            </Text>
          </View>
        ) : null}
        {role === "lister" && threadQuery.data?.threadId ? (
          <View className="mt-3 flex-row flex-wrap gap-2">
            {(["pending", "responded", "closed"] as const).map((status) => {
              const tone = statusTone(status);
              const active = threadQuery.data?.inquiryStatus === status;

              return (
                <Pressable
                  key={status}
                  className="rounded-full px-3 py-2"
                  disabled={active || setInquiryStatus.isPending}
                  onPress={() =>
                    setInquiryStatus.mutate({
                      status,
                      threadId: threadQuery.data!.threadId,
                    })
                  }
                  style={{
                    backgroundColor: active ? tone.bg : "#E5E7EB",
                  }}
                >
                  <Text
                    className="text-[11px] font-extrabold uppercase tracking-[0.7px]"
                    style={{ color: active ? tone.text : "#475569" }}
                  >
                    {tone.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        <View className="mt-3 flex-row flex-wrap gap-2">
          <Pressable
            className="self-start rounded-full border border-red-200 px-3 py-2"
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
          <Pressable
            className="self-start rounded-full border border-amber-200 px-3 py-2"
            disabled={!threadQuery.data?.threadId || reportConversation.isPending}
            onPress={() =>
              threadQuery.data?.threadId
                ? Alert.alert(
                    "Report conversation",
                    "Flag this thread for admin review?",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Report",
                        style: "destructive",
                        onPress: () =>
                          reportConversation.mutate({
                            reason: "other",
                            threadId: threadQuery.data.threadId,
                          }),
                      },
                    ],
                  )
                : undefined
            }
          >
            <Text className="font-extrabold text-[11px] text-amber-700 uppercase tracking-[1px]">
              Report thread
            </Text>
          </Pressable>
        </View>
        {feedback ? (
          <View
            className={`mt-3 rounded-[18px] px-3 py-2.5 ${
              feedback.tone === "success" ? "bg-[#ECFDF3]" : "bg-[#FEF2F2]"
            }`}
          >
            <Text
              className={`text-[12px] font-bold ${
                feedback.tone === "success" ? "text-[#166534]" : "text-[#B91C1C]"
              }`}
            >
              {feedback.message}
            </Text>
          </View>
        ) : null}
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
