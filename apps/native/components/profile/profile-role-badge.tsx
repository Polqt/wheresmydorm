import React from "react";
import { Text, View } from "react-native";

type Role = "finder" | "lister" | null;

const ROLE_CONFIG: Record<
  NonNullable<Role>,
  { label: string; emoji: string; bg: string; text: string }
> = {
  finder: {
    label: "Finder",
    emoji: "🔍",
    bg: "#EEF5F1",
    text: "#0B4A30",
  },
  lister: {
    label: "Lister",
    emoji: "🏠",
    bg: "#FFF4E6",
    text: "#7C3500",
  },
};

type ProfileRoleBadgeProps = {
  role: Role;
};

export const ProfileRoleBadge = React.memo(function ProfileRoleBadge({
  role,
}: ProfileRoleBadgeProps) {
  if (!role) return null;
  const config = ROLE_CONFIG[role];

  return (
    <View
      className="flex-row items-center gap-1 rounded-full px-3 py-1"
      style={{ backgroundColor: config.bg }}
    >
      <Text style={{ fontSize: 11 }}>{config.emoji}</Text>
      <Text
        className="text-[12px] font-bold tracking-wide"
        style={{ color: config.text }}
      >
        {config.label}
      </Text>
    </View>
  );
});
