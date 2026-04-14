import { Alert, Pressable, Text, View } from "react-native";

import {
  formatAdminDate,
  getRoleTone,
  getUserDisplayName,
  type AppRole,
} from "@/services/admin";
import type { AdminUserItem } from "@/types/platform";

type UserCardProps = {
  activeUserId: string | null;
  isBanPending: boolean;
  isBusy: boolean;
  isFinderPaidPending: boolean;
  item: AdminUserItem;
  onBanUser: (userId: string, banned: boolean) => void;
  onToggleFinderPaid: (userId: string, currentIsPaid: boolean) => void;
};

export function UserCard({
  activeUserId,
  isBanPending,
  isBusy,
  isFinderPaidPending,
  item,
  onBanUser,
  onToggleFinderPaid,
}: UserCardProps) {
  const tone = getRoleTone(item.role as AppRole);
  const isActive = activeUserId === item.id;
  const isBanActive = isActive && isBanPending;
  const isPaidActive = isActive && isFinderPaidPending;

  const handleBanPress = () => {
    Alert.alert(
      "Ban or unban user?",
      "This will toggle the ban state for this account.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Ban user",
          style: "destructive",
          onPress: () => onBanUser(item.id, true),
        },
        {
          text: "Unban user",
          onPress: () => onBanUser(item.id, false),
        },
      ],
    );
  };

  return (
    <View className="mb-3 rounded-[24px] bg-[#fffdf9] px-4 py-4">
      {/* Header row */}
      <View className="flex-row items-center gap-2">
        <View
          className="rounded-full px-2.5 py-1.5"
          style={{ backgroundColor: tone.bg }}
        >
          <Text
            className="text-[11px] font-extrabold capitalize"
            style={{ color: tone.text }}
          >
            {item.role}
          </Text>
        </View>

        {item.isPaidFinder ? (
          <View className="rounded-full bg-[#FFF7ED] px-2 py-1">
            <Text className="text-[10px] font-extrabold text-[#C2410C]">PAID</Text>
          </View>
        ) : null}

        <Text className="ml-auto text-[12px] font-semibold text-[#8B857C]">
          {formatAdminDate(item.createdAt)}
        </Text>
      </View>

      {/* User info */}
      <Text className="mt-2.5 text-base font-extrabold text-slate-900" numberOfLines={1}>
        {getUserDisplayName(item)}
      </Text>
      <Text className="mt-0.5 text-[11px] text-slate-400" numberOfLines={1}>
        {item.id}
      </Text>

      {/* Actions */}
      <View className="mt-3 flex-row gap-2.5">
        <Pressable
          className={`flex-1 items-center rounded-2xl bg-red-50 px-3.5 py-3 ${
            isBusy && isActive ? "opacity-45" : ""
          }`}
          disabled={isBusy}
          onPress={handleBanPress}
        >
          <Text className="text-[12px] font-extrabold text-red-700">
            {isBanActive ? "Updating..." : "Ban / Unban"}
          </Text>
        </Pressable>

        {item.role === "finder" ? (
          <Pressable
            className={`flex-1 items-center rounded-2xl bg-[#F0EBE3] px-3.5 py-3 ${
              isBusy && isActive ? "opacity-45" : ""
            }`}
            disabled={isBusy}
            onPress={() => onToggleFinderPaid(item.id, item.isPaidFinder)}
          >
            <Text className="text-[12px] font-extrabold text-slate-900">
              {isPaidActive
                ? "Updating..."
                : item.isPaidFinder
                  ? "Remove paid plan"
                  : "Grant paid plan"}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
