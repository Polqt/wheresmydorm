import Ionicons from "@expo/vector-icons/Ionicons";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import { memo, useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { SavedListing } from "@/types/listings";
import { ScreenHeader } from "@/components/ui/screen-header";
import { formatCurrency } from "@/utils/profile";
import { listingDetailRoute } from "@/utils/routes";
import { trpc } from "@/utils/trpc";

const COVER_FALLBACK =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=400";

const SavedRow = memo(function SavedRow({
  item,
  onPress,
}: {
  item: SavedListing;
  onPress: (id: string) => void;
}) {
  const handlePress = useCallback(() => onPress(item.id), [item.id, onPress]);

  return (
    <Pressable onPress={handlePress} style={styles.row}>
      <Image
        contentFit="cover"
        source={{ uri: item.coverPhoto ?? COVER_FALLBACK }}
        style={styles.cover}
        transition={200}
      />
      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.title}>
          {item.title}
        </Text>
        <Text style={styles.meta}>
          {[item.city, item.barangay].filter(Boolean).join(" - ")}
        </Text>
        <Text style={styles.price}>{formatCurrency(item.pricePerMonth)}/mo</Text>
        <View style={styles.footer}>
          <Text style={styles.propertyType}>
            {item.propertyType.replaceAll("_", " ")}
          </Text>
          <View style={styles.ratingWrap}>
            <Ionicons color="#F59E0B" name="star" size={12} />
            <Text style={styles.ratingText}>
              {item.ratingOverall ? item.ratingOverall.toFixed(1) : "New"}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

export default function SavedListingsScreen() {
  const savedQuery = useQuery(trpc.listings.savedListings.queryOptions());

  const handlePress = useCallback((id: string) => {
    router.push(listingDetailRoute(id));
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: SavedListing }) => (
      <SavedRow item={item} onPress={handlePress} />
    ),
    [handlePress],
  );

  const keyExtractor = useCallback((item: SavedListing) => item.id, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader
        subtitle="Places you bookmarked while browsing."
        title="Saved"
        withBackButton
      />

      {savedQuery.isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#0B2D23" size="large" />
        </View>
      ) : (
        <FlashList
          data={savedQuery.data ?? []}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No saved listings</Text>
              <Text style={styles.emptyBody}>
                Bookmark listings from the map or discover tab.
              </Text>
              <Pressable
                onPress={() => router.replace("/(tabs)/map")}
                style={styles.emptyBtn}
              >
                <Text style={styles.emptyBtnText}>Browse map</Text>
              </Pressable>
            </View>
          }
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F4EE" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingBottom: 40, paddingHorizontal: 18 },
  row: {
    flexDirection: "row",
    gap: 14,
    paddingVertical: 14,
  },
  separator: {
    backgroundColor: "#E9E2D8",
    height: 1,
  },
  cover: { width: 108, height: 112, borderRadius: 20 },
  body: { flex: 1, justifyContent: "center" },
  title: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 21,
  },
  meta: { color: "#736C63", fontSize: 13, marginTop: 5 },
  price: { color: "#0B2D23", fontSize: 14, fontWeight: "800", marginTop: 8 },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  propertyType: {
    color: "#8A8176",
    fontSize: 12,
    textTransform: "capitalize",
  },
  ratingWrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  ratingText: { color: "#334155", fontSize: 12, fontWeight: "700" },
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
    backgroundColor: "#111827",
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 13,
  },
  emptyBtnText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
});
