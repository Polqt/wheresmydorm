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
    <View className="mt-4">
      {title ? (
        <Text className="mb-2 text-[11px] font-bold uppercase tracking-[1.4px] text-[#A8A29E]">
          {title}
        </Text>
      ) : null}
      <View
        className="rounded-2xl bg-white px-4"
        style={{
          boxShadow: "0 1px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        {children}
      </View>
    </View>
  );
});
