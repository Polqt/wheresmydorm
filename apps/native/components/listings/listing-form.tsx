import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  createListingFormValues,
  LISTING_PROPERTY_TYPES,
} from "@/services/listings";
import type { ListingDetail, ListingFormValues } from "@/types/listings";

type ListingFormSubmitPayload = {
  assets: ImagePicker.ImagePickerAsset[];
  values: ListingFormValues;
};

type ListingFormProps = {
  errorMessage?: string | null;
  initialListing?: ListingDetail;
  isSubmitting: boolean;
  mode: "create" | "edit";
  onCancel: () => void;
  onSubmit: (payload: ListingFormSubmitPayload) => Promise<void> | void;
};

function FormField({
  children,
  label,
  required,
}: {
  children: ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-[13px] font-bold text-[#1A1A1A]">
        {label}
        {required ? <Text className="text-red-500"> *</Text> : null}
      </Text>
      {children}
    </View>
  );
}

const INPUT_CLASS_NAME =
  "rounded-[14px] border border-[#EAE5DE] bg-white px-[14px] py-3 text-[14px] text-[#0F172A]";

export function ListingForm({
  errorMessage,
  initialListing,
  isSubmitting,
  mode,
  onCancel,
  onSubmit,
}: ListingFormProps) {
  const [form, setForm] = useState<ListingFormValues>(
    createListingFormValues(initialListing),
  );
  const [assets, setAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setForm(createListingFormValues(initialListing));
  }, [initialListing]);

  const photoPreviewUrls = useMemo(() => {
    if (assets.length > 0) {
      return assets.map((asset) => asset.uri);
    }

    return initialListing?.photos.map((photo) => photo.url) ?? [];
  }, [assets, initialListing?.photos]);

  const update = useCallback(
    <K extends keyof ListingFormValues>(
      key: K,
      value: ListingFormValues[K],
    ) => {
      setForm((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const handlePickPhotos = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      setLocalError("Photo library permission is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ["images"],
      quality: 0.8,
      selectionLimit: 10,
    });

    if (!result.canceled) {
      setAssets(result.assets);
      setLocalError(null);
    }
  }, []);

  const handleUseCurrentLocation = useCallback(async () => {
    const permission = await Location.requestForegroundPermissionsAsync();

    if (permission.status !== "granted") {
      setLocalError("Location permission is required to drop a pin.");
      return;
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    setForm((current) => ({
      ...current,
      lat: String(position.coords.latitude),
      lng: String(position.coords.longitude),
    }));
    setLocalError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.pricePerMonth.trim()
    ) {
      setLocalError("Title, description, and monthly rent are required.");
      return;
    }

    const price = Number(form.pricePerMonth);
    const lat = Number(form.lat);
    const lng = Number(form.lng);

    if (Number.isNaN(price) || price <= 0) {
      setLocalError("Enter a valid monthly rent.");
      return;
    }

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setLocalError("Enter a valid map pin location.");
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setLocalError("Map pin coordinates are out of range.");
      return;
    }

    setLocalError(null);
    await onSubmit({ assets, values: form });
  }, [assets, form, onSubmit]);

  return (
    <SafeAreaView className="flex-1 bg-[#FAF8F5]" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-row items-center gap-3 px-4 pb-3 pt-2">
          <Pressable
            hitSlop={8}
            onPress={onCancel}
            className="h-[38px] w-[38px] items-center justify-center rounded-full bg-[#F5F0EA]"
          >
            <Ionicons color="#1A1A1A" name="chevron-back" size={22} />
          </Pressable>
          <Text className="flex-1 text-[20px] font-extrabold text-[#0F172A]">
            {mode === "create" ? "New Listing" : "Edit Listing"}
          </Text>
          <Pressable
            disabled={isSubmitting}
            onPress={() => void handleSubmit()}
            className={`rounded-[14px] bg-[#0B2D23] px-[18px] py-2 ${
              isSubmitting ? "opacity-50" : ""
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text className="text-[13px] font-extrabold text-white">
                {mode === "create" ? "Publish" : "Save"}
              </Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-1 px-4 pb-10">
          <FormField label="Photos">
            <Pressable
              onPress={handlePickPhotos}
              className="flex-row items-center gap-[10px] rounded-[14px] border border-dashed border-[#EAE5DE] bg-white px-[14px] py-[14px]"
            >
              <Ionicons color="#706A5F" name="camera-outline" size={22} />
              <Text className="text-[14px] text-[#706A5F]">
                {assets.length > 0
                  ? `${assets.length} photo${assets.length > 1 ? "s" : ""} selected`
                  : photoPreviewUrls.length > 0
                    ? `${photoPreviewUrls.length} current photo${
                        photoPreviewUrls.length > 1 ? "s" : ""
                      }`
                    : "Add up to 10 photos"}
              </Text>
            </Pressable>

            {photoPreviewUrls.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="mt-[10px] flex-row gap-2">
                  {photoPreviewUrls.map((uri) => (
                    <Image
                      key={uri}
                      className="h-20 w-20 rounded-[12px]"
                      contentFit="cover"
                      source={{ uri }}
                    />
                  ))}
                </View>
              </ScrollView>
            ) : null}
          </FormField>

          <FormField label="Title" required>
            <TextInput
              className={INPUT_CLASS_NAME}
              onChangeText={(value) => update("title", value)}
              placeholder="e.g. Cozy 2-bed dorm near USLS"
              placeholderTextColor="#A09A90"
              value={form.title}
            />
          </FormField>

          <FormField label="Description" required>
            <TextInput
              className={`${INPUT_CLASS_NAME} min-h-[100px] pt-3`}
              multiline
              numberOfLines={4}
              onChangeText={(value) => update("description", value)}
              placeholder="Describe the place, rules, and what is included."
              placeholderTextColor="#A09A90"
              textAlignVertical="top"
              value={form.description}
            />
          </FormField>

          <FormField label="Property type" required>
            <View className="flex-row flex-wrap gap-2">
              {LISTING_PROPERTY_TYPES.map((propertyType) => (
                <Pressable
                  key={propertyType.value}
                  onPress={() => update("propertyType", propertyType.value)}
                  className={`rounded-full border px-[14px] py-2 ${
                    form.propertyType === propertyType.value
                      ? "border-[#0B2D23] bg-[#0B2D23]"
                      : "border-[#EAE5DE] bg-white"
                  }`}
                >
                  <Text
                    className={`text-[13px] font-semibold ${
                      form.propertyType === propertyType.value
                        ? "text-white"
                        : "text-[#706A5F]"
                    }`}
                  >
                    {propertyType.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </FormField>

          <FormField label="Monthly rent (PHP)" required>
            <TextInput
              className={INPUT_CLASS_NAME}
              keyboardType="numeric"
              onChangeText={(value) => update("pricePerMonth", value)}
              placeholder="e.g. 3500"
              placeholderTextColor="#A09A90"
              value={form.pricePerMonth}
            />
          </FormField>

          <FormField label="Map pin" required>
            <Pressable
              onPress={() => void handleUseCurrentLocation()}
              className="mb-[10px] self-start rounded-full bg-[#EEF5F1] px-3 py-2"
            >
              <View className="flex-row items-center gap-2">
                <Ionicons color="#0B2D23" name="locate-outline" size={18} />
                <Text className="text-[12px] font-bold text-[#0B2D23]">
                  Use current location
                </Text>
              </View>
            </Pressable>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <TextInput
                  className={INPUT_CLASS_NAME}
                  keyboardType="numeric"
                  onChangeText={(value) => update("lat", value)}
                  placeholder="Latitude"
                  placeholderTextColor="#A09A90"
                  value={form.lat}
                />
              </View>
              <View className="flex-1">
                <TextInput
                  className={INPUT_CLASS_NAME}
                  keyboardType="numeric"
                  onChangeText={(value) => update("lng", value)}
                  placeholder="Longitude"
                  placeholderTextColor="#A09A90"
                  value={form.lng}
                />
              </View>
            </View>
          </FormField>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <FormField label="Max occupants">
                <TextInput
                  className={INPUT_CLASS_NAME}
                  keyboardType="numeric"
                  onChangeText={(value) => update("maxOccupants", value)}
                  placeholder="e.g. 2"
                  placeholderTextColor="#A09A90"
                  value={form.maxOccupants}
                />
              </FormField>
            </View>
            <View className="flex-1">
              <FormField label="Size (sqm)">
                <TextInput
                  className={INPUT_CLASS_NAME}
                  keyboardType="numeric"
                  onChangeText={(value) => update("sizeSqm", value)}
                  placeholder="e.g. 18"
                  placeholderTextColor="#A09A90"
                  value={form.sizeSqm}
                />
              </FormField>
            </View>
          </View>

          <FormField label="City" required>
            <TextInput
              className={INPUT_CLASS_NAME}
              onChangeText={(value) => update("city", value)}
              placeholder="e.g. Bacolod"
              placeholderTextColor="#A09A90"
              value={form.city}
            />
          </FormField>

          <FormField label="Barangay">
            <TextInput
              className={INPUT_CLASS_NAME}
              onChangeText={(value) => update("barangay", value)}
              placeholder="e.g. Mandalagan"
              placeholderTextColor="#A09A90"
              value={form.barangay}
            />
          </FormField>

          <FormField label="Address">
            <TextInput
              className={INPUT_CLASS_NAME}
              onChangeText={(value) => update("address", value)}
              placeholder="Street or landmark"
              placeholderTextColor="#A09A90"
              value={form.address}
            />
          </FormField>

          <FormField label="Amenities">
            <TextInput
              className={INPUT_CLASS_NAME}
              onChangeText={(value) => update("amenities", value)}
              placeholder="wifi, ac, parking, laundry"
              placeholderTextColor="#A09A90"
              value={form.amenities}
            />
          </FormField>

          {localError || errorMessage ? (
            <Text className="mb-1 text-[13px] font-semibold text-red-500">
              {localError ?? errorMessage}
            </Text>
          ) : null}

          <Pressable
            disabled={isSubmitting}
            onPress={() => void handleSubmit()}
            className={`mt-2 items-center rounded-[16px] bg-[#0B2D23] py-4 ${
              isSubmitting ? "opacity-50" : ""
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text className="text-[15px] font-extrabold text-white">
                {mode === "create" ? "Publish listing" : "Save changes"}
              </Text>
            )}
          </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
