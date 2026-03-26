import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/providers/auth-provider";
import { encodeMessageThreadId } from "@/services/messages";
import { formatCurrency } from "@/utils/profile";
import { listingEditRoute, messageThreadRoute } from "@/utils/routes";
import { trpc } from "@/utils/trpc";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COVER_FALLBACK =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200";

function SpecPill({ label }: { label: string }) {
  return (
    <View style={styles.specPill}>
      <Text style={styles.specPillText}>{label}</Text>
    </View>
  );
}

function AmenityChip({ label }: { label: string }) {
  return (
    <View style={styles.amenityChip}>
      <Text style={styles.amenityChipText}>{label.replaceAll("_", " ")}</Text>
    </View>
  );
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [photoIndex, setPhotoIndex] = useState(0);

  const detailQuery = useQuery(
    trpc.listings.getById.queryOptions(
      { id: id ?? "" },
      { enabled: Boolean(id) },
    ),
  );

  const toggleSaveMutation = useMutation(
    trpc.listings.toggleSave.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["trpc", "listings", "getById"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["trpc", "listings", "savedListings"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["trpc", "listings", "list"],
          }),
        ]);
      },
    }),
  );

  const listing = detailQuery.data;

  const handleSave = useCallback(() => {
    if (!id) return;
    toggleSaveMutation.mutate({ listingId: id });
  }, [id, toggleSaveMutation]);

  const handleContact = useCallback(() => {
    if (!listing?.id || !listing.lister?.id) return;
    router.push(
      messageThreadRoute(encodeMessageThreadId(listing.id, listing.lister.id)),
    );
  }, [listing?.id, listing?.lister?.id]);

  if (detailQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loading}>
          <ActivityIndicator color="#0B2D23" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (detailQuery.error || !listing) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loading}>
          <Text style={styles.errorText}>
            {detailQuery.error?.message ?? "Listing not found."}
          </Text>
          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const photos =
    listing.photos.length > 0 ? listing.photos : [{ url: COVER_FALLBACK }];
  const specs = [
    listing.propertyType.replaceAll("_", " "),
    ...(listing.maxOccupants ? [`${listing.maxOccupants} occupants`] : []),
    ...(listing.sizeSqm ? [`${listing.sizeSqm} sqm`] : []),
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.floatingHeader}>
        <Pressable
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.iconBtn}
        >
          <Ionicons color="#1A1A1A" name="chevron-back" size={22} />
        </Pressable>
        {role === "finder" ? (
          <Pressable
            disabled={toggleSaveMutation.isPending}
            hitSlop={8}
            onPress={handleSave}
            style={styles.iconBtn}
          >
            <Ionicons
              color={listing.isSaved ? "#0B2D23" : "#A09A90"}
              name={listing.isSaved ? "bookmark" : "bookmark-outline"}
              size={22}
            />
          </Pressable>
        ) : listing.isOwner ? (
          <Pressable
            hitSlop={8}
            onPress={() => router.push(listingEditRoute(listing.id))}
            style={styles.iconBtn}
          >
            <Ionicons color="#1A1A1A" name="create-outline" size={22} />
          </Pressable>
        ) : (
          <View style={styles.iconSpacer} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            setPhotoIndex(
              Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH),
            );
          }}
        >
          {photos.map((photo) => (
            <Image
              key={photo.url}
              contentFit="cover"
              source={{ uri: photo.url }}
              style={{ width: SCREEN_WIDTH, height: 260 }}
              transition={200}
            />
          ))}
        </ScrollView>
        {photos.length > 1 ? (
          <View style={styles.dotRow}>
            {photos.map((_, index) => (
              <View
                key={`${photos[index]?.url ?? "dot"}-${index}`}
                style={[styles.dot, index === photoIndex && styles.dotActive]}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.body}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {formatCurrency(listing.pricePerMonth)}
            </Text>
            <Text style={styles.priceSuffix}>/month</Text>
          </View>
          <Text style={styles.titleText}>{listing.title}</Text>
          <Text style={styles.locationText}>
            {listing.barangay ? `${listing.barangay}, ` : ""}
            {listing.city}
          </Text>

          <View style={styles.ratingRow}>
            <Ionicons color="#f59e0b" name="star" size={14} />
            <Text style={styles.ratingVal}>
              {listing.ratingOverall ? listing.ratingOverall.toFixed(1) : "New"}
            </Text>
            <Text style={styles.reviewCount}>
              ({listing.reviewCount}{" "}
              {listing.reviewCount === 1 ? "review" : "reviews"})
            </Text>
          </View>

          <View style={styles.specRow}>
            {specs.map((spec) => (
              <SpecPill key={spec} label={spec} />
            ))}
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>About this place</Text>
          <Text style={styles.descriptionText}>{listing.description}</Text>

          {listing.amenities.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesRow}>
                {listing.amenities.map((amenity) => (
                  <AmenityChip key={amenity} label={amenity} />
                ))}
              </View>
            </>
          ) : null}

          <View style={styles.divider} />

          {listing.lister ? (
            <>
              <Text style={styles.sectionTitle}>Hosted by</Text>
              <View style={styles.listerRow}>
                <View style={styles.listerAvatar}>
                  {listing.lister.avatarUrl ? (
                    <Image
                      contentFit="cover"
                      source={{ uri: listing.lister.avatarUrl }}
                      style={styles.listerAvatarImg}
                    />
                  ) : (
                    <View style={styles.listerAvatarFallback}>
                      <Text style={styles.listerAvatarInitial}>
                        {listing.lister.displayName[0]?.toUpperCase() ?? "L"}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.listerName}>
                  {listing.lister.displayName}
                </Text>
              </View>
            </>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons color="#A09A90" name="eye-outline" size={16} />
              <Text style={styles.statLabel}>{listing.viewCount} views</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons color="#A09A90" name="bookmark-outline" size={16} />
              <Text style={styles.statLabel}>
                {listing.bookmarkCount} saves
              </Text>
            </View>
          </View>

          {role === "finder" && !listing.isOwner ? (
            <Pressable onPress={handleContact} style={styles.ctaBtn}>
              <Text style={styles.ctaBtnText}>Contact lister</Text>
            </Pressable>
          ) : null}

          {listing.isOwner ? (
            <View style={styles.ownerBanner}>
              <Text style={styles.ownerBannerText}>
                This is your listing. Edit it any time from here or My Listings.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F5" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  errorText: { color: "#1A1A1A", fontSize: 16, fontWeight: "700" },
  backLink: { paddingVertical: 8 },
  backLinkText: { color: "#0B2D23", fontSize: 14, fontWeight: "700" },
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,253,249,0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  iconSpacer: { width: 38, height: 38 },
  dotRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D0CAC0",
  },
  dotActive: { backgroundColor: "#0B2D23", width: 14 },
  body: { padding: 20 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  price: { color: "#0B2D23", fontSize: 28, fontWeight: "800" },
  priceSuffix: { color: "#706A5F", fontSize: 14 },
  titleText: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 6,
  },
  locationText: { color: "#706A5F", fontSize: 14, marginTop: 4 },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  ratingVal: { color: "#1A1A1A", fontSize: 14, fontWeight: "700" },
  reviewCount: { color: "#A09A90", fontSize: 13 },
  specRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  specPill: {
    borderRadius: 999,
    backgroundColor: "#EEF5F1",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  specPillText: {
    color: "#0B2D23",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  divider: { height: 1, backgroundColor: "#EAE5DE", marginVertical: 20 },
  sectionTitle: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
  },
  descriptionText: { color: "#475569", fontSize: 14, lineHeight: 22 },
  amenitiesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenityChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d9d1c6",
    backgroundColor: "#F7F2E9",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  amenityChipText: {
    color: "#5F5A51",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  listerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  listerAvatar: { width: 44, height: 44, borderRadius: 22, overflow: "hidden" },
  listerAvatarImg: { width: 44, height: 44 },
  listerAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0B2D23",
    alignItems: "center",
    justifyContent: "center",
  },
  listerAvatarInitial: { color: "#ffffff", fontSize: 18, fontWeight: "700" },
  listerName: { color: "#0f172a", fontSize: 15, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 20, marginTop: 16 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  statLabel: { color: "#706A5F", fontSize: 13 },
  ctaBtn: {
    backgroundColor: "#0B2D23",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  ctaBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  ownerBanner: {
    marginTop: 24,
    backgroundColor: "#EEF5F1",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },
  ownerBannerText: { color: "#0B2D23", fontSize: 13, fontWeight: "600" },
});
