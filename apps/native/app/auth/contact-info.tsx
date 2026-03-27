import Ionicons from "@expo/vector-icons/Ionicons";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useState } from "react";
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

const CURRENT_STEP = 3;

export default function ContactInfoScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { role, user } = useAuth();
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomAreaStyle = useMemo(
    () => ({ paddingBottom: Math.max(insets.bottom + 8, 24) }),
    [insets.bottom],
  );

  const handleContinue = useCallback(async () => {
    if (!user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const profile = await updateCurrentProfile(user.id, {
        contactEmail: contactEmail.trim() || null,
        contactPhone: contactPhone.trim() || null,
      });
      queryClient.setQueryData([PROFILE_QUERY_KEY, user.id], profile);
      router.replace("/auth/role-preferences");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [contactEmail, contactPhone, queryClient, user]);

  const handleSkip = useCallback(() => {
    router.replace("/auth/role-preferences");
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1">
          <SetupProgressBar current={CURRENT_STEP} total={ONBOARDING_STEPS} />

          <View className="flex-row items-center justify-between px-4 pt-3">
            <Pressable
              className="h-10 w-10 items-center justify-center rounded-full bg-[#F4F0EA]"
              onPress={() => router.replace("/auth/avatar-setup")}
            >
              <Ionicons color="#1A1A1A" name="chevron-back" size={20} />
            </Pressable>
            <Pressable hitSlop={12} onPress={handleSkip}>
              <Text className="text-[14px] font-medium text-[#8A8480]">Skip</Text>
            </Pressable>
          </View>

          <View className="flex-1 px-6 pt-8">
            <Text className="text-[28px] font-bold leading-[34px] text-[#1A1A1A]">
              How can people{"\n"}reach you?
            </Text>
            <Text className="mt-2 text-[14px] leading-5 text-[#8A8480]">
              {role === "lister"
                ? "Optional. This helps serious Finders reach you faster once they inquire about a property."
                : "Optional. We only surface this when you choose to connect with a Lister."}
            </Text>

            <View className="mt-8 gap-5">
              <View>
                <Text className="mb-2 text-[13px] font-semibold text-[#4A4540]">
                  Contact email
                </Text>
                <View className="flex-row items-center h-[52px] rounded-xl border border-[#D8D2CA] bg-white px-4 gap-3">
                  <Ionicons color="#C0B8B0" name="mail-outline" size={18} />
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="flex-1 text-[15px] text-[#1A1A1A]"
                    keyboardType="email-address"
                    onChangeText={(v) => { setContactEmail(v); setError(null); }}
                    placeholder="you@example.com"
                    placeholderTextColor="#C0B8B0"
                    returnKeyType="next"
                    value={contactEmail}
                  />
                </View>
              </View>

              <View>
                <Text className="mb-2 text-[13px] font-semibold text-[#4A4540]">
                  Phone number
                </Text>
                <View className="flex-row items-center h-[52px] rounded-xl border border-[#D8D2CA] bg-white px-4 gap-3">
                  <Ionicons color="#C0B8B0" name="call-outline" size={18} />
                  <TextInput
                    className="flex-1 text-[15px] text-[#1A1A1A]"
                    keyboardType="phone-pad"
                    onChangeText={(v) => setContactPhone(v)}
                    onSubmitEditing={handleContinue}
                    placeholder="+63 912 345 6789"
                    placeholderTextColor="#C0B8B0"
                    returnKeyType="done"
                    value={contactPhone}
                  />
                </View>
              </View>
            </View>

            <View className="mt-5 flex-row items-start gap-2 rounded-xl bg-[#FAF8F5] px-4 py-3">
              <Ionicons color="#8A8480" name="shield-checkmark-outline" size={15} style={{ marginTop: 1 }} />
              <Text className="flex-1 text-[12px] leading-[18px] text-[#8A8480]">
                We'll only show this to people you connect with on WheresMyDorm.
              </Text>
            </View>

            {error ? (
              <Text className="mt-3 text-[13px] text-red-500">{error}</Text>
            ) : null}

            <View className="flex-1" />
          </View>

          <View className="px-6" style={bottomAreaStyle}>
            <Pressable
              className="h-[52px] w-full items-center justify-center rounded-xl"
              disabled={isSubmitting}
              onPress={handleContinue}
              style={{ backgroundColor: "#04170E" }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text className="text-[15px] font-semibold text-white">Continue</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
