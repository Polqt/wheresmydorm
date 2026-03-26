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
  StyleSheet,
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
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      {children}
    </View>
  );
}

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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <View style={styles.header}>
          <Pressable hitSlop={8} onPress={onCancel} style={styles.backBtn}>
            <Ionicons color="#1A1A1A" name="chevron-back" size={22} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {mode === "create" ? "New Listing" : "Edit Listing"}
          </Text>
          <Pressable
            disabled={isSubmitting}
            onPress={() => void handleSubmit()}
            style={[styles.saveBtn, isSubmitting && styles.disabled]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>
                {mode === "create" ? "Publish" : "Save"}
              </Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FormField label="Photos">
            <Pressable onPress={handlePickPhotos} style={styles.photoUpload}>
              <Ionicons color="#706A5F" name="camera-outline" size={22} />
              <Text style={styles.photoUploadText}>
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
                <View style={styles.photoRow}>
                  {photoPreviewUrls.map((uri) => (
                    <Image
                      key={uri}
                      contentFit="cover"
                      source={{ uri }}
                      style={styles.photoThumb}
                    />
                  ))}
                </View>
              </ScrollView>
            ) : null}
          </FormField>

          <FormField label="Title" required>
            <TextInput
              onChangeText={(value) => update("title", value)}
              placeholder="e.g. Cozy 2-bed dorm near USLS"
              placeholderTextColor="#A09A90"
              style={styles.input}
              value={form.title}
            />
          </FormField>

          <FormField label="Description" required>
            <TextInput
              multiline
              numberOfLines={4}
              onChangeText={(value) => update("description", value)}
              placeholder="Describe the place, rules, and what is included."
              placeholderTextColor="#A09A90"
              style={[styles.input, styles.textarea]}
              textAlignVertical="top"
              value={form.description}
            />
          </FormField>

          <FormField label="Property type" required>
            <View style={styles.chipRow}>
              {LISTING_PROPERTY_TYPES.map((propertyType) => (
                <Pressable
                  key={propertyType.value}
                  onPress={() => update("propertyType", propertyType.value)}
                  style={[
                    styles.chip,
                    form.propertyType === propertyType.value &&
                      styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      form.propertyType === propertyType.value &&
                        styles.chipTextActive,
                    ]}
                  >
                    {propertyType.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </FormField>

          <FormField label="Monthly rent (PHP)" required>
            <TextInput
              keyboardType="numeric"
              onChangeText={(value) => update("pricePerMonth", value)}
              placeholder="e.g. 3500"
              placeholderTextColor="#A09A90"
              style={styles.input}
              value={form.pricePerMonth}
            />
          </FormField>

          <FormField label="Map pin" required>
            <Pressable
              onPress={() => void handleUseCurrentLocation()}
              style={styles.locationBtn}
            >
              <Ionicons color="#0B2D23" name="locate-outline" size={18} />
              <Text style={styles.locationBtnText}>Use current location</Text>
            </Pressable>
            <View style={styles.row}>
              <View style={styles.flex}>
                <TextInput
                  keyboardType="numeric"
                  onChangeText={(value) => update("lat", value)}
                  placeholder="Latitude"
                  placeholderTextColor="#A09A90"
                  style={styles.input}
                  value={form.lat}
                />
              </View>
              <View style={styles.flex}>
                <TextInput
                  keyboardType="numeric"
                  onChangeText={(value) => update("lng", value)}
                  placeholder="Longitude"
                  placeholderTextColor="#A09A90"
                  style={styles.input}
                  value={form.lng}
                />
              </View>
            </View>
          </FormField>

          <View style={styles.row}>
            <View style={styles.flex}>
              <FormField label="Max occupants">
                <TextInput
                  keyboardType="numeric"
                  onChangeText={(value) => update("maxOccupants", value)}
                  placeholder="e.g. 2"
                  placeholderTextColor="#A09A90"
                  style={styles.input}
                  value={form.maxOccupants}
                />
              </FormField>
            </View>
            <View style={styles.flex}>
              <FormField label="Size (sqm)">
                <TextInput
                  keyboardType="numeric"
                  onChangeText={(value) => update("sizeSqm", value)}
                  placeholder="e.g. 18"
                  placeholderTextColor="#A09A90"
                  style={styles.input}
                  value={form.sizeSqm}
                />
              </FormField>
            </View>
          </View>

          <FormField label="City" required>
            <TextInput
              onChangeText={(value) => update("city", value)}
              placeholder="e.g. Bacolod"
              placeholderTextColor="#A09A90"
              style={styles.input}
              value={form.city}
            />
          </FormField>

          <FormField label="Barangay">
            <TextInput
              onChangeText={(value) => update("barangay", value)}
              placeholder="e.g. Mandalagan"
              placeholderTextColor="#A09A90"
              style={styles.input}
              value={form.barangay}
            />
          </FormField>

          <FormField label="Address">
            <TextInput
              onChangeText={(value) => update("address", value)}
              placeholder="Street or landmark"
              placeholderTextColor="#A09A90"
              style={styles.input}
              value={form.address}
            />
          </FormField>

          <FormField label="Amenities">
            <TextInput
              onChangeText={(value) => update("amenities", value)}
              placeholder="wifi, ac, parking, laundry"
              placeholderTextColor="#A09A90"
              style={styles.input}
              value={form.amenities}
            />
          </FormField>

          {localError || errorMessage ? (
            <Text style={styles.error}>{localError ?? errorMessage}</Text>
          ) : null}

          <Pressable
            disabled={isSubmitting}
            onPress={() => void handleSubmit()}
            style={[styles.submitBtn, isSubmitting && styles.disabled]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>
                {mode === "create" ? "Publish listing" : "Save changes"}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F5" },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F5F0EA",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flex: 1, color: "#0f172a", fontSize: 20, fontWeight: "800" },
  saveBtn: {
    backgroundColor: "#0B2D23",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  saveBtnText: { color: "#ffffff", fontSize: 13, fontWeight: "800" },
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 4 },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: {
    color: "#1A1A1A",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  required: { color: "#EF4444" },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EAE5DE",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#0f172a",
    fontSize: 14,
  },
  textarea: { minHeight: 100, paddingTop: 12 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#EAE5DE",
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: "#0B2D23", borderColor: "#0B2D23" },
  chipText: { color: "#706A5F", fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#ffffff" },
  photoUpload: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EAE5DE",
    borderStyle: "dashed",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  photoUploadText: { color: "#706A5F", fontSize: 14 },
  photoRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  photoThumb: { width: 80, height: 80, borderRadius: 12 },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    marginBottom: 10,
    borderRadius: 999,
    backgroundColor: "#EEF5F1",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  locationBtnText: { color: "#0B2D23", fontSize: 12, fontWeight: "700" },
  row: { flexDirection: "row", gap: 12 },
  error: { color: "#EF4444", fontSize: 13, fontWeight: "600", marginBottom: 4 },
  submitBtn: {
    backgroundColor: "#0B2D23",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  disabled: { opacity: 0.5 },
});
