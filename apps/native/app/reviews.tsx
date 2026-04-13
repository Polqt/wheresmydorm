import FontAwesome from "@expo/vector-icons/FontAwesome";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { trpc } from "@/utils/api-client";
import { formatCurrency } from "@/utils/profile";
import { listingDetailRoute } from "@/utils/routes";

function formatReviewDate(value: string | Date) {
  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ReviewsScreen() {
  const insets = useSafeAreaInsets();
  const reviewsQuery = useQuery(trpc.reviews.myReviews.queryOptions());
  const items = reviewsQuery.data ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="arrow-left" size={16} color="#0f172a" />
        </Pressable>
        <Text style={styles.headerTitle}>My reviews</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>{items.length} reviews written</Text>
        <Text style={styles.summaryBody}>
          Revisit your published feedback and any lister responses.
        </Text>
      </View>

      <FlashList
        contentContainerStyle={styles.list}
        data={items}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>You have not written any reviews yet</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(listingDetailRoute(item.listingId))}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.listing.title}
              </Text>
              <Text style={styles.cardRating}>{item.ratingOverall.toFixed(1)}★</Text>
            </View>
            <Text style={styles.cardMeta}>
              {[item.listing.city, item.listing.barangay].filter(Boolean).join(" • ")}
            </Text>
            <Text style={styles.cardBody} numberOfLines={4}>
              {item.body}
            </Text>
            <View style={styles.footerRow}>
              <Text style={styles.cardDate}>{formatReviewDate(item.createdAt)}</Text>
              <Text style={styles.cardPrice}>
                {formatCurrency(item.listing.pricePerMonth ?? "0")}
              </Text>
            </View>
            {item.listerResponse ? (
              <View style={styles.responseBox}>
                <Text style={styles.responseLabel}>Lister response</Text>
                <Text style={styles.responseText} numberOfLines={3}>
                  {item.listerResponse}
                </Text>
              </View>
            ) : null}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  cardBody: {
    color: "#3f3a33",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
  },
  cardDate: {
    color: "#8B857C",
    fontSize: 12,
    fontWeight: "600",
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  cardMeta: {
    color: "#706A5F",
    fontSize: 12,
    marginTop: 4,
  },
  cardPrice: {
    color: "#0B2D23",
    fontSize: 12,
    fontWeight: "800",
  },
  cardRating: {
    color: "#0B4A30",
    fontSize: 13,
    fontWeight: "800",
  },
  cardTitle: {
    color: "#0f172a",
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
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
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
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
  responseBox: {
    backgroundColor: "#F3F7F4",
    borderRadius: 18,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  responseLabel: {
    color: "#0B4A30",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  responseText: {
    color: "#264136",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
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
