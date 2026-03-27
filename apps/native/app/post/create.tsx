import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { refreshPostQueries } from "@/lib/post-query";
import { ScreenHeader } from "@/components/ui/screen-header";
import { getDiscoveryQueryInput } from "@/services/listings";
import {
  extractHashtags,
  mergeHashtags,
  parseHashtagInput,
} from "@/services/posts";
import { uploadPickedAsset } from "@/services/storage";
import { trpc } from "@/utils/api-client";

export default function CreatePostScreen() {
  const { listingId } = useLocalSearchParams<{ listingId?: string }>();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [selectedListingId, setSelectedListingId] = useState<
    string | undefined
  >();
  const [assets, setAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const nearbyListings = useQuery(
    trpc.listings.list.queryOptions(
      getDiscoveryQueryInput({
        amenities: [],
        propertyTypes: [],
      }),
    ),
  );
  const createPost = useMutation(
    trpc.posts.create.mutationOptions({
      onSuccess: async () => {
        await refreshPostQueries(queryClient);
        router.replace("/(tabs)/feed");
      },
    }),
  );

  const hashtags = useMemo(
    () => mergeHashtags(extractHashtags(body), parseHashtagInput(hashtagInput)),
    [body, hashtagInput],
  );

  useEffect(() => {
    if (typeof listingId === "string" && listingId.length > 0) {
      setSelectedListingId(listingId);
    }
  }, [listingId]);

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
    if (createPost.isPending) {
      return;
    }

    if (!body.trim()) {
      setErrorMessage("Write something before posting.");
      return;
    }

    try {
      setErrorMessage(null);
      const uploadedMediaUrls = await Promise.all(
        assets.map((asset) => uploadPickedAsset("post-media", asset)),
      );

      await createPost.mutateAsync({
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
    <SafeAreaView className="flex-1 bg-[#F7F4EE]" edges={["top"]}>
      <ScreenHeader
        subtitle="Share an update with your housing network."
        title="Create post"
        withBackButton
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 110, paddingHorizontal: 20 }}
      >
        <Text className="text-slate-600 text-sm leading-6">
          Share a quick update, a move-in note, or a neighborhood moment. Add
          media, a few discovery tags, then optionally link a nearby listing.
        </Text>

        <View className="mt-5 rounded-[32px] border border-[#E8DFD2] bg-white px-5 py-5 shadow-sm">
          <Text className="font-semibold text-[13px] text-[#8C8478]">
            What do you want to share?
          </Text>
          <TextInput
            className="mt-3 min-h-[180px] text-[18px] leading-7 text-slate-900"
            multiline
            onChangeText={setBody}
            placeholder="A room opened up near campus, the street is quieter at night, or the commute is better than expected..."
            placeholderTextColor="#A8A29A"
            textAlignVertical="top"
            value={body}
          />
        </View>

        <View className="mt-4 flex-row items-center justify-between rounded-[26px] border border-[#E8DFD2] bg-[#FFFDF9] px-4 py-4">
          <View className="flex-1 pr-4">
            <Text className="font-bold text-[14px] text-[#111827]">
              Add photos or video
            </Text>
            <Text className="mt-1 text-[13px] leading-5 text-[#706A5F]">
              Give the feed a real sense of place with up to four attachments.
            </Text>
          </View>
          <Pressable
            className="rounded-full bg-[#111827] px-4 py-3"
            onPress={handlePickMedia}
          >
            <Text className="text-center font-extrabold text-[11px] text-white uppercase tracking-[1.2px]">
              Add media
            </Text>
          </Pressable>
        </View>

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
                      style={{ borderRadius: 24, height: 128, width: 128 }}
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

        <View className="mt-6 rounded-[28px] border border-[#E8DFD2] bg-white px-5 py-5">
          <Text className="font-extrabold text-brand-teal text-xs uppercase tracking-[1.2px]">
            Discovery tags
          </Text>
          <Text className="mt-2 text-[13px] leading-5 text-[#706A5F]">
            Add tags like `#BacolodDorms`, `#Under5000`, or `#NearUSLS` to help
            people find your post.
          </Text>
          <TextInput
            className="mt-4 rounded-[20px] bg-[#F7F4EE] px-4 py-4 text-[15px] text-slate-900"
            onChangeText={setHashtagInput}
            placeholder="#BacolodDorms #NearCampus"
            placeholderTextColor="#A8A29A"
            value={hashtagInput}
          />
          <View className="mt-3 flex-row flex-wrap gap-2">
            {hashtags.length > 0 ? (
              hashtags.map((tag) => (
                <View
                  key={tag}
                  className="rounded-full bg-[#EEF5F1] px-3 py-2"
                >
                  <Text className="text-[12px] font-bold text-[#0B2D23]">
                    #{tag}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-[13px] text-[#8C8478]">
                Tags from your post text and this field will be combined.
              </Text>
            )}
          </View>
        </View>

        <View className="mt-6 rounded-[28px] bg-white px-5 py-5">
          <Text className="font-extrabold text-brand-teal text-xs uppercase tracking-[1.2px]">
            Link a listing
          </Text>
          <Text className="mt-2 text-[13px] leading-5 text-[#706A5F]">
            Optional, but helpful if your update is about a specific place.
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
    </SafeAreaView>
  );
}
