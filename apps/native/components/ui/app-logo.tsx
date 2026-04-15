import React from "react";
import { View } from "react-native";

import LogoWhiteFill from "@/assets/icons/logo_white_fill.svg";

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
    <View className={`items-center justify-center ${containerClassName ?? ""}`}>
      <LogoWhiteFill height={size} width={size} />
    </View>
  );
});
