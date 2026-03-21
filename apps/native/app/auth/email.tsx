import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useState } from "react";
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

import { AUTH_TEXT_INPUT_CLASS_NAME, isValidEmail } from "@/lib/auth";
import { sendEmailOtp } from "@/services/auth";
import { useAuthFlowStore } from "@/stores/auth";

export default function EmailSignInScreen() {
  const insets = useSafeAreaInsets();
  const setPendingEmail = useAuthFlowStore((state) => state.setPendingEmail);
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();
  const canContinue = isValidEmail(email) && !isSubmitting;
  const bottomAreaStyle = useMemo(
    () => ({
      paddingBottom: insets.bottom,
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

  const handleContinue = useCallback(async () => {
    if (!isValidEmail(email)) {
      setErrorMessage("Enter a valid email address to continue.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const pendingEmail = await sendEmailOtp(email);
      setPendingEmail(pendingEmail);
      router.push("/auth/email-code");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to send your code.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [email, setPendingEmail]);

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
            Let&apos;s start with email
          </Text>
          <Text className="mt-2 text-center text-slate-400 text-sm">
            We&apos;ll send a secure code to your inbox.
          </Text>

          <View className="mt-10 w-full">
            <Text className="text-slate-500 text-sm">Email</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              className={AUTH_TEXT_INPUT_CLASS_NAME}
              keyboardType="email-address"
              onChangeText={handleEmailChange}
              placeholder="poyhidalgo@gmail.com"
              placeholderTextColor="#94a3b8"
              value={email}
            />
            <Text className="mt-2 text-slate-400 text-xs">
              We&apos;ll use {normalizedEmail || "your email"} to create and
              sync your WheresMyDorm profile.
            </Text>
          </View>

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
