import { useMutation, useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { haptics } from "@/services/haptics";
import { getNearbyListings } from "@/services/listings";
import { uploadPickedAsset } from "@/services/storage";
import { trpc } from "@/utils/trpc";

const listingSeedCoordinates = {
  filters: {
    amenities: [],
    distanceMeters: 3000,
    propertyTypes: [],
  },
  lat: 10.6765,
  lng: 122.9511,
};

function extractHashtags(body: string) {
  return [
    ...new Set(
      (body.match(/#([\p{L}\p{N}_]+)/gu) ?? []).map((value) =>
        value.slice(1).toLowerCase(),
      ),
    ),
  ];
}

export default function CreatePostScreen() {
  const [body, setBody] = useState("");
  const [selectedListingId, setSelectedListingId] = useState<
    string | undefined
  >();
  const [assets, setAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const nearbyListings = useQuery({
    queryFn: () => getNearbyListings(listingSeedCoordinates),
    queryKey: ["nearby-listings", listingSeedCoordinates],
  });
  const createPost = useMutation(
    trpc.posts.create.mutationOptions({
      onSuccess: () => {
        haptics.success();
        router.back();
      },
    }),
  );

  const hashtags = useMemo(() => extractHashtags(body), [body]);

  const handlePickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      setErrorMessage(
        "Media library permission is required to attach photos or video.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ["images", "videos"],
      quality: 0.8,
      selectionLimit: 4,
    });

    if (!result.canceled) {
      setAssets(result.assets);
      setErrorMessage(null);
    }
  };

  const handleSubmit = async () => {
    if (!body.trim()) {
      setErrorMessage("Write something before posting.");
      return;
    }

    try {
      setErrorMessage(null);
      const uploadedMediaUrls = await Promise.all(
        assets.map((asset) => uploadPickedAsset("post-media", asset)),
      );

      createPost.mutate({
        body: body.trim(),
        hashtags,
        listingId: selectedListingId,
        mediaUrls: uploadedMediaUrls,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to publish post.",
      );
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-[#fff7ed]"
      contentContainerStyle={{ padding: 20 }}
    >
      <Text className="font-extrabold text-brand-teal text-xs uppercase tracking-[1.6px]">
        Create post
      </Text>
      <Text className="mt-2 font-black text-3xl text-slate-900">
        Share an update with your housing network
      </Text>
      <Text className="mt-3 text-slate-600 text-sm leading-6">
        Add context, optional media, and an optional listing tag so your post is
        discoverable in the feed.
      </Text>

      <TextInput
        className="mt-6 min-h-[180px] rounded-[28px] border border-stone-200 bg-white px-5 py-5 text-base text-slate-900"
        multiline
        onChangeText={setBody}
        placeholder="What should followers know about this place, your move-in, or the neighborhood?"
        placeholderTextColor="#94a3b8"
        textAlignVertical="top"
        value={body}
      />

      <Pressable
        className="mt-4 rounded-full bg-brand-teal px-4 py-4"
        onPress={handlePickMedia}
      >
        <Text className="text-center font-extrabold text-white text-xs uppercase tracking-[1.2px]">
          Attach photo or video
        </Text>
      </Pressable>

      {assets.length ? (
        <ScrollView
          className="mt-4"
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <View className="flex-row gap-3">
            {assets.map((asset) => (
              <View key={asset.assetId ?? asset.uri} className="w-32">
                {asset.type === "image" ? (
                  <Image
                    contentFit="cover"
                    source={asset.uri}
                    style={{ height: 128, width: 128, borderRadius: 24 }}
                  />
                ) : (
                  <View className="h-32 w-32 items-center justify-center rounded-[24px] bg-slate-900 px-4">
                    <Text className="text-center font-bold text-white text-xs uppercase tracking-[1px]">
                      Video attached
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      ) : null}

      <View className="mt-6 rounded-[28px] bg-white px-5 py-5">
        <Text className="font-extrabold text-brand-teal text-xs uppercase tracking-[1.2px]">
          Suggested listing tag
        </Text>
        <View className="mt-4 gap-3">
          {(nearbyListings.data ?? []).slice(0, 4).map((listing) => (
            <Pressable
              key={listing.id}
              className={`rounded-[22px] border px-4 py-4 ${
                selectedListingId === listing.id
                  ? "border-brand-orange bg-orange-50"
                  : "border-stone-200 bg-stone-50"
              }`}
              onPress={() =>
                setSelectedListingId((current) =>
                  current === listing.id ? undefined : listing.id,
                )
              }
            >
              <Text className="font-bold text-slate-900 text-sm">
                {listing.title}
              </Text>
              <Text className="mt-1 text-slate-500 text-xs">
                {listing.city}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="mt-6 rounded-[28px] bg-white px-5 py-5">
        <Text className="font-extrabold text-brand-teal text-xs uppercase tracking-[1.2px]">
          Hashtags
        </Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {hashtags.length ? (
            hashtags.map((hashtag) => (
              <Text
                key={hashtag}
                className="rounded-full bg-orange-50 px-3 py-2 font-semibold text-orange-700 text-xs"
              >
                #{hashtag}
              </Text>
            ))
          ) : (
            <Text className="text-slate-500 text-sm">
              Hashtags are extracted automatically from your text.
            </Text>
          )}
        </View>
      </View>

      {errorMessage ? (
        <Text className="mt-4 font-medium text-red-600 text-sm">
          {errorMessage}
        </Text>
      ) : null}

      <View className="mt-6 flex-row gap-3">
        <Pressable
          className="flex-1 rounded-full border border-stone-300 px-4 py-4"
          onPress={() => router.back()}
        >
          <Text className="text-center font-extrabold text-slate-700 text-xs uppercase tracking-[1.2px]">
            Cancel
          </Text>
        </Pressable>
        <Pressable
          className="flex-1 rounded-full bg-brand-orange px-4 py-4"
          onPress={handleSubmit}
        >
          <Text className="text-center font-extrabold text-white text-xs uppercase tracking-[1.2px]">
            {createPost.isPending ? "Publishing..." : "Publish post"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
