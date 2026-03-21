import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Dimensions, FlatList, Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get("window");

const SLIDES = [
  {
    bg: "bg-brand-primary-900",
    body: "Browse hundreds of verified dorms and rentals on an interactive map.",
    bodyColor: "text-brand-primary-300",
    emoji: "🗺️",
    heading: "Find your next home",
    headingColor: "text-white",
  },
  {
    bg: "bg-brand-primary-700",
    body: "Our assistant finds listings that match your budget, location, and amenities.",
    bodyColor: "text-brand-primary-100",
    emoji: "🤖",
    heading: "Ask AI anything",
    headingColor: "text-white",
  },
  {
    bg: "bg-brand-primary-500",
    body: "Only verified renters can leave reviews — no fake ratings, ever.",
    bodyColor: "text-white/80",
    emoji: "⭐",
    heading: "Reviews you can trust",
    headingColor: "text-white",
  },
] as const;

type SlideItem = (typeof SLIDES)[number];

type OnboardingSlideProps = {
  item: SlideItem;
  width: number;
};

type AnimatedDotProps = {
  active: boolean;
};

const OnboardingSlide = React.memo(function OnboardingSlide({
  item,
  width,
}: OnboardingSlideProps) {
  const { bg, body, bodyColor, emoji, heading, headingColor } = item;
  const slideStyle = useMemo(
    () => ({
      width,
    }),
    [width],
  );

  return (
    <View
      className={`flex-1 items-center justify-center px-8 ${bg}`}
      style={slideStyle}
    >
      <Text className="text-center text-8xl">{emoji}</Text>
      <Text className={`mt-8 text-center font-black text-3xl ${headingColor}`}>
        {heading}
      </Text>
      <Text className={`mt-4 text-center text-base leading-7 ${bodyColor}`}>
        {body}
      </Text>
    </View>
  );
});

const AnimatedDot = React.memo(function AnimatedDot({
  active,
}: AnimatedDotProps) {
  const scaleX = useDerivedValue(() => {
    return withSpring(active ? 1 : 0.33);
  }, [active]);
  const opacity = useDerivedValue(() => {
    return withSpring(active ? 1 : 0.3);
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scaleX: scaleX.value }],
    };
  });

  return (
    <Animated.View
      className="h-2 w-6 rounded-full bg-white"
      style={animatedStyle}
    />
  );
});

export default function OnboardingScreen() {
  const flatListRef = useRef<FlatList<SlideItem>>(null);
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);

  const contentContainerStyle = useMemo(
    () => ({
      paddingBottom: insets.bottom,
    }),
    [insets.bottom],
  );

  const skipButtonStyle = useMemo(
    () => ({
      top: insets.top + 12,
    }),
    [insets.top],
  );

  const dotsStyle = useMemo(
    () => ({
      bottom: insets.bottom + 96,
    }),
    [insets.bottom],
  );

  const bottomAreaStyle = useMemo(
    () => ({
      paddingBottom: insets.bottom,
    }),
    [insets.bottom],
  );

  const handleFinish = useCallback(async () => {
    await SecureStore.setItemAsync("onboarding_complete", "true");
    router.replace("/(tabs)/map");
  }, []);

  const handleNext = useCallback(() => {
    flatListRef.current?.scrollToIndex({
      animated: true,
      index: currentIndex + 1,
    });
  }, [currentIndex]);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
      setCurrentIndex(index);
    },
    [],
  );

  const renderSlide = useCallback(
    ({ item }: { item: SlideItem }) => (
      <OnboardingSlide item={item} width={screenWidth} />
    ),
    [],
  );

  const keyExtractor = useCallback(
    (_item: SlideItem, index: number) => String(index),
    [],
  );

  return (
    <SafeAreaView className="flex-1 bg-brand-primary-900">
      <StatusBar style="light" />

      <FlatList
        ref={flatListRef}
        contentContainerStyle={contentContainerStyle}
        data={SLIDES}
        horizontal
        keyExtractor={keyExtractor}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        pagingEnabled
        renderItem={renderSlide}
        showsHorizontalScrollIndicator={false}
      />

      <Pressable
        className="absolute right-6"
        onPress={handleFinish}
        style={skipButtonStyle}
      >
        <Text className="text-sm text-white/60">Skip</Text>
      </Pressable>

      <View
        className="absolute right-0 left-0 flex-row justify-center gap-2"
        style={dotsStyle}
      >
        {SLIDES.map((_, index) => (
          <AnimatedDot key={String(index)} active={index === currentIndex} />
        ))}
      </View>

      <View
        className="absolute bottom-0 w-full px-6 pt-4"
        style={bottomAreaStyle}
      >
        {currentIndex < SLIDES.length - 1 ? (
          <Pressable
            className="h-14 w-full items-center justify-center rounded-2xl border border-white/30 bg-white/20"
            onPress={handleNext}
          >
            <Text className="font-bold text-base text-white">Next</Text>
          </Pressable>
        ) : (
          <Pressable
            className="h-14 w-full items-center justify-center rounded-2xl bg-white"
            onPress={handleFinish}
          >
            <Text className="font-black text-base text-brand-primary-900">
              Get Started
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
