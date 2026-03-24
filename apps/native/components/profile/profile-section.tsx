import { memo } from "react";
import { Text, View } from "react-native";

type ProfileSectionProps = {
  title?: string;
  children: React.ReactNode;
};

export const ProfileSection = memo(function ProfileSection({
  title,
  children,
}: ProfileSectionProps) {
  return (
    <View className="mt-6 px-5">
      {title ? (
        <Text className="mb-3 text-[11px] font-bold uppercase tracking-[1.6px] text-[#B0A898]">
          {title}
        </Text>
      ) : null}
      <View className="px-1">{children}</View>
    </View>
  );
});
