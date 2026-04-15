import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useCurrentProfile } from "@/hooks/use-current-profile";
import { PROFILE_QUERY_KEY } from "@/lib/auth";
import { useAuth } from "@/providers/auth-provider";
import { updateCurrentProfile, uploadAvatar } from "@/services/profile";
import { getInitials } from "@/utils/profile";

type FieldKey = "firstName" | "lastName" | "contactEmail" | "contactPhone";

type Field = {
  autoCapitalize?: "none" | "words";
  keyboardType?: "default" | "email-address" | "phone-pad";
  key: FieldKey;
  label: string;
  placeholder: string;
  required?: boolean;
};

const FIELDS: Field[] = [
  {
    autoCapitalize: "words",
    key: "firstName",
    label: "First name",
    placeholder: "Alex",
    required: true,
  },
  {
    autoCapitalize: "words",
    key: "lastName",
    label: "Last name",
    placeholder: "Smith",
  },
  {
    autoCapitalize: "none",
    key: "contactEmail",
    keyboardType: "email-address",
    label: "Contact email",
    placeholder: "Shown to connections only",
  },
  {
    autoCapitalize: "none",
    key: "contactPhone",
    keyboardType: "phone-pad",
    label: "Phone number",
    placeholder: "+63 912 345 6789",
  },
];

function emptyForm() {
  return {
    contactEmail: "",
    contactPhone: "",
    firstName: "",
    lastName: "",
  } satisfies Record<FieldKey, string>;
}

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: profile } = useCurrentProfile(user);

  const [form, setFormState] = useState<Record<FieldKey, string>>(emptyForm);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasHydratedForm = useRef(false);
  const inputRefs = useRef<Partial<Record<FieldKey, TextInput | null>>>({});

  useEffect(() => {
    if (!profile || hasHydratedForm.current) {
      return;
    }

    setFormState({
      contactEmail: profile.contactEmail ?? "",
      contactPhone: profile.contactPhone ?? "",
      firstName: profile.firstName ?? "",
      lastName: profile.lastName ?? "",
    });
    hasHydratedForm.current = true;
  }, [profile]);

  const initials = useMemo(
    () =>
      getInitials(
        form.firstName || profile?.firstName,
        form.lastName || profile?.lastName,
      ),
    [form.firstName, form.lastName, profile?.firstName, profile?.lastName],
  );

  const avatarUrl = localAvatarUri ?? profile?.avatarUrl ?? null;
  const canSave = form.firstName.trim().length > 0 && !isSaving;

  const setField = useCallback((key: FieldKey, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }, []);

  const handlePickAvatar = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      setError("Photo library permission is required to change your avatar.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ["images"],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setLocalAvatarUri(result.assets[0].uri);
      setError(null);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!user || !form.firstName.trim()) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      let newAvatarUrl: string | undefined;

      if (localAvatarUri) {
        newAvatarUrl = await uploadAvatar(user.id, localAvatarUri);
      }

      const updated = await updateCurrentProfile(user.id, {
        ...(newAvatarUrl !== undefined ? { avatarUrl: newAvatarUrl } : {}),
        contactEmail: form.contactEmail.trim() || null,
        contactPhone: form.contactPhone.trim() || null,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || null,
      });

      queryClient.setQueryData([PROFILE_QUERY_KEY, user.id], updated);
      router.back();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save. Try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }, [form, localAvatarUri, queryClient, user]);

  const focusNext = useCallback(
    (current: FieldKey) => {
      const currentIndex = FIELDS.findIndex((field) => field.key === current);
      const nextField = FIELDS[currentIndex + 1];

      if (nextField) {
        inputRefs.current[nextField.key]?.focus();
        return;
      }

      void handleSave();
    },
    [handleSave],
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F7F4EE]" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScreenHeader
          subtitle="Update the details people see when they connect with you."
          title="Edit profile"
          withBackButton
        />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-5">
            <View className="items-center rounded-[30px] bg-[#FFFDFC] px-6 py-7">
              <ProfileAvatar
                avatarUrl={avatarUrl}
                initials={initials}
                onPress={handlePickAvatar}
                size={104}
              />
              <Pressable
                className="mt-4"
                hitSlop={8}
                onPress={handlePickAvatar}
              >
                <Text className="font-semibold text-[#0B4A30] text-[14px]">
                  Change profile photo
                </Text>
              </Pressable>
              <Text className="mt-2 text-center text-[#7B7468] text-[13px] leading-5">
                Use a clear square photo so listers and finders can recognize
                you quickly.
              </Text>
            </View>
          </View>

          <View className="mt-5 px-5">
            <View className="rounded-[30px] bg-[#FFFDFC] px-5 py-2">
              {FIELDS.map((field, index) => (
                <View
                  key={field.key}
                  className={`py-4 ${
                    index < FIELDS.length - 1 ? "border-[#EEE7DC] border-b" : ""
                  }`}
                >
                  <Text className="mb-2 font-semibold text-[#6F685E] text-[13px]">
                    {field.label}
                    {field.required ? (
                      <Text className="text-[#0B4A30]"> *</Text>
                    ) : null}
                  </Text>
                  <TextInput
                    ref={(ref) => {
                      inputRefs.current[field.key] = ref;
                    }}
                    autoCapitalize={field.autoCapitalize ?? "sentences"}
                    autoCorrect={false}
                    className="rounded-[18px] bg-[#F6F2EB] px-4 py-4 text-[#111827] text-[15px]"
                    keyboardType={field.keyboardType ?? "default"}
                    onChangeText={(value) => setField(field.key, value)}
                    onSubmitEditing={() => focusNext(field.key)}
                    placeholder={field.placeholder}
                    placeholderTextColor="#B1A89C"
                    returnKeyType={index < FIELDS.length - 1 ? "next" : "done"}
                    submitBehavior={
                      index === FIELDS.length - 1 ? "blurAndSubmit" : "submit"
                    }
                    value={form[field.key]}
                  />
                </View>
              ))}
            </View>
          </View>

          {error ? (
            <Text className="mt-4 px-5 text-[13px] text-red-600 leading-5">
              {error}
            </Text>
          ) : null}
        </ScrollView>

        <View
          className="border-[#E9E1D6] border-t bg-[#F7F4EE] px-5 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom + 8, 20) }}
        >
          <Pressable
            className="h-[54px] w-full items-center justify-center rounded-[20px]"
            disabled={!canSave}
            onPress={() => void handleSave()}
            style={{ backgroundColor: canSave ? "#111827" : "#E4DDD2" }}
          >
            {isSaving ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text
                className="font-semibold text-[15px]"
                style={{ color: canSave ? "#ffffff" : "#A69D91" }}
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
