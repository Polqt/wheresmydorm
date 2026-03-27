import { memo } from "react";
import { Text, View } from "react-native";

type Stat = { label: string; value: string };

const ProfileStat = memo(function ProfileStat({ label, value }: Stat) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-[20px] font-bold tracking-[-0.5px] text-[#1C1917]">{value}</Text>
      <Text className="mt-0.5 text-[11px] font-medium text-[#A8A29E]">{label}</Text>
    </View>
  );
});

type ProfileStatsRowProps = { stats: Stat[] };

export const ProfileStatsRow = memo(function ProfileStatsRow({ stats }: ProfileStatsRowProps) {
  return (
    <View className="flex-row items-center">
      {stats.map((stat, i) => (
        <View key={stat.label} className="flex-row flex-1 items-center">
          {i > 0 ? <View className="h-8 w-px bg-[#EAE5DE]" /> : null}
          <ProfileStat label={stat.label} value={stat.value} />
        </View>
      ))}
    </View>
  );
});
