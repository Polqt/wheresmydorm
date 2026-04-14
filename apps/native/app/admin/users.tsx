import FontAwesome from "@expo/vector-icons/FontAwesome";
import { FlashList } from "@shopify/flash-list";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/providers/auth-provider";
import { trpc } from "@/utils/api-client";

type AppRole = "admin" | "finder" | "lister";
type RoleFilter = AppRole | "all";

const ROLE_FILTERS: RoleFilter[] = ["all", "finder", "lister", "admin"];

function getRoleTone(role: AppRole) {
  switch (role) {
    case "admin":
      return { bg: "#EEF2FF", text: "#3730A3" };
    case "lister":
      return { bg: "#EEF5F1", text: "#0B4A30" };
    default:
      return { bg: "#FFF7ED", text: "#C2410C" };
  }
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminUsersScreen() {
  const { role } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [feedback, setFeedback] = useState<{
    tone: "error" | "success";
    message: string;
  } | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  const usersQuery = useQuery({
    ...trpc.admin.listUsers.queryOptions({
      limit: 50,
      role: roleFilter === "all" ? undefined : roleFilter,
    }),
    enabled: role === "admin",
  });

  const banUserMutation = useMutation(
    trpc.admin.banUser.mutationOptions({
      onError: (error) => {
        setFeedback({ tone: "error", message: error.message || "Ban action failed." });
        setActiveUserId(null);
      },
      onSuccess: async (data) => {
        await queryClient.invalidateQueries({ queryKey: ["trpc", "admin", "listUsers"] });
        setFeedback({
          tone: "success",
          message: data.banned ? "User banned." : "User unbanned.",
        });
        setActiveUserId(null);
      },
    }),
  );

  const setFinderPaidMutation = useMutation(
    trpc.admin.setFinderPaid.mutationOptions({
      onError: (error) => {
        setFeedback({ tone: "error", message: error.message || "Update failed." });
        setActiveUserId(null);
      },
      onSuccess: async (data) => {
        await queryClient.invalidateQueries({ queryKey: ["trpc", "admin", "listUsers"] });
        setFeedback({
          tone: "success",
          message: data.isPaidFinder ? "Finder upgraded to paid." : "Finder downgraded to free.",
        });
        setActiveUserId(null);
      },
    }),
  );

  const items = usersQuery.data?.items ?? [];
  const isBusy = banUserMutation.isPending || setFinderPaidMutation.isPending;

  if (role !== "admin") {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.empty}>Admin access is required.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="arrow-left" size={16} color="#0f172a" />
        </Pressable>
        <Text style={styles.headerTitle}>Users</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>{items.length} users loaded</Text>
        <Text style={styles.summaryBody}>
          Ban, unban, or adjust finder plan status for any account.
        </Text>
      </View>

      <View style={styles.filterRow}>
        {ROLE_FILTERS.map((filter) => (
          <Pressable
            key={filter}
            onPress={() => setRoleFilter(filter)}
            style={[styles.filterChip, roleFilter === filter && styles.filterChipActive]}
          >
            <Text
              style={[
                styles.filterChipText,
                roleFilter === filter && styles.filterChipTextActive,
              ]}
            >
              {filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {feedback ? (
        <View
          style={[
            styles.feedback,
            feedback.tone === "success" ? styles.feedbackSuccess : styles.feedbackError,
          ]}
        >
          <Text
            style={[
              styles.feedbackText,
              feedback.tone === "success" ? styles.feedbackTextSuccess : styles.feedbackTextError,
            ]}
          >
            {feedback.message}
          </Text>
        </View>
      ) : null}

      <FlashList
        contentContainerStyle={styles.list}
        data={items}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {usersQuery.isLoading ? "Loading users..." : "No users found"}
          </Text>
        }
        renderItem={({ item }) => {
          const tone = getRoleTone(item.role as AppRole);
          const isActive = activeUserId === item.id;

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.rolePill, { backgroundColor: tone.bg }]}>
                  <Text style={[styles.rolePillText, { color: tone.text }]}>
                    {item.role}
                  </Text>
                </View>
                {item.isPaidFinder ? (
                  <View style={styles.paidBadge}>
                    <Text style={styles.paidBadgeText}>PAID</Text>
                  </View>
                ) : null}
                <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
              </View>

              <Text style={styles.cardName} numberOfLines={1}>
                {[item.firstName, item.lastName].filter(Boolean).join(" ") || "Unnamed user"}
              </Text>
              <Text style={styles.cardId} numberOfLines={1}>{item.id}</Text>

              <View style={styles.actionsRow}>
                <Pressable
                  disabled={isBusy}
                  onPress={() => {
                    Alert.alert(
                      "Ban or unban user?",
                      `This will toggle the ban state for this account.`,
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Ban user",
                          style: "destructive",
                          onPress: () => {
                            setFeedback(null);
                            setActiveUserId(item.id);
                            banUserMutation.mutate({ userId: item.id, banned: true });
                          },
                        },
                        {
                          text: "Unban user",
                          onPress: () => {
                            setFeedback(null);
                            setActiveUserId(item.id);
                            banUserMutation.mutate({ userId: item.id, banned: false });
                          },
                        },
                      ],
                    );
                  }}
                  style={[styles.action, styles.actionDestructive, (isBusy && isActive) && styles.actionDisabled]}
                >
                  <Text style={styles.actionTextDestructive}>
                    {isActive && banUserMutation.isPending ? "Updating..." : "Ban / Unban"}
                  </Text>
                </Pressable>

                {item.role === "finder" ? (
                  <Pressable
                    disabled={isBusy}
                    onPress={() => {
                      setFeedback(null);
                      setActiveUserId(item.id);
                      setFinderPaidMutation.mutate({
                        userId: item.id,
                        isPaidFinder: !item.isPaidFinder,
                      });
                    }}
                    style={[styles.action, (isBusy && isActive) && styles.actionDisabled]}
                  >
                    <Text style={styles.actionText}>
                      {isActive && setFinderPaidMutation.isPending
                        ? "Updating..."
                        : item.isPaidFinder
                          ? "Remove paid plan"
                          : "Grant paid plan"}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: "center",
    backgroundColor: "#F0EBE3",
    borderRadius: 16,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  actionDestructive: {
    backgroundColor: "#FEF2F2",
  },
  actionDisabled: {
    opacity: 0.45,
  },
  actionText: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "800",
  },
  actionTextDestructive: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "800",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  backBtn: {
    alignItems: "center",
    backgroundColor: "#F0EBE3",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  card: {
    backgroundColor: "#fffdf9",
    borderRadius: 24,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  cardDate: {
    color: "#8B857C",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: "auto",
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  cardId: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 2,
  },
  cardName: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 10,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    backgroundColor: "#f7f4ee",
    flex: 1,
  },
  empty: {
    color: "#9E9890",
    fontSize: 13,
    fontWeight: "600",
    paddingVertical: 32,
    textAlign: "center",
  },
  feedback: {
    borderRadius: 18,
    marginBottom: 10,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  feedbackError: { backgroundColor: "#FEF2F2" },
  feedbackSuccess: { backgroundColor: "#ECFDF3" },
  feedbackText: { fontSize: 13, fontWeight: "700" },
  feedbackTextError: { color: "#B91C1C" },
  feedbackTextSuccess: { color: "#166534" },
  filterChip: {
    backgroundColor: "#E7E5E4",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterChipActive: { backgroundColor: "#111827" },
  filterChipText: { color: "#334155", fontSize: 12, fontWeight: "700" },
  filterChipTextActive: { color: "#FFFFFF" },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: "center",
    backgroundColor: "#fffdf9",
    borderBottomColor: "#E7E0D5",
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerRight: { width: 36 },
  headerTitle: {
    color: "#0f172a",
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  list: { paddingBottom: 24, paddingHorizontal: 16 },
  paidBadge: {
    backgroundColor: "#FFF7ED",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  paidBadgeText: { color: "#C2410C", fontSize: 10, fontWeight: "800" },
  rolePill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  rolePillText: { fontSize: 11, fontWeight: "800", textTransform: "capitalize" },
  summary: {
    backgroundColor: "#fffdf9",
    borderRadius: 24,
    marginBottom: 10,
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  summaryBody: { color: "#706A5F", fontSize: 13, lineHeight: 19, marginTop: 4 },
  summaryTitle: { color: "#0f172a", fontSize: 20, fontWeight: "800" },
});
