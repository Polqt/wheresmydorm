import Ionicons from "@expo/vector-icons/Ionicons";
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

import { AppLaunchScreen } from "@/components/ui/app-launch-screen";
import { AppLogo } from "@/components/ui/app-logo";
import {
  EMAIL_CODE_LENGTH,
  getEmailOtpRateLimitMessage,
  parseEmailOtpRetryAfterSeconds,
} from "@/lib/auth";
import { sendEmailOtp, verifyEmailOtp } from "@/services/auth";
import { useAuthFlowStore } from "@/stores/auth";

export default function EmailCodeScreen() {
  const insets = useSafeAreaInsets();
  const clearOtpCooldown = useAuthFlowStore((state) => state.clearOtpCooldown);
  const pendingEmail = useAuthFlowStore((state) => state.pendingEmail);
  const resendAvailableAt = useAuthFlowStore(
    (state) => state.resendAvailableAt,
  );
  const clearPendingEmail = useAuthFlowStore(
    (state) => state.clearPendingEmail,
  );
  const setOtpCooldown = useAuthFlowStore((state) => state.setOtpCooldown);
  const [code, setCode] = useState("");
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const secondsRemaining =
    resendAvailableAt && resendAvailableAt > currentTime
      ? Math.ceil((resendAvailableAt - currentTime) / 1000)
      : 0;
  const canContinue = code.trim().length === EMAIL_CODE_LENGTH && !isSubmitting;
  const bottomAreaStyle = useMemo(
    () => ({
      paddingBottom: insets.bottom + 12,
    }),
    [insets.bottom],
  );

  useEffect(() => {
    if (!pendingEmail) {
      router.replace("/auth/email");
    }
  }, [pendingEmail]);

  useEffect(() => {
    if (resendAvailableAt === null) {
      return;
    }

    const intervalId = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [resendAvailableAt]);

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
      if (resendAvailableAt !== null && resendAvailableAt > Date.now()) {
        setErrorMessage(getEmailOtpRateLimitMessage(secondsRemaining));
        return;
      }

      const result = await sendEmailOtp(pendingEmail);
      setOtpCooldown(result.resendAvailableAt);
    } catch (error) {
      const retryAfterSeconds =
        error instanceof Error
          ? parseEmailOtpRetryAfterSeconds(error.message)
          : null;

      if (retryAfterSeconds !== null) {
        setOtpCooldown(Date.now() + retryAfterSeconds * 1000);
        setErrorMessage(getEmailOtpRateLimitMessage(retryAfterSeconds));
        return;
      }

      setErrorMessage(
        error instanceof Error ? error.message : "Unable to resend your code.",
      );
    } finally {
      setIsResending(false);
    }
  }, [pendingEmail, resendAvailableAt, secondsRemaining, setOtpCooldown]);

  const handleContinue = useCallback(async () => {
    if (!pendingEmail) {
      router.replace("/auth/email");
      return;
    }

    if (code.trim().length !== EMAIL_CODE_LENGTH) {
      setErrorMessage(`Enter the ${EMAIL_CODE_LENGTH}-digit code from your email.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await verifyEmailOtp(pendingEmail, code);
      clearOtpCooldown();
      clearPendingEmail();
      setIsVerified(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to verify your code.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [clearOtpCooldown, clearPendingEmail, code, pendingEmail]);

  if (isVerified) {
    return (
      <AppLaunchScreen
        body="We're setting up your account."
        title="Email verified!"
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="flex-1">
        <View className="flex-row items-center justify-between px-4 pt-2">
          <Pressable
            className="h-11 w-11 items-center justify-center rounded-full"
            onPress={handleBack}
          >
            <Ionicons color="#1A1A1A" name="chevron-back" size={24} />
          </Pressable>

          <View className="h-11 w-11" />
        </View>

        <View className="flex-1 items-center px-6">
          <AppLogo className="mt-6 h-12 w-12" />

          <Text className="mt-6 text-center font-bold text-[24px] text-[#1A1A1A]">
            Enter your code
          </Text>
          <Text className="mt-2 text-center text-[#7A7A7A] text-sm">
            We sent a code to {pendingEmail}
          </Text>

          <View className="mt-8 w-full">
            <Text className="text-[#555555] text-sm font-medium">
              Verification code
            </Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              className="mt-2 h-14 w-full rounded-2xl border border-[#E0E0E0] bg-white px-4 text-base text-[#1A1A1A]"
              keyboardType="number-pad"
              maxLength={EMAIL_CODE_LENGTH}
              onChangeText={handleCodeChange}
              placeholder="12345678"
              placeholderTextColor="#B0B0B0"
              value={code}
            />
          </View>

          <Pressable
            className="mt-4"
            disabled={isResending || secondsRemaining > 0}
            onPress={handleResend}
          >
            <Text className="font-semibold text-[#1B5E3A] text-sm">
              {isResending
                ? "Sending a new code..."
                : secondsRemaining > 0
                  ? `Resend available in ${secondsRemaining}s`
                  : "Resend code"}
            </Text>
          </Pressable>

          {errorMessage ? (
            <Text className="mt-4 text-center text-red-500 text-sm leading-5">
              {errorMessage}
            </Text>
          ) : null}
        </View>

        <View
          className="w-full px-6 pt-4"
          style={bottomAreaStyle}
        >
          <Pressable
            className={`h-14 w-full items-center justify-center rounded-full ${
              canContinue ? "bg-[#04170E]" : "bg-[#E5E5E5]"
            }`}
            disabled={!canContinue}
            onPress={handleContinue}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text
                className={`font-semibold text-base ${
                  canContinue ? "text-white" : "text-[#9A9A9A]"
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
