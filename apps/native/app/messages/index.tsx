import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useAuth } from "@/providers/auth-provider";
import type { MessageThreadListItem } from "@/types/platform";
import { trpc } from "@/utils/api-client";

const statusFilters = ["all", "pending", "responded", "closed"] as const;
type StatusFilter = (typeof statusFilters)[number];

function formatInquiryStatus(status: "closed" | "pending" | "responded") {
  switch (status) {
    case "closed":
      return "Closed";
    case "responded":
      return "Responded";
    default:
      return "Pending";
  }
}

function FilterChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      className="mr-2 rounded-full px-3.5 py-2"
      onPress={onPress}
      style={{ backgroundColor: active ? "#111827" : "#E7E5E4" }}
    >
      <Text
        className="text-[12px] font-bold"
        style={{ color: active ? "#FFFFFF" : "#334155" }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function MessagesIndexScreen() {
  const { role } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const threadsQuery = useQuery(trpc.messages.getThreads.queryOptions());
  const threads = threadsQuery.data ?? [];
  const filteredThreads = useMemo(() => {
    if (role !== "lister" || statusFilter === "all") {
      return threads;
    }

    return threads.filter((thread) => thread.inquiryStatus === statusFilter);
  }, [role, statusFilter, threads]);
  const listerCounts = useMemo(
    () => ({
      all: threads.length,
      closed: threads.filter((thread) => thread.inquiryStatus === "closed").length,
      pending: threads.filter((thread) => thread.inquiryStatus === "pending").length,
      responded: threads.filter((thread) => thread.inquiryStatus === "responded").length,
    }),
    [threads],
  );

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
      {role === "lister" ? (
        <>
          <View className="mt-5 rounded-[28px] border border-stone-200 bg-white px-4 py-4">
            <Text className="font-extrabold text-xs uppercase tracking-[1.1px] text-[#0B4A30]">
              Inquiry flow
            </Text>
            <View className="mt-3 flex-row gap-2">
              <View className="flex-1 rounded-[18px] bg-[#F5F0E8] px-3 py-3">
                <Text className="text-[20px] font-black text-slate-900">
                  {listerCounts.pending}
                </Text>
                <Text className="mt-1 text-[12px] text-slate-500">Pending</Text>
              </View>
              <View className="flex-1 rounded-[18px] bg-[#F5F0E8] px-3 py-3">
                <Text className="text-[20px] font-black text-slate-900">
                  {listerCounts.responded}
                </Text>
                <Text className="mt-1 text-[12px] text-slate-500">Responded</Text>
              </View>
              <View className="flex-1 rounded-[18px] bg-[#F5F0E8] px-3 py-3">
                <Text className="text-[20px] font-black text-slate-900">
                  {listerCounts.closed}
                </Text>
                <Text className="mt-1 text-[12px] text-slate-500">Closed</Text>
              </View>
            </View>
          </View>

          <View className="mt-4 flex-row">
            <FilterChip
              active={statusFilter === "all"}
              label={`All (${listerCounts.all})`}
              onPress={() => setStatusFilter("all")}
            />
            <FilterChip
              active={statusFilter === "pending"}
              label={`Pending (${listerCounts.pending})`}
              onPress={() => setStatusFilter("pending")}
            />
            <FilterChip
              active={statusFilter === "responded"}
              label={`Responded (${listerCounts.responded})`}
              onPress={() => setStatusFilter("responded")}
            />
            <FilterChip
              active={statusFilter === "closed"}
              label={`Closed (${listerCounts.closed})`}
              onPress={() => setStatusFilter("closed")}
            />
          </View>
        </>
      ) : null}

      <FlashList
        className="mt-5"
        data={filteredThreads}
        keyExtractor={(item) => item.threadId}
        renderItem={({ item }: { item: MessageThreadListItem }) => (
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
                {role === "lister" ? (
                  <View className="mt-3 self-start rounded-full bg-[#EEF5F1] px-3 py-1.5">
                    <Text className="text-[11px] font-bold uppercase tracking-[0.6px] text-[#0B4A30]">
                      {formatInquiryStatus(item.inquiryStatus)}
                    </Text>
                  </View>
                ) : null}
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
              {role === "lister" && statusFilter !== "all"
                ? "No threads in this status"
                : "No active chats yet"}
            </Text>
            <Text className="mt-3 text-slate-500 text-sm leading-6">
              {role === "lister" && statusFilter !== "all"
                ? "Try another filter or wait for the next inquiry update."
                : "Start from a listing card or a social post once you want to talk directly with someone."}
            </Text>
          </View>
        }
      />
    </View>
  );
}
