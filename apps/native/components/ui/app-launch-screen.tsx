import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { AppLogo } from "./app-logo";

type AppLaunchScreenProps = {
  body: string;
  title: string;
  actions?: React.ReactNode;
};

export function AppLaunchScreen({ body, title, actions }: AppLaunchScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-[#04170E] px-8">
      <StatusBar style="light" />
      <AppLogo
        className="h-20 w-20"
        containerClassName="rounded-[32px] border border-white/15 bg-white/10 p-4"
      />
      <ActivityIndicator className="mt-6" color="#ffffff" size="small" />
      <Text className="mt-6 text-center font-semibold text-2xl text-white">
        {title}
      </Text>
      <Text className="mt-3 text-center text-sm leading-6 text-white/70">
        {body}
      </Text>
      {actions ? <View className="mt-6 w-full gap-3">{actions}</View> : null}
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
      className={`h-12 w-full items-center justify-center rounded-full ${
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
