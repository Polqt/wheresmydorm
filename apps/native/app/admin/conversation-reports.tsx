import FontAwesome from "@expo/vector-icons/FontAwesome";
import { FlashList } from "@shopify/flash-list";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/providers/auth-provider";
import type { AdminConversationReportItem } from "@/types/platform";
import { trpc } from "@/utils/api-client";
import { listingDetailRoute } from "@/utils/routes";

const moderationStatuses = [
  "pending",
  "reviewed",
  "actioned",
  "dismissed",
] as const;

type ModerationStatus = (typeof moderationStatuses)[number];

function formatReportDate(value: string | Date) {
  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusTone(status: ModerationStatus) {
  switch (status) {
    case "actioned":
      return {
        bg: "#FEF2F2",
        label: "Actioned",
        text: "#B91C1C",
      };
    case "dismissed":
      return {
        bg: "#F5F0EA",
        label: "Dismissed",
        text: "#78716C",
      };
    case "reviewed":
      return {
        bg: "#EFF6FF",
        label: "Reviewed",
        text: "#1D4ED8",
      };
    default:
      return {
        bg: "#FFF7ED",
        label: "Pending",
        text: "#C2410C",
      };
  }
}

function ReportCard({
  isModerating,
  item,
  onModerate,
}: {
  isModerating: boolean;
  item: AdminConversationReportItem;
  onModerate: (reportId: string, status: ModerationStatus) => void;
}) {
  const tone = getStatusTone(item.status);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
          <Text style={[styles.statusText, { color: tone.text }]}>
            {tone.label}
          </Text>
        </View>
        <Text style={styles.cardDate}>{formatReportDate(item.createdAt)}</Text>
      </View>

      <Text style={styles.cardTitle} numberOfLines={1}>
        {item.listing.title}
      </Text>
      <Text style={styles.cardMeta}>
        Reporter:{" "}
        {`${item.reporter.firstName ?? ""} ${item.reporter.lastName ?? ""}`.trim() ||
          "Member"}
      </Text>
      <Text style={styles.cardMeta}>
        Reported user:{" "}
        {`${item.reportedUser.firstName ?? ""} ${item.reportedUser.lastName ?? ""}`.trim() ||
          "Member"}
      </Text>
      <Text style={styles.reasonLabel}>Reason: {item.reason}</Text>
      {item.notes ? <Text style={styles.cardNotes}>{item.notes}</Text> : null}

      <View style={styles.actionsRow}>
        <Pressable
          onPress={() => router.push(listingDetailRoute(item.listing.id))}
          style={styles.secondaryAction}
        >
          <Text style={styles.secondaryActionText}>Open listing</Text>
        </Pressable>
        <Pressable
          disabled={item.status === "reviewed" || isModerating}
          onPress={() => onModerate(item.id, "reviewed")}
          style={[
            styles.secondaryAction,
            (item.status === "reviewed" || isModerating) &&
              styles.actionDisabled,
          ]}
        >
          <Text style={styles.secondaryActionText}>
            {isModerating ? "Updating..." : "Review"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          disabled={item.status === "dismissed" || isModerating}
          onPress={() => onModerate(item.id, "dismissed")}
          style={[
            styles.secondaryAction,
            (item.status === "dismissed" || isModerating) &&
              styles.actionDisabled,
          ]}
        >
          <Text style={styles.secondaryActionText}>
            {isModerating ? "Updating..." : "Dismiss"}
          </Text>
        </Pressable>
        <Pressable
          disabled={item.status === "actioned" || isModerating}
          onPress={() => onModerate(item.id, "actioned")}
          style={[
            styles.primaryAction,
            (item.status === "actioned" || isModerating) &&
              styles.actionDisabled,
          ]}
        >
          <Text style={styles.primaryActionText}>
            {isModerating ? "Updating..." : "Take action"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ConversationReportsScreen() {
  const { role } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    tone: "error" | "success";
    message: string;
  } | null>(null);
  const reportsQuery = useQuery({
    ...trpc.admin.listConversationReports.queryOptions(),
    enabled: role === "admin",
  });
  const moderateReport = useMutation(
    trpc.admin.moderateConversationReport.mutationOptions({
      onError: () => {
        setFeedback({
          tone: "error",
          message: "Moderation action failed. Please try again.",
        });
        setActiveReportId(null);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ["trpc", "admin", "listConversationReports"],
        });
        setFeedback({
          tone: "success",
          message: "Conversation report updated.",
        });
        setActiveReportId(null);
      },
    }),
  );

  const items = reportsQuery.data ?? [];
  const pendingCount = items.filter((item) => item.status === "pending").length;

  if (role !== "admin") {
    return (
      <View
        style={[styles.container, styles.centered, { paddingTop: insets.top }]}
      >
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
        <Text style={styles.headerTitle}>Conversation reports</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>{pendingCount} pending reports</Text>
        <Text style={styles.summaryBody}>
          Review finder-lister conversation flags and update moderation status.
        </Text>
      </View>
      {feedback ? (
        <View
          style={[
            styles.feedback,
            feedback.tone === "success"
              ? styles.feedbackSuccess
              : styles.feedbackError,
          ]}
        >
          <Text
            style={[
              styles.feedbackText,
              feedback.tone === "success"
                ? styles.feedbackTextSuccess
                : styles.feedbackTextError,
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
            {reportsQuery.isLoading
              ? "Loading conversation reports..."
              : "No conversation reports right now"}
          </Text>
        }
        renderItem={({ item }) => (
          <ReportCard
            isModerating={
              moderateReport.isPending && activeReportId === item.id
            }
            item={item}
            onModerate={(reportId, status) => {
              setFeedback(null);
              setActiveReportId(reportId);
              moderateReport.mutate({ reportId, status });
            }}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actionDisabled: {
    opacity: 0.45,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
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
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardMeta: {
    color: "#706A5F",
    fontSize: 12,
    marginTop: 4,
  },
  cardNotes: {
    color: "#3f3a33",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
  cardTitle: {
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
  feedbackError: {
    backgroundColor: "#FEF2F2",
  },
  feedbackSuccess: {
    backgroundColor: "#ECFDF3",
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: "700",
  },
  feedbackTextError: {
    color: "#B91C1C",
  },
  feedbackTextSuccess: {
    color: "#166534",
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
  headerRight: {
    width: 36,
  },
  headerTitle: {
    color: "#0f172a",
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  list: {
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  primaryAction: {
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 16,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  reasonLabel: {
    color: "#0B4A30",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 10,
    textTransform: "capitalize",
  },
  secondaryAction: {
    alignItems: "center",
    backgroundColor: "#F0EBE3",
    borderRadius: 16,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryActionText: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "800",
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  summary: {
    backgroundColor: "#fffdf9",
    borderRadius: 24,
    marginBottom: 10,
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  summaryBody: {
    color: "#706A5F",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  summaryTitle: {
    color: "#0f172a",
    fontSize: 20,
    fontWeight: "800",
  },
});
