import { Image } from "expo-image";
import React from "react";
import { View } from "react-native";

type AppLogoProps = {
  className: string;
  containerClassName?: string;
};

export const AppLogo = React.memo(function AppLogo({
  className,
  containerClassName,
}: AppLogoProps) {
  return (
    <View
      className={`items-center justify-center rounded-[22px] bg-[#04170E] p-3 ${
        containerClassName ?? ""
      }`}
    >
      <Image
        accessibilityLabel="WheresMyDorm logo"
        className={className}
        contentFit="contain"
        source={require("../../assets/icons/logo_white_fill.svg")}
      />
    </View>
  );
});
