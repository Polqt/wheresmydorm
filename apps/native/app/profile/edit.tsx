import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { useAuth } from "@/providers/auth-provider";
import {
  getOrCreateCurrentProfile,
  updateCurrentProfile,
  uploadAvatar,
} from "@/services/profile";
import { getInitials } from "@/utils/profile";

type FieldKey = "firstName" | "lastName" | "contactEmail" | "contactPhone";

type Field = {
  key: FieldKey;
  label: string;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "words";
  required?: boolean;
};

const FIELDS: Field[] = [
  { key: "firstName", label: "First name", placeholder: "Alex", autoCapitalize: "words", required: true },
  { key: "lastName", label: "Last name", placeholder: "Smith", autoCapitalize: "words" },
  { key: "contactEmail", label: "Contact email", placeholder: "Shown to connections only", keyboardType: "email-address", autoCapitalize: "none" },
  { key: "contactPhone", label: "Phone number", placeholder: "+63 912 345 6789", keyboardType: "phone-pad", autoCapitalize: "none" },
];

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: profile } = useQuery({
    enabled: Boolean(user),
    queryFn: () => getOrCreateCurrentProfile(user!),
    queryKey: ["auth-profile", user?.id],
  });

  const [form, setFormState] = useState<Record<FieldKey, string>>({
    firstName: profile?.firstName ?? "",
    lastName: profile?.lastName ?? "",
    contactEmail: profile?.contactEmail ?? "",
    contactPhone: profile?.contactPhone ?? "",
  });
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRefs = useRef<Partial<Record<FieldKey, TextInput | null>>>({});

  const initials = useMemo(
    () => getInitials(form.firstName || profile?.firstName, form.lastName || profile?.lastName),
    [form.firstName, form.lastName, profile?.firstName, profile?.lastName],
  );

  const avatarUrl = localAvatarUri ?? profile?.avatarUrl ?? null;
  const canSave = form.firstName.trim().length > 0 && !isSaving;

  const setField = useCallback((key: FieldKey, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }, []);

  const handlePickAvatar = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: "images",
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setLocalAvatarUri(result.assets[0].uri);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!user || !form.firstName.trim()) return;
    setIsSaving(true);
    setError(null);

    try {
      let newAvatarUrl: string | undefined;
      if (localAvatarUri) {
        newAvatarUrl = await uploadAvatar(user.id, localAvatarUri);
      }

      const updated = await updateCurrentProfile(user.id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || null,
        contactEmail: form.contactEmail.trim() || null,
        contactPhone: form.contactPhone.trim() || null,
        ...(newAvatarUrl !== undefined ? { avatarUrl: newAvatarUrl } : {}),
      });

      queryClient.setQueryData(["auth-profile", user.id], updated);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save. Try again.");
    } finally {
      setIsSaving(false);
    }
  }, [form, localAvatarUri, queryClient, user]);

  const focusNext = useCallback((current: FieldKey) => {
    const idx = FIELDS.findIndex((f) => f.key === current);
    const next = FIELDS[idx + 1];
    if (next) {
      inputRefs.current[next.key]?.focus();
    } else {
      handleSave();
    }
  }, [handleSave]);

  return (
    <SafeAreaView className="flex-1 bg-[#FAF8F5]" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* ── Nav bar ── */}
        <View className="flex-row items-center justify-between px-5 py-3">
          <Pressable
            className="h-9 w-9 items-center justify-center rounded-full bg-[#EFECE7]"
            hitSlop={8}
            onPress={() => router.back()}
          >
            <Ionicons color="#1A1A1A" name="chevron-back" size={18} />
          </Pressable>

          <Text className="text-[16px] font-semibold tracking-tight text-[#1A1A1A]">
            Edit profile
          </Text>

          {isSaving ? (
            <ActivityIndicator color="#0B4A30" size="small" />
          ) : (
            <Pressable disabled={!canSave} hitSlop={8} onPress={handleSave}>
              <Text
                className="text-[15px] font-semibold"
                style={{ color: canSave ? "#0B4A30" : "#C8C0B8" }}
              >
                Save
              </Text>
            </Pressable>
          )}
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Avatar ── */}
          <View className="items-center pt-6 pb-8">
            <ProfileAvatar
              avatarUrl={avatarUrl}
              initials={initials}
              onPress={handlePickAvatar}
              size={100}
            />
            <Pressable className="mt-3" hitSlop={8} onPress={handlePickAvatar}>
              <Text className="text-[13px] font-semibold text-[#0B4A30]">
                Change photo
              </Text>
            </Pressable>
          </View>

          {/* ── Fields ── */}
          <View className="border-t border-[#EAE5DE]">
            {FIELDS.map((field, i) => (
              <View
                key={field.key}
                className={`flex-row items-center px-5 ${i < FIELDS.length - 1 ? "border-b border-[#EAE5DE]" : ""}`}
                style={{ minHeight: 58 }}
              >
                <Text className="w-[130px] text-[15px] text-[#1A1A1A]">
                  {field.label}
                  {field.required ? (
                    <Text className="text-[#0B4A30]"> *</Text>
                  ) : null}
                </Text>
                <TextInput
                  ref={(r) => { inputRefs.current[field.key] = r; }}
                  autoCapitalize={field.autoCapitalize ?? "sentences"}
                  autoCorrect={false}
                  submitBehavior={i === FIELDS.length - 1 ? "blurAndSubmit" : "submit"}
                  className="flex-1 py-4 text-right text-[15px] text-[#1A1A1A]"
                  keyboardType={field.keyboardType ?? "default"}
                  onChangeText={(v) => setField(field.key, v)}
                  onSubmitEditing={() => focusNext(field.key)}
                  placeholder={field.placeholder}
                  placeholderTextColor="#C8C0B8"
                  returnKeyType={i < FIELDS.length - 1 ? "next" : "done"}
                  value={form[field.key]}
                />
              </View>
            ))}
          </View>

          {error ? (
            <Text className="mt-4 px-5 text-[13px] text-red-500">{error}</Text>
          ) : null}
        </ScrollView>

        {/* ── Save button ── */}
        <View
          className="px-5"
          style={{ paddingBottom: Math.max(insets.bottom + 8, 24) }}
        >
          <Pressable
            className="h-[52px] w-full items-center justify-center rounded-2xl"
            disabled={!canSave}
            onPress={handleSave}
            style={{ backgroundColor: canSave ? "#0B2D23" : "#E8E3DC" }}
          >
            {isSaving ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text
                className="text-[15px] font-semibold tracking-wide"
                style={{ color: canSave ? "#ffffff" : "#A09A90" }}
              >
                Save changes
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
