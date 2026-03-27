import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppLogo } from "./app-logo";

type AppLaunchScreenProps = {
  body: string;
  title: string;
  actions?: React.ReactNode;
};

export function AppLaunchScreen({
  body,
  title,
  actions,
}: AppLaunchScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 items-center justify-center bg-[#04170E]">
      <StatusBar style="light" />

      <AppLogo containerClassName="h-[200px] w-[200px]" size={112} />

      {title ? (
        <>
          {!actions ? (
            <ActivityIndicator
              color="rgba(255,255,255,0.35)"
              size="small"
              style={{ marginTop: 16 }}
            />
          ) : null}

          <Text className="mt-6 text-center font-bold text-[20px] leading-[26px] text-white">
            {title}
          </Text>
          {body ? (
            <Text className="mt-2 max-w-[280px] text-center text-sm leading-6 text-white/55">
              {body}
            </Text>
          ) : null}
        </>
      ) : null}

      {actions ? (
        <View
          className="absolute right-6 left-6"
          style={{ bottom: insets.bottom + 40 }}
        >
          <View className="gap-3">{actions}</View>
        </View>
      ) : null}
    </View>
  );
}

type LaunchScreenButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "ghost";
};

export function LaunchScreenButton({
  label,
  onPress,
  variant = "primary",
}: LaunchScreenButtonProps) {
  return (
    <Pressable
      className={`h-13 w-full items-center justify-center rounded-full ${
        variant === "primary"
          ? "bg-white"
          : "border border-white/25 bg-white/10"
      }`}
      onPress={onPress}
    >
      <Text
        className={`font-semibold text-[15px] ${
          variant === "primary" ? "text-[#04170E]" : "text-white/80"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
