import Ionicons from "@expo/vector-icons/Ionicons";
import { useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
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
import { getOrCreateCurrentProfile } from "@/services/profile";
import { updateCurrentProfile, uploadAvatar } from "@/services/profile";
import { useQuery } from "@tanstack/react-query";

type Field = {
  key: string;
  label: string;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "words" | "sentences";
};

const FIELDS: Field[] = [
  {
    key: "firstName",
    label: "First name",
    placeholder: "Alex",
    autoCapitalize: "words",
  },
  {
    key: "lastName",
    label: "Last name",
    placeholder: "Smith",
    autoCapitalize: "words",
  },
  {
    key: "contactEmail",
    label: "Contact email",
    placeholder: "shown only to connections",
    keyboardType: "email-address",
    autoCapitalize: "none",
  },
  {
    key: "contactPhone",
    label: "Phone number",
    placeholder: "+63 912 345 6789",
    keyboardType: "phone-pad",
    autoCapitalize: "none",
  },
];

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const profileQuery = useQuery({
    enabled: Boolean(user),
    queryFn: () => getOrCreateCurrentProfile(user!),
    queryKey: ["auth-profile", user?.id],
  });
  const profile = profileQuery.data;

  const [form, setForm] = useState({
    firstName: profile?.firstName ?? "",
    lastName: profile?.lastName ?? "",
    contactEmail: profile?.contactEmail ?? "",
    contactPhone: profile?.contactPhone ?? "",
  });
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refs = useRef<Record<string, TextInput | null>>({});

  const initials = useMemo(
    () =>
      `${form.firstName?.[0] ?? profile?.firstName?.[0] ?? "W"}${form.lastName?.[0] ?? profile?.lastName?.[0] ?? "D"}`.toUpperCase(),
    [form.firstName, form.lastName, profile?.firstName, profile?.lastName],
  );

  const avatarUrl = localAvatarUri ?? profile?.avatarUrl ?? null;

  const canSave = form.firstName.trim().length > 0 && !isSaving;

  const bottomStyle = useMemo(
    () => ({ paddingBottom: Math.max(insets.bottom + 8, 24) }),
    [insets.bottom],
  );

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
      let avatarUrl: string | null | undefined = undefined;

      if (localAvatarUri) {
        avatarUrl = await uploadAvatar(user.id, localAvatarUri);
      }

      const updated = await updateCurrentProfile(user.id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || null,
        contactEmail: form.contactEmail.trim() || null,
        contactPhone: form.contactPhone.trim() || null,
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      });

      queryClient.setQueryData(["auth-profile", user.id], updated);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save. Try again.");
    } finally {
      setIsSaving(false);
    }
  }, [form, localAvatarUri, queryClient, user]);

  return (
    <SafeAreaView className="flex-1 bg-[#FAF8F5]" edges={["top"]}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* ── Nav ── */}
        <View className="flex-row items-center justify-between px-5 py-4">
          <Pressable
            className="h-9 w-9 items-center justify-center rounded-full bg-[#EFECE7]"
            hitSlop={8}
            onPress={() => router.back()}
          >
            <Ionicons color="#1A1A1A" name="chevron-back" size={18} />
          </Pressable>

          <Text className="text-[16px] font-bold text-[#1A1A1A]">
            Edit profile
          </Text>

          <Pressable
            disabled={!canSave}
            hitSlop={8}
            onPress={handleSave}
          >
            <Text
              className="text-[15px] font-semibold"
              style={{ color: canSave ? "#0B4A30" : "#C0B8B0" }}
            >
              Save
            </Text>
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Avatar ── */}
          <View className="mt-4 items-center">
            <ProfileAvatar
              avatarUrl={avatarUrl}
              initials={initials}
              onPress={handlePickAvatar}
              size={96}
            />
            <Pressable hitSlop={8} onPress={handlePickAvatar}>
              <Text className="mt-3 text-[13px] font-medium text-[#0B4A30]">
                Change photo
              </Text>
            </Pressable>
          </View>

          {/* ── Divider ── */}
          <View className="mx-5 mt-7 h-px bg-[#EAE5DE]" />

          {/* ── Fields ── */}
          <View className="mt-6 px-5 gap-5">
            {FIELDS.map((field, i) => (
              <View key={field.key}>
                <Text className="mb-1.5 text-[12px] font-semibold uppercase tracking-[1px] text-[#A09A90]">
                  {field.label}
                  {field.key === "firstName" ? (
                    <Text className="text-red-400"> *</Text>
                  ) : null}
                </Text>
                <TextInput
                  ref={(r) => {
                    refs.current[field.key] = r;
                  }}
                  autoCapitalize={field.autoCapitalize ?? "sentences"}
                  autoCorrect={false}
                  className="h-[50px] w-full rounded-xl border border-[#E0D8CE] bg-white px-4 text-[15px] text-[#1A1A1A]"
                  keyboardType={field.keyboardType ?? "default"}
                  onChangeText={(v) => {
                    setForm((prev) => ({ ...prev, [field.key]: v }));
                    setError(null);
                  }}
                  onSubmitEditing={() => {
                    const nextKey = FIELDS[i + 1]?.key;
                    if (nextKey) refs.current[nextKey]?.focus();
                    else handleSave();
                  }}
                  placeholder={field.placeholder}
                  placeholderTextColor="#C8C0B8"
                  returnKeyType={i < FIELDS.length - 1 ? "next" : "done"}
                  value={form[field.key as keyof typeof form]}
                />
              </View>
            ))}

            {error ? (
              <Text className="text-[13px] text-red-500">{error}</Text>
            ) : null}
          </View>
        </ScrollView>

        {/* ── Save button (bottom) ── */}
        <View className="px-5" style={bottomStyle}>
          <Pressable
            className="h-[52px] w-full items-center justify-center rounded-xl"
            disabled={!canSave}
            onPress={handleSave}
            style={{ backgroundColor: canSave ? "#0B2D23" : "#E8E3DC" }}
          >
            {isSaving ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text
                className="text-[15px] font-semibold"
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
