import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { paymentsRoute } from "@/utils/routes";

export function QuotaUpgradeBanner({
  isPaid,
  remainingFinds,
}: {
  isPaid: boolean;
  remainingFinds: number;
}) {
  if (isPaid || remainingFinds > 10) return null;

  return (
    <Pressable
      className="flex-row items-center gap-2 rounded-[14px] border border-[#FED7AA] bg-[#FFF7ED] px-3.5 py-2.5"
      onPress={() => router.push(paymentsRoute())}
    >
      <Ionicons color="#C2410C" name="flash-outline" size={14} />
      <Text className="flex-1 font-bold text-[#C2410C] text-[12px]">
        {remainingFinds} find{remainingFinds !== 1 ? "s" : ""} left · Upgrade
        for unlimited
      </Text>
      <Ionicons color="#C2410C" name="chevron-forward" size={14} />
    </Pressable>
  );
}
