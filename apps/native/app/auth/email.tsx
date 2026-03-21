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

import { AppLogo } from "@/components/ui/app-logo";
import {
  EMAIL_CODE_LENGTH,
  getEmailOtpRateLimitMessage,
  parseEmailOtpRetryAfterSeconds,
  isValidEmail,
} from "@/lib/auth";
import { sendEmailOtp } from "@/services/auth";
import { useAuthFlowStore } from "@/stores/auth";

export default function EmailSignInScreen() {
  const insets = useSafeAreaInsets();
  const pendingEmail = useAuthFlowStore((state) => state.pendingEmail);
  const resendAvailableAt = useAuthFlowStore(
    (state) => state.resendAvailableAt,
  );
  const setOtpCooldown = useAuthFlowStore((state) => state.setOtpCooldown);
  const setPendingEmail = useAuthFlowStore((state) => state.setPendingEmail);
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const normalizedEmail = email.trim().toLowerCase();
  const secondsRemaining =
    resendAvailableAt && resendAvailableAt > currentTime
      ? Math.ceil((resendAvailableAt - currentTime) / 1000)
      : 0;
  const canContinue = isValidEmail(email) && !isSubmitting;
  const bottomAreaStyle = useMemo(
    () => ({
      paddingBottom: insets.bottom + 12,
    }),
    [insets.bottom],
  );

  const handleBack = useCallback(() => {
    router.replace("/auth/sign-in");
  }, []);

  const handleEmailChange = useCallback((nextEmail: string) => {
    setEmail(nextEmail);
    setErrorMessage(null);
  }, []);

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

  const handleContinue = useCallback(async () => {
    if (!isValidEmail(email)) {
      setErrorMessage("Enter a valid email address to continue.");
      return;
    }

    if (
      pendingEmail === normalizedEmail &&
      resendAvailableAt !== null &&
      resendAvailableAt > Date.now()
    ) {
      router.push("/auth/email-code");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await sendEmailOtp(email);
      setPendingEmail(result.email);
      setOtpCooldown(result.resendAvailableAt);
      router.push("/auth/email-code");
    } catch (error) {
      const retryAfterSeconds =
        error instanceof Error
          ? parseEmailOtpRetryAfterSeconds(error.message)
          : null;

      if (retryAfterSeconds !== null) {
        const retryAt = Date.now() + retryAfterSeconds * 1000;
        setPendingEmail(normalizedEmail);
        setOtpCooldown(retryAt);
        setErrorMessage(getEmailOtpRateLimitMessage(retryAfterSeconds));
        router.push("/auth/email-code");
        return;
      }

      setErrorMessage(
        error instanceof Error ? error.message : "Unable to send your code.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    email,
    normalizedEmail,
    pendingEmail,
    resendAvailableAt,
    secondsRemaining,
    setOtpCooldown,
    setPendingEmail,
  ]);

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
            Let&apos;s start with email
          </Text>
          <Text className="mt-2 text-center text-[#7A7A7A] text-sm">
            We&apos;ll send an {EMAIL_CODE_LENGTH}-digit confirmation code to
            your inbox.
          </Text>

          <View className="mt-8 w-full">
            <Text className="text-[#555555] text-sm font-medium">Email</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              className="mt-2 h-14 w-full rounded-2xl border border-[#E0E0E0] bg-white px-4 text-base text-[#1A1A1A]"
              keyboardType="email-address"
              onChangeText={handleEmailChange}
              placeholder="alexsmith.mobbin@gmail.com"
              placeholderTextColor="#B0B0B0"
              value={email}
            />
          </View>

          {errorMessage ? (
            <Text className="mt-4 text-center text-red-500 text-sm leading-5">
              {errorMessage}
            </Text>
          ) : null}

          {secondsRemaining > 0 ? (
            <Text className="mt-3 text-center text-[#1B5E3A] text-sm">
              Code requested. You can ask for another one in {secondsRemaining}
              s.
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
