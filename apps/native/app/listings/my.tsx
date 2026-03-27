import Ionicons from "@expo/vector-icons/Ionicons";
import { FlashList } from "@shopify/flash-list";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import { memo, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { MyListing } from "@/types/listings";
import { formatCurrency } from "@/utils/profile";
import { createListingRoute, listingEditRoute } from "@/utils/routes";
import { trpc } from "@/utils/api-client";

const STATUS_COLORS: Record<MyListing["status"], { bg: string; text: string }> =
  {
    active: { bg: "#EEF5F1", text: "#0B2D23" },
    paused: { bg: "#FFF3E0", text: "#E65100" },
    archived: { bg: "#F5F0EA", text: "#706A5F" },
  };

const COVER_FALLBACK =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=400";

const ListingRow = memo(function ListingRow({
  item,
  onPress,
  onTogglePause,
}: {
  item: MyListing;
  onPress: (id: string) => void;
  onTogglePause: (id: string, current: MyListing["status"]) => void;
}) {
  const statusStyle = STATUS_COLORS[item.status];
  const handlePress = useCallback(() => onPress(item.id), [item.id, onPress]);
  const handleToggle = useCallback(
    () => onTogglePause(item.id, item.status),
    [item.id, item.status, onTogglePause],
  );

  return (
    <Pressable onPress={handlePress} style={styles.row}>
      <Image
        contentFit="cover"
        source={{ uri: item.coverPhoto ?? COVER_FALLBACK }}
        style={styles.rowThumb}
        transition={200}
      />
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.rowMeta}>
          {item.city}
          {item.barangay ? ` - ${item.barangay}` : ""}
        </Text>
        <Text style={styles.rowPrice}>
          {formatCurrency(item.pricePerMonth)}/mo
        </Text>

        <View style={styles.rowFooter}>
          <View
            style={[styles.statusChip, { backgroundColor: statusStyle.bg }]}
          >
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status}
            </Text>
          </View>
          <View style={styles.rowStats}>
            <Ionicons color="#A09A90" name="eye-outline" size={12} />
            <Text style={styles.statText}>{item.viewCount}</Text>
            <Ionicons color="#A09A90" name="bookmark-outline" size={12} />
            <Text style={styles.statText}>{item.bookmarkCount}</Text>
            <Ionicons color="#A09A90" name="chatbubble-outline" size={12} />
            <Text style={styles.statText}>{item.inquiryCount}</Text>
          </View>
        </View>
      </View>

      <Pressable hitSlop={10} onPress={handleToggle} style={styles.pauseBtn}>
        <Ionicons
          color="#706A5F"
          name={
            item.status === "active"
              ? "pause-circle-outline"
              : "play-circle-outline"
          }
          size={22}
        />
      </Pressable>
    </Pressable>
  );
});

export default function MyListingsScreen() {
  const queryClient = useQueryClient();

  const listingsQuery = useQuery(trpc.listings.myListings.queryOptions());

  const setStatusMutation = useMutation(
    trpc.listings.setStatus.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["trpc", "listings", "myListings"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["trpc", "listings", "list"],
          }),
        ]);
      },
    }),
  );

  const handleListingPress = useCallback((id: string) => {
    router.push(listingEditRoute(id));
  }, []);

  const handleTogglePause = useCallback(
    (id: string, current: MyListing["status"]) => {
      const next: MyListing["status"] =
        current === "active" ? "paused" : "active";
      Alert.alert(
        next === "paused" ? "Pause listing?" : "Reactivate listing?",
        next === "paused"
          ? "Finders will not see it while paused."
          : "Finders will see it again once active.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: next === "paused" ? "Pause" : "Reactivate",
            style: next === "paused" ? "destructive" : "default",
            onPress: () => setStatusMutation.mutate({ id, status: next }),
          },
        ],
      );
    },
    [setStatusMutation],
  );

  const renderItem = useCallback(
    ({ item }: { item: MyListing }) => (
      <ListingRow
        item={item}
        onPress={handleListingPress}
        onTogglePause={handleTogglePause}
      />
    ),
    [handleListingPress, handleTogglePause],
  );

  const keyExtractor = useCallback((item: MyListing) => item.id, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Ionicons color="#1A1A1A" name="chevron-back" size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>My Listings</Text>
        <Pressable
          hitSlop={8}
          onPress={() => router.push(createListingRoute())}
          style={styles.addBtn}
        >
          <Ionicons color="#ffffff" name="add" size={20} />
        </Pressable>
      </View>

      {listingsQuery.isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#0B2D23" size="large" />
        </View>
      ) : (
        <FlashList
          data={listingsQuery.data ?? []}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No listings yet</Text>
              <Text style={styles.emptyBody}>
                Tap the + button to post your first listing.
              </Text>
              <Pressable
                onPress={() => router.push(createListingRoute())}
                style={styles.emptyBtn}
              >
                <Text style={styles.emptyBtnText}>Create listing</Text>
              </Pressable>
            </View>
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F5F0EA",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flex: 1, color: "#0f172a", fontSize: 20, fontWeight: "800" },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#0B2D23",
    alignItems: "center",
    justifyContent: "center",
  },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  row: {
    flexDirection: "row",
    backgroundColor: "#fffdf9",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EAE5DE",
    overflow: "hidden",
    marginBottom: 12,
    alignItems: "center",
  },
  rowThumb: { width: 88, height: 88 },
  rowContent: { flex: 1, padding: 12 },
  rowTitle: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
  },
  rowMeta: { color: "#706A5F", fontSize: 12, marginTop: 2 },
  rowPrice: { color: "#0B2D23", fontSize: 13, fontWeight: "800", marginTop: 4 },
  rowFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  statusChip: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  rowStats: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { color: "#A09A90", fontSize: 11, fontWeight: "600" },
  pauseBtn: { paddingHorizontal: 12 },
  empty: { marginTop: 80, alignItems: "center", paddingHorizontal: 32 },
  emptyTitle: { color: "#1A1A1A", fontSize: 18, fontWeight: "800" },
  emptyBody: {
    color: "#706A5F",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
    textAlign: "center",
  },
  emptyBtn: {
    marginTop: 20,
    backgroundColor: "#0B2D23",
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  emptyBtnText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
});
