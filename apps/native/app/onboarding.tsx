import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Dimensions, FlatList, Pressable, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AnimatedDot } from "@/components/onboarding/animated-dot";
import { OnboardingSlide } from "@/components/onboarding/onboarding-slide";
import { ONBOARDING_SLIDES } from "@/lib/onboarding";
import { setOnboardingCompletion } from "@/services/onboarding";
import { useOnboardingStore } from "@/stores/onboarding";
import type { OnboardingSlide as OnboardingSlideItem } from "@/types/onboarding";

const { width: screenWidth } = Dimensions.get("window");

export default function OnboardingScreen() {
  const flatListRef = useRef<FlatList<OnboardingSlideItem>>(null);
  const insets = useSafeAreaInsets();
  const currentIndex = useOnboardingStore((state) => state.currentIndex);
  const resetCurrentIndex = useOnboardingStore(
    (state) => state.resetCurrentIndex,
  );
  const setCurrentIndex = useOnboardingStore((state) => state.setCurrentIndex);

  const contentContainerStyle = useMemo(
    () => ({
      flexGrow: 1,
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
    await setOnboardingCompletion();
    router.replace("/");
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
    [setCurrentIndex],
  );

  const renderSlide = useCallback(
    ({ item }: { item: OnboardingSlideItem }) => (
      <OnboardingSlide item={item} width={screenWidth} />
    ),
    [],
  );

  const keyExtractor = useCallback(
    (_item: OnboardingSlideItem, index: number) => String(index),
    [],
  );

  useEffect(() => {
    return () => {
      resetCurrentIndex();
    };
  }, [resetCurrentIndex]);

  return (
    <SafeAreaView className="flex-1 bg-[#04170E]">
      <StatusBar style="light" />

      <FlatList
        ref={flatListRef}
        contentContainerStyle={contentContainerStyle}
        data={ONBOARDING_SLIDES}
        horizontal
        keyExtractor={keyExtractor}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        pagingEnabled
        renderItem={renderSlide}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      />

      <Pressable
        className="absolute right-6"
        onPress={handleFinish}
        style={skipButtonStyle}
      >
        <Text className="text-sm text-white/70">Skip</Text>
      </Pressable>

      <View
        className="absolute right-0 left-0 flex-row justify-center gap-2"
        style={dotsStyle}
      >
        {ONBOARDING_SLIDES.map((_, index) => (
          <AnimatedDot key={String(index)} active={index === currentIndex} />
        ))}
      </View>

      <View
        className="absolute bottom-0 w-full px-6 pt-4"
        style={bottomAreaStyle}
      >
        {currentIndex < ONBOARDING_SLIDES.length - 1 ? (
          <Pressable
            className="h-14 w-full items-center justify-center rounded-full border border-white/25 bg-white/15"
            onPress={handleNext}
          >
            <Text className="font-semibold text-base text-white">Next</Text>
          </Pressable>
        ) : (
          <Pressable
            className="h-14 w-full items-center justify-center rounded-full bg-white"
            onPress={handleFinish}
          >
            <Text className="font-semibold text-base text-[#04170E]">
              Get Started
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
