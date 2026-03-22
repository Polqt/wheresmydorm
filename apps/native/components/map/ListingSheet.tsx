import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import type { RefObject } from "react";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ListingDetail } from "@/stores/map";

const SHEET_SNAP_POINTS = ["36%", "72%"];

function formatCurrency(price: string) {
  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return price;
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(numericPrice);
}

export function ListingSheet({
  sheetRef,
  isOpen,
  isLoading,
  listing,
  errorMessage,
  onClose,
}: {
  sheetRef: RefObject<BottomSheet | null>;
  isOpen: boolean;
  isLoading: boolean;
  listing: ListingDetail | null;
  errorMessage: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!sheetRef.current) {
      return;
    }

    if (isOpen) {
      sheetRef.current.snapToIndex(0);
    } else {
      sheetRef.current.close();
    }
  }, [isOpen, sheetRef]);

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={SHEET_SNAP_POINTS}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {isLoading ? (
          <BottomSheetView style={styles.stateBlock}>
            <Text style={styles.title}>Loading listing</Text>
            <Text style={styles.body}>
              Fetching details, photos, and the full review snapshot.
            </Text>
          </BottomSheetView>
        ) : null}

        {errorMessage ? (
          <BottomSheetView style={styles.stateBlock}>
            <Text style={styles.title}>Listing unavailable</Text>
            <Text style={styles.body}>{errorMessage}</Text>
          </BottomSheetView>
        ) : null}

        {listing ? (
          <BottomSheetView>
            <Image
              contentFit="cover"
              source={
                listing.photos[0]?.url ??
                "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop"
              }
              style={styles.hero}
            />

            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.price}>
                  {formatCurrency(listing.pricePerMonth)}
                </Text>
                <Text style={styles.heading}>{listing.title}</Text>
                <Text style={styles.subheading}>
                  {listing.barangay ? `${listing.barangay}, ` : ""}
                  {listing.city}
                </Text>
              </View>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingValue}>
                  {listing.ratingOverall
                    ? listing.ratingOverall.toFixed(1)
                    : "New"}
                </Text>
                <Text style={styles.ratingLabel}>rating</Text>
              </View>
            </View>

            <View style={styles.specRow}>
              <View style={styles.specPill}>
                <Text style={styles.specLabel}>
                  {listing.propertyType.replaceAll("_", " ")}
                </Text>
              </View>
              <View style={styles.specPill}>
                <Text style={styles.specLabel}>
                  {listing.maxOccupants ?? "?"} occupants
                </Text>
              </View>
              <View style={styles.specPill}>
                <Text style={styles.specLabel}>
                  {listing.sizeSqm ? `${listing.sizeSqm} sqm` : "Size TBC"}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>About this place</Text>
            <Text style={styles.body}>{listing.description}</Text>

            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenities}>
              {listing.amenities.map((amenity: string) => (
                <View key={amenity} style={styles.amenityChip}>
                  <Text style={styles.amenityText}>
                    {amenity.replaceAll("_", " ")}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Lister</Text>
            <Text style={styles.body}>{listing.lister.displayName}</Text>

            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Back to map</Text>
            </Pressable>
          </BottomSheetView>
        ) : null}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: "#fffdf8",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handle: {
    backgroundColor: "#cbd5e1",
    width: 44,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  stateBlock: {
    paddingVertical: 8,
  },
  hero: {
    height: 196,
    borderRadius: 22,
  },
  header: {
    marginTop: 18,
    flexDirection: "row",
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  price: {
    color: "#0f766e",
    fontSize: 22,
    fontWeight: "800",
  },
  heading: {
    marginTop: 4,
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "800",
  },
  subheading: {
    marginTop: 4,
    color: "#475569",
    fontSize: 14,
  },
  ratingBadge: {
    borderRadius: 20,
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  ratingValue: {
    color: "#92400e",
    fontSize: 18,
    fontWeight: "800",
  },
  ratingLabel: {
    color: "#a16207",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  specRow: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  specPill: {
    borderRadius: 999,
    backgroundColor: "#ecfeff",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  specLabel: {
    color: "#155e75",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  sectionTitle: {
    marginTop: 20,
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "800",
  },
  body: {
    marginTop: 8,
    color: "#475569",
    fontSize: 14,
    lineHeight: 22,
  },
  amenities: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  amenityChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#fed7aa",
    backgroundColor: "#fff7ed",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  amenityText: {
    color: "#9a3412",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  closeButton: {
    marginTop: 22,
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "#0f172a",
    paddingVertical: 14,
  },
  closeButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  title: {
    color: "#0f172a",
    fontSize: 20,
    fontWeight: "800",
  },
});
