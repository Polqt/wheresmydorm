import { memo } from "react";
import { Text, View } from "react-native";

type Stat = { label: string; value: string };

const ProfileStat = memo(function ProfileStat({ label, value }: Stat) {
  return (
    <View className="flex-1 items-center">
      <Text className="font-bold text-[#1C1917] text-[20px] tracking-[-0.5px]">
        {value}
      </Text>
      <Text className="mt-0.5 font-medium text-[#A8A29E] text-[11px]">
        {label}
      </Text>
    </View>
  );
});

type ProfileStatsRowProps = { stats: Stat[] };

export const ProfileStatsRow = memo(function ProfileStatsRow({
  stats,
}: ProfileStatsRowProps) {
  return (
    <View className="flex-row items-center">
      {stats.map((stat, i) => (
        <View key={stat.label} className="flex-1 flex-row items-center">
          {i > 0 ? <View className="h-8 w-px bg-[#EAE5DE]" /> : null}
          <ProfileStat label={stat.label} value={stat.value} />
        </View>
      ))}
    </View>
  );
});
