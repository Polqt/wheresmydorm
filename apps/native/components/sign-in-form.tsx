import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import { StatusBar } from "expo-status-bar";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AUTH_TERMS_COPY } from "@/lib/auth";
import type { SignInFormProps } from "@/types/auth";
import { AppLogo } from "./ui/app-logo";

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
      className="h-[52px] w-full flex-row items-center rounded-xl border border-[#E8E3DC] bg-white"
      disabled={disabled}
      onPress={onPress}
    >
      {isLoading ? (
        <View className="flex-1 items-center">
          <ActivityIndicator color="#1A1A1A" size="small" />
        </View>
      ) : (
        <>
          <View className="absolute left-4 h-6 w-6 items-center justify-center">
            {icon}
          </View>
          <View className="flex-1 items-center">
            <Text className="font-semibold text-[15px] text-[#1A1A1A]">
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
    () => ({ paddingBottom: Math.max(insets.bottom + 8, 24) }),
    [insets.bottom],
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="flex-1 px-6">
        <View className="items-center pt-10">
          <AppLogo containerClassName="h-200 w-200 rounded-[22px]" size={38} />
        </View>

        <Text className="mt-7 text-center font-bold text-[26px] leading-[32px] text-[#1A1A1A]">
          Sign up or log in{"\n"}to start exploring
        </Text>

        <View className="mt-9 gap-[10px]">
          <SocialButton
            disabled={isLoading}
            icon={
              <Image
                contentFit="contain"
                source={require("../assets/icons/google.svg")}
                style={{ height: 20, width: 20 }}
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
        </View>

        {/* Divider */}
        <View className="my-5 flex-row items-center gap-3">
          <View className="h-[1px] flex-1 bg-[#E8E3DC]" />
          <Text className="text-[13px] text-[#A09A90]">or</Text>
          <View className="h-[1px] flex-1 bg-[#E8E3DC]" />
        </View>

        {/* Email CTA */}
        <Pressable
          className="h-[52px] w-full items-center justify-center rounded-xl bg-[#04170E]"
          disabled={isLoading}
          onPress={onContinueWithEmail}
        >
          {isLoading && activeProvider === null ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text className="font-semibold text-[15px] text-white">
              Continue with email
            </Text>
          )}
        </Pressable>

        {errorMessage ? (
          <View className="mt-4 rounded-xl bg-red-50 px-4 py-3">
            <Text className="text-center text-[13px] leading-5 text-red-600">
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {/* Spacer */}
        <View className="flex-1" />
      </View>

      {/* Terms */}
      <View className="px-8" style={footerStyle}>
        <Text className="text-center text-[11px] leading-[18px] text-[#B0A898]">
          {AUTH_TERMS_COPY}
        </Text>
      </View>
    </SafeAreaView>
  );
}
