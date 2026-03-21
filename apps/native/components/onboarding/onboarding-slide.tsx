import { Image } from "expo-image";
import React, { useMemo } from "react";
import { Text, View } from "react-native";

import type { OnboardingSlide as OnboardingSlideItem } from "@/types/onboarding";

type OnboardingSlideProps = {
  item: OnboardingSlideItem;
  width: number;
};

export const OnboardingSlide = React.memo(function OnboardingSlide({
  item,
  width,
}: OnboardingSlideProps) {
  const { body, heading, overline, theme } = item;
  const slideStyle = useMemo(
    () => ({
      width,
    }),
    [width],
  );
  const containerClassName =
    theme === "primary900"
      ? "h-full justify-center px-8 bg-[#04170E]"
      : theme === "primary700"
        ? "h-full justify-center px-8 bg-[#08331E]"
        : "h-full justify-center px-8 bg-[#0A4225]";

  return (
    <View className={containerClassName} style={slideStyle}>
      <View className="items-center">
        <View className="h-28 w-28 items-center justify-center rounded-[32px] border border-white/15 bg-white/10 p-4">
          <Image
            accessibilityLabel="WheresMyDorm logo"
            className="h-16 w-16"
            contentFit="contain"
            source={require("../../assets/icons/logo_white_fill.svg")}
          />
        </View>
      </View>

      <Text className="mt-10 text-center font-semibold text-[11px] text-white/50 tracking-[3px] uppercase">
        {overline}
      </Text>
      <Text className="mt-5 text-center font-bold text-[28px] text-white leading-[34px]">
        {heading}
      </Text>
      <Text className="mt-4 text-center text-base leading-7 text-white/70">
        {body}
      </Text>
    </View>
  );
});
