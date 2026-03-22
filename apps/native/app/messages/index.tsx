import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { trpc } from "@/utils/trpc";

export default function MessagesIndexScreen() {
  const threadsQuery = useQuery(trpc.messages.getThreads.queryOptions());

  return (
    <View className="flex-1 bg-[#f8fafc] px-4 pt-5">
      <Text className="font-extrabold text-brand-teal text-xs uppercase tracking-[1.6px]">
        Messages
      </Text>
      <Text className="mt-2 font-black text-3xl text-slate-900">
        Direct message inbox
      </Text>
      <Text className="mt-3 text-slate-500 text-sm leading-6">
        Threads are grouped by listing and sorted by the most recent message
        timestamp.
      </Text>

      <FlashList
        className="mt-5"
        data={threadsQuery.data ?? []}
        keyExtractor={(item) => item.threadId}
        renderItem={({ item }) => (
          <Pressable
            className="mb-3 rounded-[28px] border border-stone-200 bg-white px-4 py-4"
            onPress={() => router.push(`/messages/${item.threadId}`)}
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="font-extrabold text-brand-teal text-xs uppercase tracking-[1.2px]">
                  {item.otherUser.displayName}
                </Text>
                <Text className="mt-2 font-bold text-base text-slate-900">
                  {item.listing.title}
                </Text>
                <Text className="mt-2 text-slate-600 text-sm">
                  {item.lastMessage.body || "Photo attachment"}
                </Text>
              </View>
              {item.unreadCount > 0 ? (
                <View className="ml-4 rounded-full bg-brand-orange px-3 py-2">
                  <Text className="font-black text-white text-xs">
                    {item.unreadCount}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text className="mt-3 font-medium text-[11px] text-slate-400">
              {new Date(item.lastMessage.createdAt).toLocaleString()}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="mt-20 rounded-[28px] border border-stone-300 border-dashed bg-white px-6 py-8">
            <Text className="font-bold text-slate-900 text-xl">
              No active chats yet
            </Text>
            <Text className="mt-3 text-slate-500 text-sm leading-6">
              Start from a listing card or a social post once you want to talk
              directly with someone.
            </Text>
          </View>
        }
      />
    </View>
  );
}
