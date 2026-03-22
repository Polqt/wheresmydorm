import { useQuery } from "@tanstack/react-query";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Container } from "@/components/container";
import { getNearbyListings } from "@/services/listings";
import { useMapStore } from "@/stores/map";

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
  const listingsQuery = useQuery({
    queryFn: () =>
      getNearbyListings({
        filters,
        lat: FALLBACK_LAT,
        lng: FALLBACK_LNG,
      }),
    queryKey: ["nearby-listings", FALLBACK_LAT, FALLBACK_LNG, filters],
  });

  return (
    <Container>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Discover</Text>
        <Text style={styles.title}>Shortlist places that feel promising</Text>
        <Text style={styles.subtitle}>
          Browse the same nearby inventory in a calmer, card-first view inspired
          by travel and outdoor discovery apps.
        </Text>

        {(listingsQuery.data ?? []).slice(0, 8).map((listing) => (
          <View key={listing.id} style={styles.card}>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {listing.isFeatured ? "Featured" : "Near you"}
                </Text>
              </View>
              <Text style={styles.rating}>
                {listing.ratingOverall
                  ? `${listing.ratingOverall.toFixed(1)} stars`
                  : "New listing"}
              </Text>
            </View>

            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{listing.title}</Text>
              <Text style={styles.cardPrice}>
                {formatCurrency(listing.pricePerMonth)}
              </Text>
            </View>

            <Text style={styles.cardMeta}>
              {listing.city}
              {listing.barangay ? ` - ${listing.barangay}` : ""}
            </Text>
            <Text style={styles.cardMeta}>
              {listing.reviewCount} reviews -{" "}
              {listing.propertyType.replaceAll("_", " ")}
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
    borderRadius: 28,
    backgroundColor: "#fffdf9",
    borderWidth: 1,
    borderColor: "#ece3d8",
    padding: 18,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  badge: {
    borderRadius: 999,
    backgroundColor: "#EEF5F1",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: "#0B2D23",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  rating: {
    color: "#6C6A64",
    fontSize: 12,
    fontWeight: "700",
  },
  cardHeader: {
    marginTop: 12,
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
    color: "#0B2D23",
    fontSize: 15,
    fontWeight: "800",
  },
  cardMeta: {
    marginTop: 8,
    color: "#475569",
    fontSize: 13,
    textTransform: "capitalize",
  },
});
