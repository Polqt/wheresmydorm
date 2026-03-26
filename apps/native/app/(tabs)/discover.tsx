import Ionicons from "@expo/vector-icons/Ionicons";
import { FlashList } from "@shopify/flash-list";
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

import { ScreenHeader } from "@/components/ui/screen-header";
import { useDiscoveryListings } from "@/hooks/use-discovery-listings";
import type { ListingListItem } from "@/types/listings";
import { formatCurrency } from "@/utils/profile";
import { listingDetailRoute } from "@/utils/routes";

const COVER_FALLBACK =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800";

const ListingRow = memo(function ListingRow({
  item,
  onPress,
}: {
  item: ListingListItem;
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

      <View style={styles.content}>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {[item.city, item.barangay].filter(Boolean).join(" - ")}
          </Text>
          <View style={styles.ratingWrap}>
            <Ionicons color="#F59E0B" name="star" size={12} />
            <Text style={styles.ratingText}>
              {item.ratingOverall ? item.ratingOverall.toFixed(1) : "New"}
            </Text>
          </View>
        </View>

        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.title}>
            {item.title}
          </Text>
          <Text style={styles.price}>{formatCurrency(item.pricePerMonth)}</Text>
        </View>

        <Text numberOfLines={1} style={styles.subline}>
          {item.propertyType.replaceAll("_", " ")} • {item.reviewCount} review
          {item.reviewCount === 1 ? "" : "s"}
        </Text>

        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>
              {item.isFeatured ? "Featured" : "Nearby"}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

export default function DiscoverTabScreen() {
  const { isReady, items, label, query } = useDiscoveryListings();

  const handleListingPress = useCallback((id: string) => {
    router.push(listingDetailRoute(id));
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ListingListItem }) => (
      <ListingRow item={item} onPress={handleListingPress} />
    ),
    [handleListingPress],
  );

  const keyExtractor = useCallback((item: ListingListItem) => item.id, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader subtitle={label} title="Discover" />

      {query.isLoading || !isReady ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#0B2D23" size="large" />
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No listings nearby</Text>
              <Text style={styles.emptyBody}>
                Try adjusting filters or expanding your search distance.
              </Text>
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
  container: {
    backgroundColor: "#F7F4EE",
    flex: 1,
  },
  loading: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  list: {
    paddingBottom: 120,
    paddingHorizontal: 18,
  },
  row: {
    marginBottom: 24,
  },
  cover: {
    borderRadius: 26,
    height: 232,
    width: "100%",
  },
  content: {
    paddingHorizontal: 2,
    paddingTop: 12,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  metaText: {
    color: "#736C63",
    flex: 1,
    fontSize: 13,
    marginRight: 10,
  },
  ratingWrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  ratingText: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "700",
  },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  title: {
    color: "#111827",
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  price: {
    color: "#0B2D23",
    fontSize: 16,
    fontWeight: "800",
  },
  subline: {
    color: "#8A8176",
    fontSize: 13,
    marginTop: 4,
    textTransform: "capitalize",
  },
  tagRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  tag: {
    backgroundColor: "#ECE6DC",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: {
    color: "#5C564D",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  empty: {
    alignItems: "center",
    marginTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: "#1A1A1A",
    fontSize: 18,
    fontWeight: "800",
  },
  emptyBody: {
    color: "#706A5F",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
    textAlign: "center",
  },
});
