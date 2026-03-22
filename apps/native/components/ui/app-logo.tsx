import { Image } from "expo-image";
import React from "react";
import { View } from "react-native";

type AppLogoProps = {
  className?: string;
  containerClassName?: string;
  size?: number;
};

export const AppLogo = React.memo(function AppLogo({
  containerClassName,
  size = 36,
}: AppLogoProps) {
  return (
    <View
      className={`items-center justify-center ${containerClassName ?? ""}`}
    >
      <Image
        accessibilityLabel="WheresMyDorm logo"
        contentFit="contain"
        source={require("../../assets/icons/logo_white_fill.svg")}
        style={{ height: size, width: size }}
      />
    </View>
  );
});
