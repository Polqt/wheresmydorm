import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";

import { ListingForm } from "@/components/listings/listing-form";
import { parseAmenities } from "@/services/listings";
import { uploadPickedAsset } from "@/services/storage";
import { myListingsRoute } from "@/utils/routes";
import { trpc } from "@/utils/trpc";

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const listingQuery = useQuery(
    trpc.listings.getById.queryOptions(
      { id: id ?? "" },
      { enabled: Boolean(id) },
    ),
  );

  const updateMutation = useMutation(
    trpc.listings.update.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["trpc", "listings", "getById"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["trpc", "listings", "myListings"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["trpc", "listings", "list"],
          }),
        ]);
        Alert.alert("Listing updated", "Your changes are live.", [
          {
            text: "OK",
            onPress: () => router.replace(myListingsRoute()),
          },
        ]);
      },
    }),
  );

  if (listingQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#FAF8F5]">
        <ActivityIndicator color="#0B2D23" size="large" />
      </View>
    );
  }

  if (!listingQuery.data) {
    return (
      <View className="flex-1 items-center justify-center bg-[#FAF8F5] px-6">
        <Text className="text-center font-bold text-base text-slate-900">
          {listingQuery.error?.message ?? "Listing not found."}
        </Text>
        <Pressable
          className="mt-4 rounded-full bg-[#0B2D23] px-5 py-3"
          onPress={() => router.back()}
        >
          <Text className="font-bold text-white">Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (!listingQuery.data.isOwner) {
    return (
      <View className="flex-1 items-center justify-center bg-[#FAF8F5] px-6">
        <Text className="text-center font-bold text-base text-slate-900">
          Only the listing owner can edit this post.
        </Text>
        <Pressable
          className="mt-4 rounded-full bg-[#0B2D23] px-5 py-3"
          onPress={() => router.back()}
        >
          <Text className="font-bold text-white">Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ListingForm
      errorMessage={updateMutation.error?.message ?? null}
      initialListing={listingQuery.data}
      isSubmitting={updateMutation.isPending}
      mode="edit"
      onCancel={() => router.back()}
      onSubmit={async ({ assets, values }) => {
        const photoUrls =
          assets.length > 0
            ? await Promise.all(
                assets.map((asset) =>
                  uploadPickedAsset("listing-photos", asset),
                ),
              )
            : undefined;

        await updateMutation.mutateAsync({
          address: values.address.trim() || values.city.trim() || "Bacolod",
          amenities: parseAmenities(values.amenities),
          barangay: values.barangay.trim() || undefined,
          city: values.city.trim() || "Bacolod",
          description: values.description.trim(),
          id: listingQuery.data.id,
          lat: Number(values.lat),
          lng: Number(values.lng),
          maxOccupants: values.maxOccupants
            ? Number(values.maxOccupants)
            : undefined,
          photoUrls,
          pricePerMonth: Number(values.pricePerMonth),
          propertyType: values.propertyType,
          sizeSqm: values.sizeSqm ? Number(values.sizeSqm) : undefined,
          title: values.title.trim(),
        });
      }}
    />
  );
}
