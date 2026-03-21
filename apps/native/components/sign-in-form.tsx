import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import { StatusBar } from "expo-status-bar";
import React, { useMemo } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AUTH_TERMS_COPY } from "@/lib/auth";
import type { SignInFormProps } from "@/types/auth";

type SocialButtonProps = {
  disabled: boolean;
  icon: React.ReactNode;
  isLoading: boolean;
  label: string;
  onPress: () => void;
};

const SocialButton = React.memo(function SocialButton({
  disabled,
  icon,
  isLoading,
  label,
  onPress,
}: SocialButtonProps) {
  return (
    <Pressable
      className="mt-3 h-14 w-full justify-center rounded-full border border-[#E0E0E0] bg-white px-5"
      disabled={disabled}
      onPress={onPress}
    >
      {isLoading ? (
        <View className="w-full items-center">
          <ActivityIndicator color="#04170E" size="small" />
        </View>
      ) : (
        <>
          <View className="absolute left-5 h-8 w-8 items-center justify-center">
            {icon}
          </View>
          <View className="w-full items-center">
            <Text className="font-semibold text-[16px] text-[#1A1A1A]">
              {label}
            </Text>
          </View>
        </>
      )}
    </Pressable>
  );
});

export function SignInForm({
  activeProvider,
  errorMessage,
  onContinueWithEmail,
  onContinueWithFacebook,
  onContinueWithGoogle,
}: SignInFormProps) {
  const insets = useSafeAreaInsets();
  const isLoading = activeProvider !== null;
  const footerStyle = useMemo(
    () => ({
      bottom: insets.bottom + 12,
    }),
    [insets.bottom],
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="flex-1 px-6 pt-6">
        <View className="items-center mt-8">
          <View className="h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-[#04170E] p-3">
            <Image
              accessibilityLabel="WheresMyDorm logo"
              className="h-12 w-12"
              contentFit="contain"
              source={require("../assets/icons/logo_white_fill.svg")}
            />
          </View>
          <Text className="mt-7 text-center font-bold text-[28px] text-[#1A1A1A] leading-[34px]">
            Sign up or log in{"\n"}to start exploring
          </Text>
        </View>

        <View className="mt-10">
          <SocialButton
            disabled={isLoading}
            icon={
              <Image
                accessibilityLabel="Google icon"
                className="h-5 w-5"
                contentFit="contain"
                source={require("../assets/icons/google.svg")}
              />
            }
            isLoading={activeProvider === "google"}
            label="Continue with Google"
            onPress={onContinueWithGoogle}
          />

          <SocialButton
            disabled={isLoading}
            icon={<Ionicons color="#1877F2" name="logo-facebook" size={22} />}
            isLoading={activeProvider === "facebook"}
            label="Continue with Facebook"
            onPress={onContinueWithFacebook}
          />

          <View className="mt-5 flex-row items-center">
            <View className="flex-1 h-[1px] bg-[#E0E0E0]" />
            <Text className="mx-4 text-[#9A9A9A] text-sm">or</Text>
            <View className="flex-1 h-[1px] bg-[#E0E0E0]" />
          </View>

          <Pressable
            className="mt-5 h-14 w-full items-center justify-center rounded-full bg-[#04170E]"
            disabled={isLoading}
            onPress={onContinueWithEmail}
          >
            {isLoading && activeProvider === null ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text className="font-semibold text-[16px] text-white">
                Continue with email
              </Text>
            )}
          </Pressable>

          {errorMessage ? (
            <View className="mt-4 rounded-xl bg-red-500/10 px-4 py-3">
              <Text className="text-center text-red-600 text-sm leading-5">
                {errorMessage}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="flex-1" />
      </View>

      <View className="absolute right-0 left-0 px-8" style={footerStyle}>
        <Text className="text-center text-[#B0B0B0] text-xs leading-5">
          {AUTH_TERMS_COPY}
        </Text>
      </View>
    </SafeAreaView>
  );
}
