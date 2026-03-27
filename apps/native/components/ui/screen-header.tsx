import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

type ScreenHeaderProps = {
  action?: ReactNode;
  subtitle?: string;
  title: string;
  withBackButton?: boolean;
};

export function ScreenHeader({
  action,
  subtitle,
  title,
  withBackButton = false,
}: ScreenHeaderProps) {
  return (
    <View className="px-[18px] pb-3.5 pt-3">
      <View className="flex-row items-start gap-3">
        {withBackButton ? (
          <Pressable
            className="mt-1 h-9 w-9 items-center justify-center rounded-[18px] bg-[#EEE8DE]"
            hitSlop={8}
            onPress={() => router.back()}
          >
            <Ionicons color="#1A1A1A" name="chevron-back" size={20} />
          </Pressable>
        ) : null}

        <View className="flex-1">
          <Text className="text-[32px] font-extrabold tracking-[-0.8px] text-[#111827]">
            {title}
          </Text>
          {subtitle ? (
            <Text
              className="mt-1 text-[14px] leading-5 text-[#6F685E]"
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {action ? <View className="mt-1.5 self-center">{action}</View> : null}
      </View>
    </View>
  );
}
