import { useQuery } from "@tanstack/react-query";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Container } from "@/components/container";
import { useMapStore } from "@/stores/map";
import { trpc } from "@/utils/trpc";

const FALLBACK_LAT = 10.6765;
const FALLBACK_LNG = 122.9511;

function formatCurrency(price: string) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(Number(price));
}

export default function DiscoverTabScreen() {
  const filters = useMapStore((state) => state.filters);
  const listingsQuery = useQuery(
    trpc.listings.getNearby.queryOptions({
      lat: FALLBACK_LAT,
      lng: FALLBACK_LNG,
      filters,
    }),
  );

  return (
    <Container>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Discover</Text>
        <Text style={styles.title}>
          Curated places worth checking this week
        </Text>
        <Text style={styles.subtitle}>
          This tab turns the same nearby inventory into a scrollable shortlist
          for faster browsing.
        </Text>

        {(listingsQuery.data ?? []).slice(0, 8).map((listing) => (
          <View key={listing.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{listing.title}</Text>
              <Text style={styles.cardPrice}>
                {formatCurrency(listing.price_per_month)}
              </Text>
            </View>
            <Text style={styles.cardMeta}>
              {listing.city}
              {listing.barangay ? ` • ${listing.barangay}` : ""}
            </Text>
            <Text style={styles.cardMeta}>
              {listing.rating_overall
                ? `${listing.rating_overall.toFixed(1)} stars`
                : "New listing"}{" "}
              • {listing.review_count} reviews
            </Text>
          </View>
        ))}
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    paddingVertical: 20,
    gap: 14,
  },
  eyebrow: {
    color: "#0f766e",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: {
    color: "#0f172a",
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 22,
  },
  card: {
    borderRadius: 24,
    backgroundColor: "#fffdf8",
    padding: 18,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "800",
  },
  cardPrice: {
    color: "#ea580c",
    fontSize: 15,
    fontWeight: "800",
  },
  cardMeta: {
    marginTop: 8,
    color: "#475569",
    fontSize: 13,
  },
});
