import FontAwesome from "@expo/vector-icons/FontAwesome";
import { FlashList } from "@shopify/flash-list";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { NotificationListItem } from "@/types/platform";
import { trpc } from "@/utils/api-client";
import {
  listingDetailRoute,
  messageThreadRoute,
  paymentsRoute,
  postDetailRoute,
  reviewsRoute,
} from "@/utils/routes";

function formatNotificationTime(value: string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.max(Math.round(diff / 60_000), 0);

  if (minutes < 1) return "Now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getNotificationIcon(type: NotificationListItem["type"]) {
  switch (type) {
    case "new_message":
      return "comment";
    case "new_review":
    case "review_response":
      return "star";
    case "payment_confirmed":
      return "check-circle";
    case "price_drop":
      return "tag";
    case "new_listing_nearby":
    case "listing_update":
      return "home";
    default:
      return "bell";
  }
}

function getNotificationRoute(item: NotificationListItem) {
  if (!item.referenceId || !item.referenceType) {
    return null;
  }

  switch (item.referenceType) {
    case "listing":
      return listingDetailRoute(item.referenceId);
    case "payment":
      return paymentsRoute();
    case "post":
      return postDetailRoute(item.referenceId);
    case "review":
      return reviewsRoute();
    case "thread":
      return messageThreadRoute(item.referenceId);
    default:
      return null;
  }
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery(
    trpc.notifications.list.queryOptions({ limit: 50 }),
  );
  const unreadCountQuery = useQuery(trpc.notifications.unreadCount.queryOptions());

  const markRead = useMutation(
    trpc.notifications.markRead.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["trpc", "notifications", "list"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["trpc", "notifications", "unreadCount"],
          }),
        ]);
      },
    }),
  );

  const markAllRead = useMutation(
    trpc.notifications.markAllRead.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["trpc", "notifications", "list"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["trpc", "notifications", "unreadCount"],
          }),
        ]);
      },
    }),
  );

  const items = notificationsQuery.data?.items ?? [];
  const unreadCount = unreadCountQuery.data?.count ?? 0;

  return (
    <View className="flex-1 bg-[#f7f4ee]" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center border-b border-[#E7E0D5] bg-[#fffdf9] px-4 py-3.5">
        <Pressable
          className="h-9 w-9 items-center justify-center rounded-full bg-[#F0EBE3]"
          onPress={() => router.back()}
        >
          <FontAwesome color="#0f172a" name="arrow-left" size={16} />
        </Pressable>
        <Text className="flex-1 text-center text-base font-extrabold text-slate-900">
          Notifications
        </Text>
        <Pressable
          className="min-w-[58px] items-end"
          disabled={unreadCount === 0 || markAllRead.isPending}
          onPress={() => markAllRead.mutate()}
        >
          <Text className="text-[12px] font-bold text-[#0B4A30]">Read all</Text>
        </Pressable>
      </View>

      {/* Summary */}
      <View className="mx-4 mt-3.5 rounded-3xl bg-[#fffdf9] px-4 py-4">
        <Text className="text-xl font-extrabold text-slate-900">
          {unreadCount} unread
        </Text>
        <Text className="mt-1 text-[13px] leading-5 text-[#706A5F]">
          Updates for messages, reviews, and payments land here.
        </Text>
      </View>

      {/* Error state */}
      {notificationsQuery.isError ? (
        <View className="mx-4 mt-3 rounded-2xl bg-red-50 px-4 py-3">
          <Text className="text-[13px] font-semibold text-red-700">
            Failed to load notifications.
          </Text>
          <Pressable
            className="mt-2 self-start"
            onPress={() => notificationsQuery.refetch()}
          >
            <Text className="text-[13px] font-bold text-red-700 underline">
              Retry
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* List */}
      <FlashList
        contentContainerStyle={{ paddingBottom: 24 }}
        data={items}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          notificationsQuery.isLoading ? null : (
            <Text className="py-7 text-center text-[13px] font-semibold text-[#9E9890]">
              No notifications yet
            </Text>
          )
        }
        renderItem={({ item }) => {
          const unread = !item.isRead;
          const route = getNotificationRoute(item);

          return (
            <Pressable
              className={`flex-row items-start gap-3 border-b border-[#EDE8DF] px-4 py-3.5 ${
                unread ? "bg-[#F5F0E8]" : "bg-[#fffdf9]"
              }`}
              onPress={async () => {
                if (unread) {
                  await markRead.mutateAsync({ notificationId: item.id });
                }
                if (route) {
                  router.push(route);
                }
              }}
            >
              <View
                className={`mt-0.5 h-10 w-10 items-center justify-center rounded-2xl ${
                  unread ? "bg-[#D8EDE3]" : "bg-[#EDE8DF]"
                }`}
              >
                <FontAwesome
                  color={unread ? "#0B2D23" : "#706A5F"}
                  name={getNotificationIcon(item.type)}
                  size={16}
                />
              </View>
              <View className="flex-1 gap-1">
                <View className="flex-row items-center justify-between gap-2">
                  <Text
                    className={`flex-1 text-[14px] font-bold ${
                      unread ? "text-slate-900" : "text-slate-500"
                    }`}
                  >
                    {item.title}
                  </Text>
                  <Text className="text-[11px] font-semibold text-[#9E9890]">
                    {formatNotificationTime(String(item.createdAt))}
                  </Text>
                </View>
                <Text className="text-[13px] leading-5 text-[#706A5F]">
                  {item.body}
                </Text>
              </View>
              {unread ? (
                <View className="mt-1.5 h-2 w-2 rounded-full bg-brand-orange" />
              ) : null}
            </Pressable>
          );
        }}
      />
    </View>
  );
}
