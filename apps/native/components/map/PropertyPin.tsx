import FontAwesome from "@expo/vector-icons/FontAwesome";
import type React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";

import type { NearbyListing } from "@/stores/map";

const iconByType: Record<
  NearbyListing["propertyType"],
  React.ComponentProps<typeof FontAwesome>["name"]
> = {
  apartment: "building",
  bedspace: "bed",
  boarding_house: "home",
  condo: "building-o",
  dorm: "university",
  studio: "square",
};

function formatCompactPrice(price: string) {
  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return price;
  }

  return numericPrice >= 1000
    ? `P${(numericPrice / 1000).toFixed(1)}k`
    : `P${numericPrice}`;
}

export function PropertyPin({
  listing,
  isSelected,
  onPress,
}: {
  listing: NearbyListing;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Marker
      coordinate={{ latitude: listing.lat, longitude: listing.lng }}
      onPress={onPress}
    >
      <Pressable onPress={onPress} style={styles.touchTarget}>
        <View style={[styles.pin, isSelected ? styles.pinSelected : null]}>
          <View style={styles.pinHeader}>
            <FontAwesome
              name={iconByType[listing.propertyType]}
              color="#0f172a"
              size={14}
            />
            <Text style={styles.price}>
              {formatCompactPrice(listing.pricePerMonth)}
            </Text>
          </View>
          <View style={styles.badge}>
            <FontAwesome name="star" color="#f59e0b" size={10} />
            <Text style={styles.badgeText}>
              {listing.ratingOverall
                ? listing.ratingOverall.toFixed(1)
                : "New"}
            </Text>
          </View>
        </View>
      </Pressable>
    </Marker>
  );
}

const styles = StyleSheet.create({
  touchTarget: {
    alignItems: "center",
  },
  pin: {
    minWidth: 84,
    borderRadius: 18,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fdba74",
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: "#431407",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  pinSelected: {
    backgroundColor: "#ffedd5",
    borderColor: "#fb923c",
    transform: [{ scale: 1.03 }],
  },
  pinHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  price: {
    color: "#0f172a",
    fontSize: 12,
    fontWeight: "800",
  },
  badge: {
    marginTop: 6,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: "#334155",
    fontSize: 11,
    fontWeight: "700",
  },
});
