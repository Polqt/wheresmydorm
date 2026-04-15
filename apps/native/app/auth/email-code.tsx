import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { EMAIL_CODE_LENGTH } from "@/lib/auth";
import { sendEmailOtp, verifyEmailOtp } from "@/services/auth";
import { useAuthFlowStore } from "@/stores/auth";

export default function EmailCodeScreen() {
  const insets = useSafeAreaInsets();
  const pendingEmail = useAuthFlowStore((s) => s.pendingEmail);
  const clearPendingEmail = useAuthFlowStore((s) => s.clearPendingEmail);
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const canContinue = code.length === EMAIL_CODE_LENGTH && !isSubmitting;

  const bottomAreaStyle = useMemo(
    () => ({ paddingBottom: Math.max(insets.bottom + 8, 24) }),
    [insets.bottom],
  );

  useEffect(() => {
    if (!pendingEmail) router.replace("/auth/email");
  }, [pendingEmail]);

  const handleCodeChange = useCallback((nextCode: string) => {
    setCode(nextCode.replace(/\D/g, "").slice(0, EMAIL_CODE_LENGTH));
    setErrorMessage(null);
  }, []);

  const handleResend = useCallback(async () => {
    if (!pendingEmail) return;
    setIsResending(true);
    setErrorMessage(null);
    try {
      await sendEmailOtp(pendingEmail);
      setErrorMessage(null);
    } catch (error) {
      void error;
      setErrorMessage(
        "We couldn't resend the code. Please wait a moment and try again.",
      );
    } finally {
      setIsResending(false);
    }
  }, [pendingEmail]);

  const handleContinue = useCallback(async () => {
    if (!pendingEmail || code.length !== EMAIL_CODE_LENGTH) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await verifyEmailOtp(pendingEmail, code);
      clearPendingEmail();
      // AuthProvider detects the new session via onAuthStateChange
      // and routes to role-select or the correct role home automatically.
    } catch (error) {
      void error;
      setErrorMessage(
        "That code didn't work. Please check it and try again, or request a new one.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [clearPendingEmail, code, pendingEmail]);

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
              onPress={() => router.replace("/auth/email")}
            >
              <Ionicons color="#1A1A1A" name="chevron-back" size={20} />
            </Pressable>
          </View>

          <View className="flex-1 px-6 pt-6">
            <View className="items-center">
              <AppLogo
                containerClassName="h-[68px] w-[68px] rounded-[22px]"
                size={38}
              />
            </View>

            <Text className="mt-6 text-center font-bold text-[#1A1A1A] text-[26px] leading-[32px]">
              Enter your code
            </Text>
            <Text className="mt-2 text-center text-[#8A8480] text-[14px] leading-5">
              We sent a {EMAIL_CODE_LENGTH}-digit code to{"\n"}
              <Text className="font-semibold text-[#1A1A1A]">
                {pendingEmail}
              </Text>
            </Text>

            <View className="mt-8">
              <Text className="mb-2 font-semibold text-[#4A4540] text-[13px]">
                Verification code
              </Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                className="h-[52px] w-full rounded-xl border border-[#D8D2CA] bg-white px-4 text-center font-bold text-[#1A1A1A] text-[20px] tracking-[6px]"
                keyboardType="number-pad"
                maxLength={EMAIL_CODE_LENGTH}
                onChangeText={handleCodeChange}
                onSubmitEditing={handleContinue}
                placeholder="––––––––"
                placeholderTextColor="#C0B8B0"
                returnKeyType="done"
                value={code}
              />
            </View>

            <Pressable
              className="mt-4 self-center"
              disabled={isResending}
              onPress={handleResend}
            >
              <Text
                className={`font-semibold text-[13px] ${
                  isResending ? "text-[#B0A898]" : "text-[#1D5B43]"
                }`}
              >
                {isResending ? "Sending a new code..." : "Resend code"}
              </Text>
            </Pressable>

            {errorMessage ? (
              <Text className="mt-4 text-center text-[13px] text-red-500 leading-5">
                {errorMessage}
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
