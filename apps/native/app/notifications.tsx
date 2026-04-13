import FontAwesome from "@expo/vector-icons/FontAwesome";
import { FlashList } from "@shopify/flash-list";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="arrow-left" size={16} color="#0f172a" />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Pressable
          disabled={unreadCount === 0 || markAllRead.isPending}
          onPress={() => markAllRead.mutate()}
          style={styles.headerAction}
        >
          <Text style={styles.headerActionText}>Read all</Text>
        </Pressable>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>{unreadCount} unread</Text>
        <Text style={styles.summaryBody}>
          Updates for messages, reviews, and payments land here.
        </Text>
      </View>

      <FlashList
        contentContainerStyle={styles.list}
        data={items}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.endNote}>No notifications yet</Text>
        }
        renderItem={({ item }) => {
          const unread = !item.isRead;
          const route = getNotificationRoute(item);

          return (
            <Pressable
              onPress={async () => {
                if (unread) {
                  await markRead.mutateAsync({ notificationId: item.id });
                }

                if (route) {
                  router.push(route);
                }
              }}
              style={[styles.item, unread && styles.itemUnread]}
            >
              <View style={[styles.iconBox, unread && styles.iconBoxUnread]}>
                <FontAwesome
                  name={getNotificationIcon(item.type)}
                  size={16}
                  color={unread ? "#0B2D23" : "#706A5F"}
                />
              </View>
              <View style={styles.itemContent}>
                <View style={styles.itemRow}>
                  <Text style={[styles.itemTitle, unread && styles.itemTitleUnread]}>
                    {item.title}
                  </Text>
                  <Text style={styles.itemTime}>
                    {formatNotificationTime(String(item.createdAt))}
                  </Text>
                </View>
                <Text style={styles.itemBody}>{item.body}</Text>
              </View>
              {unread ? <View style={styles.dot} /> : null}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f4ee",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E7E0D5",
    backgroundColor: "#fffdf9",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0EBE3",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  headerAction: {
    minWidth: 58,
    alignItems: "flex-end",
  },
  headerActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0B4A30",
  },
  summary: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    borderRadius: 24,
    backgroundColor: "#fffdf9",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
  },
  summaryBody: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: "#706A5F",
  },
  list: {
    paddingBottom: 24,
  },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EDE8DF",
    backgroundColor: "#fffdf9",
  },
  itemUnread: {
    backgroundColor: "#F5F0E8",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "#EDE8DF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  iconBoxUnread: {
    backgroundColor: "#D8EDE3",
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  itemTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
  },
  itemTitleUnread: {
    color: "#0f172a",
  },
  itemTime: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9E9890",
  },
  itemBody: {
    fontSize: 13,
    color: "#706A5F",
    lineHeight: 19,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EA580C",
    marginTop: 6,
  },
  endNote: {
    textAlign: "center",
    color: "#9E9890",
    fontSize: 13,
    fontWeight: "600",
    paddingVertical: 28,
  },
});
