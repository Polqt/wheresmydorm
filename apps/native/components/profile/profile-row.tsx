import Ionicons from "@expo/vector-icons/Ionicons";
import { memo } from "react";
import { Pressable, Text, View } from "react-native";

type ProfileRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | null;
  onPress?: () => void;
  destructive?: boolean;
  last?: boolean;
};

export const ProfileRow = memo(function ProfileRow({
  icon,
  label,
  value,
  onPress,
  destructive = false,
  last = false,
}: ProfileRowProps) {
  const labelColor = destructive ? "#EF4444" : "#1A1A1A";
  const iconColor = destructive ? "#EF4444" : "#A09A90";

  return (
    <Pressable
      className={`flex-row items-center py-3.5 ${last ? "" : "border-b border-[#F5F0EA]"}`}
      onPress={onPress}
    >
      <View className="mr-3 h-8 w-8 items-center justify-center">
        <Ionicons color={iconColor} name={icon} size={19} />
      </View>
      <Text className="flex-1 text-[15px] font-medium" style={{ color: labelColor }}>
        {label}
      </Text>
      {value != null ? (
        <Text className="mr-2 max-w-[44%] text-right text-[13px] text-[#A09A90]" numberOfLines={1}>
          {value || "Not set"}
        </Text>
      ) : null}
      {onPress ? (
        <Ionicons color="#D0CAC0" name="chevron-forward" size={15} />
      ) : null}
    </Pressable>
  );
});
