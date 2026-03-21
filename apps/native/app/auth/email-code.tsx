import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AUTH_TEXT_INPUT_CLASS_NAME, EMAIL_CODE_LENGTH } from "@/lib/auth";
import { sendEmailOtp, verifyEmailOtp } from "@/services/auth";
import { useAuthFlowStore } from "@/stores/auth";

export default function EmailCodeScreen() {
  const insets = useSafeAreaInsets();
  const pendingEmail = useAuthFlowStore((state) => state.pendingEmail);
  const clearPendingEmail = useAuthFlowStore(
    (state) => state.clearPendingEmail,
  );
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const canContinue = code.trim().length === EMAIL_CODE_LENGTH && !isSubmitting;
  const bottomAreaStyle = useMemo(
    () => ({
      paddingBottom: insets.bottom,
    }),
    [insets.bottom],
  );

  useEffect(() => {
    if (!pendingEmail) {
      router.replace("/auth/email");
    }
  }, [pendingEmail]);

  const handleBack = useCallback(() => {
    router.replace("/auth/email");
  }, []);

  const handleCodeChange = useCallback((nextCode: string) => {
    const sanitizedCode = nextCode
      .replace(/\D/g, "")
      .slice(0, EMAIL_CODE_LENGTH);
    setCode(sanitizedCode);
    setErrorMessage(null);
  }, []);

  const handleResend = useCallback(async () => {
    if (!pendingEmail) {
      router.replace("/auth/email");
      return;
    }

    setIsResending(true);
    setErrorMessage(null);

    try {
      await sendEmailOtp(pendingEmail);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to resend your code.",
      );
    } finally {
      setIsResending(false);
    }
  }, [pendingEmail]);

  const handleContinue = useCallback(async () => {
    if (!pendingEmail) {
      router.replace("/auth/email");
      return;
    }

    if (code.trim().length !== EMAIL_CODE_LENGTH) {
      setErrorMessage("Enter the 6-digit code from your email.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await verifyEmailOtp(pendingEmail, code);
      clearPendingEmail();
      router.replace("/auth/role-select");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to verify your code.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [clearPendingEmail, code, pendingEmail]);

  return (
    <SafeAreaView className="flex-1 bg-brand-surface">
      <StatusBar style="dark" />

      <View className="flex-1">
        <View className="flex-row items-center justify-between px-4 pt-4">
          <Pressable
            className="h-11 w-11 items-center justify-center rounded-full"
            onPress={handleBack}
          >
            <Text className="text-2xl text-brand-primary-900">←</Text>
          </Pressable>

          <View className="h-11 w-11" />
        </View>

        <View className="flex-1 items-center px-6">
          <Image
            accessibilityLabel="WheresMyDorm logo"
            className="mt-8 h-14 w-14"
            contentFit="contain"
            source={require("../../assets/images/logo.svg")}
          />

          <Text className="mt-6 text-center font-black text-2xl text-brand-primary-900">
            Enter your code
          </Text>
          <Text className="mt-2 text-center text-slate-400 text-sm leading-5">
            We sent a 6-digit code to {pendingEmail ?? "your email"}.
          </Text>

          <View className="mt-10 w-full">
            <Text className="text-slate-500 text-sm">Verification code</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              className={AUTH_TEXT_INPUT_CLASS_NAME}
              keyboardType="number-pad"
              onChangeText={handleCodeChange}
              placeholder="123456"
              placeholderTextColor="#94a3b8"
              value={code}
            />
          </View>

          <Pressable
            className="mt-4"
            disabled={isResending}
            onPress={handleResend}
          >
            <Text className="font-semibold text-brand-primary-500 text-sm">
              {isResending ? "Sending a new code..." : "Resend code"}
            </Text>
          </Pressable>

          {errorMessage ? (
            <Text className="mt-4 text-center text-red-500 text-sm leading-5">
              {errorMessage}
            </Text>
          ) : null}
        </View>

        <View
          className="absolute bottom-0 w-full px-6 pt-4"
          style={bottomAreaStyle}
        >
          <Pressable
            className={`h-14 w-full items-center justify-center rounded-2xl ${
              canContinue ? "bg-brand-primary-900" : "bg-slate-200"
            }`}
            disabled={!canContinue}
            onPress={handleContinue}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text
                className={`font-bold text-base ${
                  canContinue ? "text-white" : "text-slate-400"
                }`}
              >
                Continue
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
