import React from "react";
import { Text, View } from "react-native";

type ProfileStatProps = {
  label: string;
  value: string;
};

export const ProfileStat = React.memo(function ProfileStat({
  label,
  value,
}: ProfileStatProps) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-[20px] font-bold text-[#1A1A1A]">{value}</Text>
      <Text className="mt-0.5 text-[11px] text-[#A09A90]">{label}</Text>
    </View>
  );
});

type ProfileStatsRowProps = {
  stats: ProfileStatProps[];
};

export const ProfileStatsRow = React.memo(function ProfileStatsRow({
  stats,
}: ProfileStatsRowProps) {
  return (
    <View className="flex-row items-center">
      {stats.map((stat, i) => (
        <React.Fragment key={stat.label}>
          {i > 0 ? (
            <View className="h-8 w-px bg-[#EAE5DE]" />
          ) : null}
          <ProfileStat label={stat.label} value={stat.value} />
        </React.Fragment>
      ))}
    </View>
  );
});
