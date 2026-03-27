import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PLACEHOLDER_NOTIFICATIONS = [
  {
    id: "1",
    icon: "home" as const,
    title: "New listing near you",
    body: "A new dorm just listed 500m from your saved area.",
    time: "2m ago",
    unread: true,
  },
  {
    id: "2",
    icon: "star" as const,
    title: "Price drop alert",
    body: "Sunshine Dormitory dropped their monthly rate by ₱500.",
    time: "1h ago",
    unread: true,
  },
  {
    id: "3",
    icon: "check-circle" as const,
    title: "Booking confirmed",
    body: "Your viewing request for Unit 4B was accepted.",
    time: "3h ago",
    unread: false,
  },
  {
    id: "4",
    icon: "comment" as const,
    title: "New message",
    body: "The lister replied to your inquiry about parking.",
    time: "Yesterday",
    unread: false,
  },
  {
    id: "5",
    icon: "bell" as const,
    title: "Reminder",
    body: "You have a scheduled viewing tomorrow at 10:00 AM.",
    time: "Yesterday",
    unread: false,
  },
];

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="arrow-left" size={16} color="#0f172a" />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {PLACEHOLDER_NOTIFICATIONS.map((n) => (
          <Pressable key={n.id} style={[styles.item, n.unread && styles.itemUnread]}>
            <View style={[styles.iconBox, n.unread && styles.iconBoxUnread]}>
              <FontAwesome
                name={n.icon}
                size={16}
                color={n.unread ? "#0B2D23" : "#706A5F"}
              />
            </View>
            <View style={styles.itemContent}>
              <View style={styles.itemRow}>
                <Text style={[styles.itemTitle, n.unread && styles.itemTitleUnread]}>
                  {n.title}
                </Text>
                <Text style={styles.itemTime}>{n.time}</Text>
              </View>
              <Text style={styles.itemBody}>{n.body}</Text>
            </View>
            {n.unread && <View style={styles.dot} />}
          </Pressable>
        ))}

        <Text style={styles.endNote}>You're all caught up</Text>
      </ScrollView>
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
    borderRadius: 4,
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
  headerRight: {
    width: 36,
  },
  list: {
    paddingVertical: 10,
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
    borderRadius: 4,
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
