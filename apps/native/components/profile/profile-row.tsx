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
  const labelColor = destructive ? "#DC2626" : "#1C1917";
  const iconColor = destructive ? "#DC2626" : "#0B4A30";
  const iconBg = destructive ? "#FEF2F2" : "#EEF5F1";

  return (
    <Pressable
      className={`flex-row items-center py-3.5 ${last ? "" : "border-b border-[#F5F0EA]"}`}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed && onPress ? 0.6 : 1 })}
    >
      <View
        className="mr-3 h-8 w-8 items-center justify-center rounded-lg"
        style={{ backgroundColor: iconBg }}
      >
        <Ionicons color={iconColor} name={icon} size={17} />
      </View>
      <Text className="flex-1 text-[15px] font-medium tracking-[-0.1px]" style={{ color: labelColor }}>
        {label}
      </Text>
      {value != null ? (
        <Text className="mr-2 max-w-[44%] text-right text-[13px] text-[#A8A29E]" numberOfLines={1}>
          {value || "Not set"}
        </Text>
      ) : null}
      {onPress ? (
        <Ionicons color="#C8C0B8" name="chevron-forward" size={15} />
      ) : null}
    </Pressable>
  );
});
