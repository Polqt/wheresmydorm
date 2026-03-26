import React, { useMemo } from "react";
import { Text, View } from "react-native";

import LogoWhiteFill from "@/assets/icons/logo_white_fill.svg";
import type { OnboardingSlide as OnboardingSlideItem } from "@/types/onboarding";

type OnboardingSlideProps = {
  item: OnboardingSlideItem;
  width: number;
};

const SLIDE_CONFIGS = {
  primary900: {
    bg: "#EEF5F1",
    badge: "#D4EAE0",
    badgeText: "#0B4A30",
    card: "#FFFFFF",
    overline: "#2E7D5A",
    heading: "#0F1A15",
    body: "#4A5E55",
    accent: "#0B2D23",
  },
  primary700: {
    bg: "#F0F4EC",
    badge: "#DCE9D5",
    badgeText: "#2E5A1E",
    card: "#FFFFFF",
    overline: "#3D7530",
    heading: "#141A10",
    body: "#4D5F48",
    accent: "#1A4A10",
  },
  primary500: {
    bg: "#F5F0E8",
    badge: "#EAE0D0",
    badgeText: "#5A3E10",
    card: "#FFFFFF",
    overline: "#7A5A20",
    heading: "#1A1510",
    body: "#5F5040",
    accent: "#5A3A10",
  },
} as const;

const SLIDE_STATS: Record<string, Array<{ label: string; value: string }>> = {
  primary900: [
    { label: "Listings nearby", value: "200+" },
    { label: "Avg. search time", value: "4 min" },
  ],
  primary700: [
    { label: "Filters available", value: "12+" },
    { label: "Avg. savings", value: "PHP 2k/mo" },
  ],
  primary500: [
    { label: "Reviews verified", value: "98%" },
    { label: "Response rate", value: "< 1 hr" },
  ],
};

export const OnboardingSlide = React.memo(function OnboardingSlide({
  item,
  width,
}: OnboardingSlideProps) {
  const { body, heading, overline, theme } = item;
  const config = SLIDE_CONFIGS[theme];
  const stats = SLIDE_STATS[theme] ?? [];

  const slideStyle = useMemo(
    () => ({ width, backgroundColor: config.bg }),
    [width, config.bg],
  );

  return (
    <View className="h-full justify-center px-6" style={slideStyle}>
      <View className="mb-8 items-center">
        <View
          className="h-[96px] w-[96px] items-center justify-center rounded-[30px]"
          style={{ backgroundColor: config.accent }}
        >
          <LogoWhiteFill height={52} width={52} />
        </View>
      </View>

      <View className="mb-4 items-center">
        <View
          className="rounded-full px-4 py-1.5"
          style={{ backgroundColor: config.badge }}
        >
          <Text
            className="text-[11px] font-bold uppercase tracking-[2px]"
            style={{ color: config.badgeText }}
          >
            {overline}
          </Text>
        </View>
      </View>

      <Text
        className="text-center font-bold text-[32px] leading-[40px]"
        style={{ color: config.heading }}
      >
        {heading}
      </Text>

      <Text
        className="mt-4 text-center text-[15px] leading-7"
        style={{ color: config.body }}
      >
        {body}
      </Text>

      <View className="mt-8 flex-row gap-3">
        {stats.map((stat) => (
          <View
            key={stat.label}
            className="flex-1 rounded-[22px] px-4 py-5"
            style={{ backgroundColor: config.card }}
          >
            <Text
              className="text-[11px] font-semibold uppercase tracking-[1.4px]"
              style={{ color: config.body }}
            >
              {stat.label}
            </Text>
            <Text
              className="mt-2 font-bold text-[28px]"
              style={{ color: config.heading }}
            >
              {stat.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
});
