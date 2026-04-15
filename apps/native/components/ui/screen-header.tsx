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
    <View className="px-[18px] pt-3 pb-3.5">
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
          <Text className="font-extrabold text-[#111827] text-[32px] tracking-[-0.8px]">
            {title}
          </Text>
          {subtitle ? (
            <Text
              className="mt-1 text-[#6F685E] text-[14px] leading-5"
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
