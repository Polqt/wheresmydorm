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

import GoogleIcon from "@/assets/icons/google.svg";
import type { ActiveProvider } from "@/types/auth";
import { AppLogo } from "./ui/app-logo";

type SignInFormProps = {
  activeProvider: ActiveProvider;
  errorMessage: string | null;
  onContinueWithEmail: () => void;
  onContinueWithFacebook: () => void;
  onContinueWithGoogle: () => void;
};

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
      className="h-[54px] w-full flex-row items-center rounded-2xl border border-[#E2DBD0] bg-white px-4"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      {isLoading ? (
        <View className="flex-1 items-center">
          <ActivityIndicator color="#2D6A4F" size="small" />
        </View>
      ) : (
        <>
          <View className="h-9 w-9 items-center justify-center rounded-xl">
            {icon}
          </View>
          <View className="flex-1 items-center pr-9">
            <Text className="text-[15px] font-semibold tracking-[-0.2px] text-[#1C1917]">
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
    () => ({ paddingBottom: Math.max(insets.bottom + 16, 32) }),
    [insets.bottom],
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F5F0E8]">
      <StatusBar style="dark" />

      <View className="flex-1 px-6" style={footerStyle}>
        <View className="flex-1 items-center justify-center">
          <View
            className="mb-8 h-[120px] w-[120px] items-center justify-center rounded-[36px]"
            style={{
              backgroundColor: "#0B2D23",
              shadowColor: "#0B2D23",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.3,
              shadowRadius: 24,
              elevation: 16,
            }}
          >
            <AppLogo size={60} />
          </View>

          <Text className="text-center text-[32px] font-bold leading-[38px] tracking-[-0.8px] text-[#1C1917]">
            Find a place that{"\n"}feels right.
          </Text>
          <Text className="mt-3 text-center text-[15px] leading-[22px] text-[#78716C]">
            Browse listings, message listers,{"\n"}and keep your search organized.
          </Text>
        </View>

        <View className="gap-3">
          <SocialButton
            disabled={isLoading}
            icon={<GoogleIcon height={20} width={20} />}
            isLoading={activeProvider === "google"}
            label="Continue with Google"
            onPress={onContinueWithGoogle}
          />

          <SocialButton
            disabled={isLoading}
            icon={<Ionicons color="#1877F2" name="logo-facebook" size={20} />}
            isLoading={activeProvider === "facebook"}
            label="Continue with Facebook"
            onPress={onContinueWithFacebook}
          />

          <View className="my-1 flex-row items-center gap-3">
            <View className="h-px flex-1 bg-[#D6CFC4]" />
            <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#A8A29E]">
              or
            </Text>
            <View className="h-px flex-1 bg-[#D6CFC4]" />
          </View>

          <Pressable
            className="h-[54px] w-full items-center justify-center rounded-2xl"
            disabled={isLoading}
            onPress={onContinueWithEmail}
            style={({ pressed }) => ({
              backgroundColor: "#0B2D23",
              opacity: pressed ? 0.85 : 1,
              shadowColor: "#0B2D23",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 6,
            })}
          >
            <Text className="text-[15px] font-semibold tracking-[-0.2px] text-white">
              Continue with email
            </Text>
          </Pressable>

          {errorMessage ? (
            <View className="mt-1 rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3.5">
              <View className="flex-row items-start gap-2.5">
                <Ionicons color="#DC2626" name="alert-circle-outline" size={16} style={{ marginTop: 1 }} />
                <Text className="flex-1 text-[13px] leading-5 text-[#DC2626]">
                  {errorMessage}
                </Text>
              </View>
            </View>
          ) : null}

          <Text className="mt-2 text-center text-[11px] leading-4 text-[#A8A29E]">
            By continuing you agree to our{" "}
            <Text className="text-[#57534E] underline">Terms</Text>
            {" "}and{" "}
            <Text className="text-[#57534E] underline">Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
