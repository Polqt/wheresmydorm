import Ionicons from "@expo/vector-icons/Ionicons";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { SetupProgressBar } from "@/components/ui/setup-progress-bar";
import { ONBOARDING_STEPS, PROFILE_QUERY_KEY } from "@/lib/auth";
import { useAuth } from "@/providers/auth-provider";
import { updateCurrentProfile } from "@/services/profile";

const CURRENT_STEP = 1;

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { role, user } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastNameRef = useRef<TextInput>(null);

  const canContinue = firstName.trim().length > 0 && !isSubmitting;

  const bottomAreaStyle = useMemo(
    () => ({ paddingBottom: Math.max(insets.bottom + 8, 24) }),
    [insets.bottom],
  );

  const handleContinue = useCallback(async () => {
    if (!user || !firstName.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const profile = await updateCurrentProfile(user.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim() || null,
      });
      queryClient.setQueryData([PROFILE_QUERY_KEY, user.id], profile);
      router.replace("/auth/avatar-setup");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save. Try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [firstName, lastName, queryClient, user]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1">
          <SetupProgressBar current={CURRENT_STEP} total={ONBOARDING_STEPS} />

          <View className="px-4 pt-3">
            <Pressable
              className="h-10 w-10 items-center justify-center rounded-full bg-[#F4F0EA]"
              onPress={() => router.replace("/auth/role-select")}
            >
              <Ionicons color="#1A1A1A" name="chevron-back" size={20} />
            </Pressable>
          </View>

          <View className="flex-1 px-6 pt-8">
            <Text className="font-bold text-[#1A1A1A] text-[28px] leading-[34px]">
              What's your name?
            </Text>
            <Text className="mt-2 text-[#8A8480] text-[14px] leading-5">
              {role === "lister"
                ? "This is how Finders will recognize you in your listings, inbox, and public posts."
                : "This is how Listers and other Finders will recognize you across messages and the community feed."}
            </Text>

            <View className="mt-8 gap-4">
              <View>
                <Text className="mb-2 font-semibold text-[#4A4540] text-[13px]">
                  First name <Text className="font-normal text-red-400">*</Text>
                </Text>
                <TextInput
                  autoCapitalize="words"
                  autoCorrect={false}
                  autoFocus
                  className="h-[52px] w-full rounded-xl border border-[#D8D2CA] bg-white px-4 text-[#1A1A1A] text-[15px]"
                  onChangeText={(v) => {
                    setFirstName(v);
                    setError(null);
                  }}
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                  placeholder="Alex"
                  placeholderTextColor="#C0B8B0"
                  returnKeyType="next"
                  value={firstName}
                />
              </View>

              <View>
                <Text className="mb-2 font-semibold text-[#4A4540] text-[13px]">
                  Last name{" "}
                </Text>
                <TextInput
                  ref={lastNameRef}
                  autoCapitalize="words"
                  autoCorrect={false}
                  className="h-[52px] w-full rounded-xl border border-[#D8D2CA] bg-white px-4 text-[#1A1A1A] text-[15px]"
                  onChangeText={(v) => setLastName(v)}
                  onSubmitEditing={handleContinue}
                  placeholder="Smith"
                  placeholderTextColor="#C0B8B0"
                  returnKeyType="done"
                  value={lastName}
                />
              </View>
            </View>

            {error ? (
              <Text className="mt-3 text-[13px] text-red-500 leading-5">
                {error}
              </Text>
            ) : null}

            <View className="flex-1" />
          </View>

          <View className="px-6" style={bottomAreaStyle}>
            <Pressable
              className={`h-[52px] w-full items-center justify-center rounded-2xl ${
                canContinue ? "bg-brand-orange" : "bg-[#E8E3DC]"
              }`}
              disabled={!canContinue}
              onPress={handleContinue}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text
                  className={`font-bold text-[15px] ${
                    canContinue ? "text-white" : "text-[#A09A90]"
                  }`}
                >
                  Continue
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
