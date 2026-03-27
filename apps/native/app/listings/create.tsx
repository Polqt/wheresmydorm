import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Alert } from "react-native";

import { ListingForm } from "@/components/listings/listing-form";
import { parseAmenities } from "@/services/listings";
import { uploadPickedAsset } from "@/services/storage";
import { myListingsRoute } from "@/utils/routes";
import { trpc } from "@/utils/api-client";

export default function CreateListingScreen() {
  const queryClient = useQueryClient();

  const createMutation = useMutation(
    trpc.listings.create.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: ["trpc", "listings", "myListings"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["trpc", "listings", "list"],
        });
        Alert.alert("Listing created", "It is now live for finders.", [
          {
            text: "OK",
            onPress: () => router.replace(myListingsRoute()),
          },
        ]);
      },
    }),
  );

  return (
    <ListingForm
      errorMessage={createMutation.error?.message ?? null}
      isSubmitting={createMutation.isPending}
      mode="create"
      onCancel={() => router.back()}
      onSubmit={async ({ assets, values }) => {
        const photoUrls = await Promise.all(
          assets.map((asset) => uploadPickedAsset("listing-photos", asset)),
        );

        await createMutation.mutateAsync({
          address: values.address.trim() || values.city.trim() || "Bacolod",
          amenities: parseAmenities(values.amenities),
          barangay: values.barangay.trim() || undefined,
          city: values.city.trim() || "Bacolod",
          description: values.description.trim(),
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
