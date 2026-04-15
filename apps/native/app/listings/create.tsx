import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Alert } from "react-native";

import { ListingForm } from "@/components/listings/listing-form";
import { parseAmenities } from "@/services/listings";
import { uploadPickedAsset } from "@/services/storage";
import { trpc } from "@/utils/api-client";
import { myListingsRoute } from "@/utils/routes";

export default function CreateListingScreen() {
  const queryClient = useQueryClient();

  const createMutation = useMutation(
    trpc.listings.create.mutationOptions({
      onSuccess: (listing) => {
        void queryClient.invalidateQueries({
          queryKey: ["trpc", "listings", "myListings"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["trpc", "listings", "list"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["trpc", "listings", "listerQuotaStatus"],
        });
        Alert.alert(
          "Listing created",
          listing.status === "paused"
            ? "This listing used a paid slot and stays paused until the listing fee is paid."
            : "It is now live for finders.",
          [
            {
              text: "OK",
              onPress: () => router.replace(myListingsRoute()),
            },
          ],
        );
      },
    }),
  );

  return (
    <ListingForm
      errorMessage={
        createMutation.isError
          ? "Something went wrong while saving. Please try again."
          : null
      }
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
