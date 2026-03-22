import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Dimensions, FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimatedDot } from "@/components/onboarding/animated-dot";
import { OnboardingSlide } from "@/components/onboarding/onboarding-slide";
import { ONBOARDING_SLIDES } from "@/lib/onboarding";
import { useAuth } from "@/providers/auth-provider";
import { setOnboardingCompletion } from "@/services/onboarding";
import { useOnboardingStore } from "@/stores/onboarding";
import type { OnboardingSlide as OnboardingSlideItem } from "@/types/onboarding";

const { width: screenWidth } = Dimensions.get("window");

export default function OnboardingScreen() {
  const flatListRef = useRef<FlatList<OnboardingSlideItem>>(null);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const currentIndex = useOnboardingStore((state) => state.currentIndex);
  const resetCurrentIndex = useOnboardingStore(
    (state) => state.resetCurrentIndex,
  );
  const setCurrentIndex = useOnboardingStore((state) => state.setCurrentIndex);
  const isLast = currentIndex === ONBOARDING_SLIDES.length - 1;

  const contentContainerStyle = useMemo(
    () => ({ flexGrow: 1 }),
    [],
  );

  const bottomAreaStyle = useMemo(
    () => ({
      paddingBottom: Math.max(insets.bottom + 8, 28),
    }),
    [insets.bottom],
  );

  const handleFinish = useCallback(async () => {
    await setOnboardingCompletion(user?.id);
    router.replace("/");
  }, [user?.id]);

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
    <View className="flex-1 bg-[#EEF5F1]">
      <StatusBar style="dark" />

      {/* Skip button — top right */}
      <View
        className="absolute right-5 z-10 items-end"
        style={{ top: insets.top + 14 }}
      >
        <Pressable
          className="rounded-full bg-white/70 px-4 py-2"
          onPress={handleFinish}
        >
          <Text className="text-[13px] font-semibold text-[#6A716A]">
            Skip
          </Text>
        </Pressable>
      </View>

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

      {/* Bottom nav */}
      <View className="px-6" style={bottomAreaStyle}>
        {/* Progress dots */}
        <View className="mb-6 flex-row justify-center gap-2">
          {ONBOARDING_SLIDES.map((_, index) => (
            <AnimatedDot key={String(index)} active={index === currentIndex} />
          ))}
        </View>

        {/* CTA button */}
        {isLast ? (
          <Pressable
            className="h-14 w-full items-center justify-center rounded-full bg-[#0B2D23]"
            onPress={handleFinish}
          >
            <Text className="font-semibold text-base text-white">
              Get started
            </Text>
          </Pressable>
        ) : (
          <Pressable
            className="h-14 w-full items-center justify-center rounded-full bg-[#0B2D23]"
            onPress={handleNext}
          >
            <Text className="font-semibold text-base text-white">
              Next
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
