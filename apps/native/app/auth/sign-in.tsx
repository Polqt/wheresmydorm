import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AUTH_TERMS_COPY, SOCIAL_BUTTON_CLASS_NAME } from "@/lib/auth";
import { signInWithOAuth } from "@/services/auth";
import type { ActiveProvider, OAuthProvider } from "@/types/auth";

function getProviderLabel(provider: OAuthProvider) {
  return provider === "google" ? "Google" : "Facebook";
}

export default function NativeSignInScreen() {
  const insets = useSafeAreaInsets();
  const [activeProvider, setActiveProvider] = useState<ActiveProvider>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLoading = activeProvider !== null;
  const footerStyle = useMemo(
    () => ({
      bottom: insets.bottom,
    }),
    [insets.bottom],
  );

  const handleOAuthSignIn = useCallback(async (provider: OAuthProvider) => {
    setActiveProvider(provider);
    setErrorMessage(null);

    try {
      const didComplete = await signInWithOAuth(provider);

      if (didComplete) {
        router.replace("/auth/role-select");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : `${getProviderLabel(provider)} sign-in failed.`,
      );
    } finally {
      setActiveProvider(null);
    }
  }, []);

  const handleGoogleSignIn = useCallback(() => {
    void handleOAuthSignIn("google");
  }, [handleOAuthSignIn]);

  const handleFacebookSignIn = useCallback(() => {
    void handleOAuthSignIn("facebook");
  }, [handleOAuthSignIn]);

  const handleContinueWithEmail = useCallback(() => {
    router.push("/auth/email");
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="flex-1 px-6">
        <View className="flex-1" />

        <View className="items-center">
          <Image
            accessibilityLabel="WheresMyDorm logo"
            className="h-16 w-16"
            contentFit="contain"
            source={require("../../assets/images/logo.svg")}
          />
          <Text className="mt-6 text-center font-black text-2xl text-brand-primary-900">
            Sign in to discover trusted{"\n"}dorms near campus
          </Text>
        </View>

        <View className="mt-8">
          <Pressable
            className={SOCIAL_BUTTON_CLASS_NAME}
            disabled={isLoading}
            onPress={handleGoogleSignIn}
          >
            {activeProvider === "google" ? (
              <View className="w-full items-center">
                <ActivityIndicator color="#5b6fd1" size="small" />
              </View>
            ) : (
              <>
                <Image
                  accessibilityLabel="Google icon"
                  className="h-6 w-6"
                  contentFit="cover"
                  source={{ uri: "https://www.google.com/favicon.ico" }}
                />
                <Text className="ml-4 font-semibold text-base text-slate-800">
                  Continue with Google
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            className={SOCIAL_BUTTON_CLASS_NAME}
            disabled={isLoading}
            onPress={handleFacebookSignIn}
          >
            {activeProvider === "facebook" ? (
              <View className="w-full items-center">
                <ActivityIndicator color="#5b6fd1" size="small" />
              </View>
            ) : (
              <>
                <View className="h-7 w-7 items-center justify-center rounded-full bg-[#1877F2]">
                  <Text className="font-black text-base text-white">f</Text>
                </View>
                <Text className="ml-4 font-semibold text-base text-slate-800">
                  Continue with Facebook
                </Text>
              </>
            )}
          </Pressable>

          <View className="mt-6 flex-row items-center gap-3">
            <View className="h-px flex-1 bg-slate-200" />
            <Text className="text-slate-400 text-sm">or</Text>
            <View className="h-px flex-1 bg-slate-200" />
          </View>

          <Pressable
            className="mt-4 h-14 w-full items-center justify-center rounded-2xl bg-brand-primary-900"
            disabled={isLoading}
            onPress={handleContinueWithEmail}
          >
            <Text className="font-bold text-base text-white">
              Continue with email
            </Text>
          </Pressable>

          {errorMessage ? (
            <View className="mt-4 rounded-xl bg-red-50 p-3">
              <Text className="text-center text-red-600 text-sm">
                {errorMessage}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="flex-1" />
      </View>

      <View className="absolute right-0 left-0 px-8" style={footerStyle}>
        <Text className="text-center text-slate-400 text-xs leading-5">
          {AUTH_TERMS_COPY}
        </Text>
      </View>
    </SafeAreaView>
  );
}
