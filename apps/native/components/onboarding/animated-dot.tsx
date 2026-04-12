import React from "react";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";

type AnimatedDotProps = {
  active: boolean;
};

export const AnimatedDot = React.memo(function AnimatedDot({
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
      opacity: opacity.get(),
      transform: [{ scaleX: scaleX.get() }],
    };
  });

  return (
    <Animated.View
      className="h-2 w-6 rounded-full bg-[#0B2D23]"
      style={animatedStyle}
    />
  );
});
