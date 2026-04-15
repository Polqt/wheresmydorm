import Ionicons from "@expo/vector-icons/Ionicons";
import { FlashList } from "@shopify/flash-list";
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

const STEPS = ["Photos & Info", "Location", "Amenities"] as const;
type Step = 0 | 1 | 2;

function StepIndicator({ current, total }: { current: Step; total: number }) {
  return (
    <View className="flex-row items-center gap-2 px-5 pt-2 pb-4">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className={`h-1.5 flex-1 rounded-full ${
            i <= current ? "bg-brand-orange" : "bg-[#E8E3DC]"
          }`}
        />
      ))}
    </View>
  );
}

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
    <View className="mb-5">
      <Text className="mb-2 font-bold text-[#1A1A1A] text-[13px]">
        {label}
        {required ? <Text className="text-red-500"> *</Text> : null}
      </Text>
      {children}
    </View>
  );
}

const INPUT_CLASS =
  "rounded-2xl border border-[#EAE5DE] bg-white px-4 py-3.5 text-[14px] text-[#0F172A]";

export function ListingForm({
  errorMessage,
  initialListing,
  isSubmitting,
  mode,
  onCancel,
  onSubmit,
}: ListingFormProps) {
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<ListingFormValues>(
    createListingFormValues(initialListing),
  );
  const [assets, setAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setForm(createListingFormValues(initialListing));
  }, [initialListing]);

  const photoPreviewUrls = useMemo(() => {
    if (assets.length > 0) return assets.map((a) => a.uri);
    return initialListing?.photos.map((p) => p.url) ?? [];
  }, [assets, initialListing?.photos]);

  const update = useCallback(
    <K extends keyof ListingFormValues>(
      key: K,
      value: ListingFormValues[K],
    ) => {
      setForm((prev) => ({ ...prev, [key]: value }));
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
    setForm((prev) => ({
      ...prev,
      lat: String(position.coords.latitude),
      lng: String(position.coords.longitude),
    }));
    setLocalError(null);
  }, []);

  const validateStep = useCallback(
    (s: Step): string | null => {
      if (s === 0) {
        if (!form.title.trim()) return "Title is required.";
        if (!form.description.trim()) return "Description is required.";
        if (!form.pricePerMonth.trim()) return "Monthly rent is required.";
        const price = Number(form.pricePerMonth);
        if (Number.isNaN(price) || price <= 0)
          return "Enter a valid monthly rent.";
      }
      if (s === 1) {
        const lat = Number(form.lat);
        const lng = Number(form.lng);
        if (Number.isNaN(lat) || Number.isNaN(lng))
          return "Enter valid map coordinates.";
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
          return "Coordinates are out of range.";
        if (!form.city.trim()) return "City is required.";
      }
      return null;
    },
    [form],
  );

  const handleNext = useCallback(() => {
    const error = validateStep(step);
    if (error) {
      setLocalError(error);
      return;
    }
    setLocalError(null);
    setStep((prev) => (prev < 2 ? ((prev + 1) as Step) : prev));
  }, [step, validateStep]);

  const handleBack = useCallback(() => {
    setLocalError(null);
    if (step > 0) {
      setStep((prev) => (prev - 1) as Step);
    } else {
      onCancel();
    }
  }, [onCancel, step]);

  const handleSubmit = useCallback(async () => {
    const error = validateStep(2);
    if (error) {
      setLocalError(error);
      return;
    }
    setLocalError(null);
    await onSubmit({ assets, values: form });
  }, [assets, form, onSubmit, validateStep]);

  const stepTitle = STEPS[step];
  const isLastStep = step === 2;

  return (
    <SafeAreaView className="flex-1 bg-[#FAF8F5]" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-2">
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full bg-[#F5F0EA]"
            hitSlop={8}
            onPress={handleBack}
          >
            <Ionicons color="#1A1A1A" name="chevron-back" size={22} />
          </Pressable>
          <View className="flex-1">
            <Text className="font-bold text-[#9A9388] text-[11px] uppercase tracking-[1px]">
              {mode === "create" ? "New listing" : "Edit listing"} · Step{" "}
              {step + 1} of 3
            </Text>
            <Text className="font-extrabold text-[#0F172A] text-[18px]">
              {stepTitle}
            </Text>
          </View>
        </View>

        <StepIndicator current={step} total={3} />

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-5 pb-10">
            {/* ── STEP 0: Photos & Basic Info ── */}
            {step === 0 ? (
              <>
                <FormField label="Photos">
                  <Pressable
                    className="flex-row items-center gap-3 rounded-2xl border border-[#D0C9C0] border-dashed bg-white px-4 py-4"
                    onPress={handlePickPhotos}
                  >
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#F5F0E8]">
                      <Ionicons
                        color="#706A5F"
                        name="camera-outline"
                        size={20}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-[#1A1A1A] text-[14px]">
                        {assets.length > 0
                          ? `${assets.length} photo${assets.length > 1 ? "s" : ""} selected`
                          : photoPreviewUrls.length > 0
                            ? `${photoPreviewUrls.length} current photo${photoPreviewUrls.length > 1 ? "s" : ""}`
                            : "Add up to 10 photos"}
                      </Text>
                      <Text className="text-[#9A9388] text-[12px]">
                        Tap to choose from library
                      </Text>
                    </View>
                    <Ionicons
                      color="#C0B8B0"
                      name="chevron-forward"
                      size={18}
                    />
                  </Pressable>

                  {photoPreviewUrls.length > 0 ? (
                    <View className="mt-3">
                      <FlashList
                        data={photoPreviewUrls}
                        horizontal
                        keyExtractor={(uri) => uri}
                        renderItem={({ item: uri }) => (
                          <Image
                            className="mr-2.5 h-24 w-24 rounded-2xl"
                            contentFit="cover"
                            source={{ uri }}
                          />
                        )}
                        showsHorizontalScrollIndicator={false}
                      />
                    </View>
                  ) : null}
                </FormField>

                <FormField label="Title" required>
                  <TextInput
                    className={INPUT_CLASS}
                    onChangeText={(v) => update("title", v)}
                    placeholder="e.g. Cozy 2-bed dorm near USLS"
                    placeholderTextColor="#A09A90"
                    value={form.title}
                  />
                </FormField>

                <FormField label="Description" required>
                  <TextInput
                    className={`${INPUT_CLASS} min-h-[100px] pt-3.5`}
                    multiline
                    numberOfLines={4}
                    onChangeText={(v) => update("description", v)}
                    placeholder="Describe the place, rules, and what is included."
                    placeholderTextColor="#A09A90"
                    textAlignVertical="top"
                    value={form.description}
                  />
                </FormField>

                <FormField label="Property type" required>
                  <View className="flex-row flex-wrap gap-2">
                    {LISTING_PROPERTY_TYPES.map((pt) => (
                      <Pressable
                        key={pt.value}
                        className={`rounded-full border px-4 py-2 ${
                          form.propertyType === pt.value
                            ? "border-brand-orange bg-brand-orange"
                            : "border-[#EAE5DE] bg-white"
                        }`}
                        onPress={() => update("propertyType", pt.value)}
                      >
                        <Text
                          className={`font-semibold text-[13px] ${
                            form.propertyType === pt.value
                              ? "text-white"
                              : "text-[#706A5F]"
                          }`}
                        >
                          {pt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </FormField>

                <FormField label="Monthly rent (PHP)" required>
                  <TextInput
                    className={INPUT_CLASS}
                    keyboardType="numeric"
                    onChangeText={(v) => update("pricePerMonth", v)}
                    placeholder="e.g. 3500"
                    placeholderTextColor="#A09A90"
                    value={form.pricePerMonth}
                  />
                </FormField>

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <FormField label="Max occupants">
                      <TextInput
                        className={INPUT_CLASS}
                        keyboardType="numeric"
                        onChangeText={(v) => update("maxOccupants", v)}
                        placeholder="e.g. 2"
                        placeholderTextColor="#A09A90"
                        value={form.maxOccupants}
                      />
                    </FormField>
                  </View>
                  <View className="flex-1">
                    <FormField label="Size (sqm)">
                      <TextInput
                        className={INPUT_CLASS}
                        keyboardType="numeric"
                        onChangeText={(v) => update("sizeSqm", v)}
                        placeholder="e.g. 18"
                        placeholderTextColor="#A09A90"
                        value={form.sizeSqm}
                      />
                    </FormField>
                  </View>
                </View>
              </>
            ) : null}

            {/* ── STEP 1: Location ── */}
            {step === 1 ? (
              <>
                <FormField label="Map pin" required>
                  <Pressable
                    className="mb-3 flex-row items-center gap-2 self-start rounded-full bg-[#EEF5F1] px-4 py-2.5"
                    onPress={() => void handleUseCurrentLocation()}
                  >
                    <Ionicons color="#0B2D23" name="locate-outline" size={16} />
                    <Text className="font-bold text-[#0B2D23] text-[13px]">
                      Use current location
                    </Text>
                  </Pressable>
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <TextInput
                        className={INPUT_CLASS}
                        keyboardType="numeric"
                        onChangeText={(v) => update("lat", v)}
                        placeholder="Latitude"
                        placeholderTextColor="#A09A90"
                        value={form.lat}
                      />
                    </View>
                    <View className="flex-1">
                      <TextInput
                        className={INPUT_CLASS}
                        keyboardType="numeric"
                        onChangeText={(v) => update("lng", v)}
                        placeholder="Longitude"
                        placeholderTextColor="#A09A90"
                        value={form.lng}
                      />
                    </View>
                  </View>
                  {form.lat && form.lng ? (
                    <View className="mt-2 flex-row items-center gap-1.5">
                      <Ionicons
                        color="#0B4A30"
                        name="checkmark-circle"
                        size={14}
                      />
                      <Text className="font-semibold text-[#0B4A30] text-[12px]">
                        Pin set at {Number(form.lat).toFixed(5)},{" "}
                        {Number(form.lng).toFixed(5)}
                      </Text>
                    </View>
                  ) : null}
                </FormField>

                <FormField label="City" required>
                  <TextInput
                    className={INPUT_CLASS}
                    onChangeText={(v) => update("city", v)}
                    placeholder="e.g. Bacolod"
                    placeholderTextColor="#A09A90"
                    value={form.city}
                  />
                </FormField>

                <FormField label="Barangay">
                  <TextInput
                    className={INPUT_CLASS}
                    onChangeText={(v) => update("barangay", v)}
                    placeholder="e.g. Mandalagan"
                    placeholderTextColor="#A09A90"
                    value={form.barangay}
                  />
                </FormField>

                <FormField label="Street address">
                  <TextInput
                    className={INPUT_CLASS}
                    onChangeText={(v) => update("address", v)}
                    placeholder="Street or landmark"
                    placeholderTextColor="#A09A90"
                    value={form.address}
                  />
                </FormField>
              </>
            ) : null}

            {/* ── STEP 2: Amenities + Review ── */}
            {step === 2 ? (
              <>
                <FormField label="Amenities">
                  <TextInput
                    className={INPUT_CLASS}
                    onChangeText={(v) => update("amenities", v)}
                    placeholder="wifi, ac, parking, laundry"
                    placeholderTextColor="#A09A90"
                    value={form.amenities}
                  />
                  <Text className="mt-1.5 text-[#9A9388] text-[12px]">
                    Separate with commas. Free finders can filter by amenity.
                  </Text>
                </FormField>

                {/* Review summary */}
                <View className="mt-2 rounded-3xl bg-white px-4 py-4">
                  <Text className="font-extrabold text-[#0B4A30] text-[12px] uppercase tracking-[0.8px]">
                    Review
                  </Text>
                  <View className="mt-3 gap-2">
                    <ReviewRow label="Title" value={form.title || "—"} />
                    <ReviewRow
                      label="Type"
                      value={form.propertyType.replaceAll("_", " ")}
                    />
                    <ReviewRow
                      label="Rent"
                      value={
                        form.pricePerMonth
                          ? `₱${Number(form.pricePerMonth).toLocaleString()}/mo`
                          : "—"
                      }
                    />
                    <ReviewRow
                      label="Location"
                      value={
                        [form.city, form.barangay].filter(Boolean).join(", ") ||
                        "—"
                      }
                    />
                    <ReviewRow
                      label="Photos"
                      value={
                        photoPreviewUrls.length > 0
                          ? `${photoPreviewUrls.length} photo${photoPreviewUrls.length > 1 ? "s" : ""}`
                          : "None"
                      }
                    />
                  </View>
                </View>
              </>
            ) : null}

            {/* Error */}
            {localError || errorMessage ? (
              <View className="mt-4 rounded-2xl bg-red-50 px-4 py-3">
                <Text className="font-semibold text-[13px] text-red-700">
                  {localError ?? errorMessage}
                </Text>
              </View>
            ) : null}
          </View>
        </ScrollView>

        {/* Bottom CTA */}
        <View className="border-[#EAE5DE] border-t bg-[#FAF8F5] px-5 pt-4 pb-6">
          {isLastStep ? (
            <Pressable
              className={`h-[52px] w-full items-center justify-center rounded-2xl ${
                isSubmitting ? "bg-brand-orange opacity-60" : "bg-brand-orange"
              }`}
              disabled={isSubmitting}
              onPress={() => void handleSubmit()}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text className="font-bold text-[15px] text-white">
                  {mode === "create" ? "Publish listing" : "Save changes"}
                </Text>
              )}
            </Pressable>
          ) : (
            <Pressable
              className="h-[52px] w-full items-center justify-center rounded-2xl bg-brand-orange"
              onPress={handleNext}
            >
              <Text className="font-bold text-[15px] text-white">Continue</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <Text className="text-[#9A9388] text-[13px]">{label}</Text>
      <Text
        className="flex-1 text-right font-semibold text-[#1A1A1A] text-[13px]"
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}
