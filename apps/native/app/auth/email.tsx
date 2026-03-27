import Ionicons from "@expo/vector-icons/Ionicons";
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

import { AppLogo } from "@/components/ui/app-logo";
import { isValidEmail } from "@/lib/auth";
import { sendEmailOtp, tryRestoreSession } from "@/services/auth";
import { useAuthFlowStore } from "@/stores/auth";
import { supabase } from "@/utils/supabase";

export default function EmailSignInScreen() {
  const insets = useSafeAreaInsets();
  const setPendingEmail = useAuthFlowStore((s) => s.setPendingEmail);
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canContinue = isValidEmail(email) && !isSubmitting;

  const bottomAreaStyle = useMemo(
    () => ({ paddingBottom: Math.max(insets.bottom + 8, 24) }),
    [insets.bottom],
  );

  const handleContinue = useCallback(async () => {
    if (!isValidEmail(email)) {
      setErrorMessage("Enter a valid email address to continue.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const restored = await tryRestoreSession(email);
      if (restored) {
        router.replace("/");
        return;
      }

      const normalizedEmail = await sendEmailOtp(email);

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/");
        return;
      }

      setPendingEmail(normalizedEmail);
      router.push("/auth/email-code");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to send verification code.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [email, setPendingEmail]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1">
          <View className="flex-row items-center px-4 pt-2">
            <Pressable
              className="h-10 w-10 items-center justify-center rounded-full bg-[#F4F0EA]"
              onPress={() => router.replace("/auth/sign-in")}
            >
              <Ionicons color="#1A1A1A" name="chevron-back" size={20} />
            </Pressable>
          </View>

          <View className="flex-1 px-6 pt-6">
            <View className="items-center">
              <AppLogo containerClassName="h-[68px] w-[68px] rounded-[22px]" size={38} />
            </View>

            <Text className="mt-6 text-center font-bold text-[26px] leading-[32px] text-[#1A1A1A]">
              Let's start with email
            </Text>

            <View className="mt-8">
              <Text className="mb-2 text-[13px] font-semibold text-[#4A4540]">
                Email
              </Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                className="h-[52px] w-full rounded-xl border border-[#D8D2CA] bg-white px-4 text-[15px] text-[#1A1A1A]"
                keyboardType="email-address"
                onChangeText={(v) => { setEmail(v); setErrorMessage(null); }}
                onSubmitEditing={handleContinue}
                placeholder="you@example.com"
                placeholderTextColor="#C0B8B0"
                value={email}
              />
            </View>

            {errorMessage ? (
              <Text className="mt-3 text-[13px] leading-5 text-red-500">
                {errorMessage}
              </Text>
            ) : null}

            <View className="flex-1" />
          </View>

          <View className="px-6" style={bottomAreaStyle}>
            <Pressable
              className={`h-[52px] w-full items-center justify-center rounded-xl ${
                canContinue ? "bg-[#04170E]" : "bg-[#E8E3DC]"
              }`}
              disabled={!canContinue}
              onPress={handleContinue}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text
                  className={`font-semibold text-[15px] ${
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
