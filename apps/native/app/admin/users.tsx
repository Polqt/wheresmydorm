import FontAwesome from "@expo/vector-icons/FontAwesome";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { UserCard } from "@/components/admin/user-card";
import { useAdminUsers } from "@/hooks/use-admin-users";
import { useAuth } from "@/providers/auth-provider";
import { ROLE_FILTERS } from "@/services/admin";
import type { AdminUserItem } from "@/types/platform";

export default function AdminUsersScreen() {
  const { role } = useAuth();
  const insets = useSafeAreaInsets();
  const {
    activeUserId,
    feedback,
    isBanPending,
    isBusy,
    isFinderPaidPending,
    isLoading,
    items,
    roleFilter,
    setRoleFilter,
    onBanUser,
    onToggleFinderPaid,
  } = useAdminUsers();

  if (role !== "admin") {
    return (
      <View
        className="flex-1 items-center justify-center bg-[#f7f4ee]"
        style={{ paddingTop: insets.top }}
      >
        <Text className="font-semibold text-[#9E9890] text-[13px]">
          Admin access is required.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#f7f4ee]" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center border-[#E7E0D5] border-b bg-[#fffdf9] px-4 py-3.5">
        <Pressable
          className="h-9 w-9 items-center justify-center rounded-full bg-[#F0EBE3]"
          onPress={() => router.back()}
        >
          <FontAwesome color="#0f172a" name="arrow-left" size={16} />
        </Pressable>
        <Text className="flex-1 text-center font-extrabold text-base text-slate-900">
          Users
        </Text>
        <View className="w-9" />
      </View>

      {/* Summary */}
      <View className="mx-4 mt-3.5 rounded-3xl bg-[#fffdf9] px-4 py-4">
        <Text className="font-extrabold text-slate-900 text-xl">
          {items.length} users loaded
        </Text>
        <Text className="mt-1 text-[#706A5F] text-[13px] leading-5">
          Ban, unban, or adjust finder plan status for any account.
        </Text>
      </View>

      {/* Role filters */}
      <View className="mt-3 flex-row flex-wrap gap-2 px-4">
        {ROLE_FILTERS.map((filter) => (
          <Pressable
            key={filter}
            className={`rounded-full px-3.5 py-2 ${
              roleFilter === filter ? "bg-slate-900" : "bg-[#E7E5E4]"
            }`}
            onPress={() => setRoleFilter(filter)}
          >
            <Text
              className={`font-bold text-[12px] ${
                roleFilter === filter ? "text-white" : "text-slate-700"
              }`}
            >
              {filter === "all"
                ? "All"
                : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Feedback banner */}
      {feedback ? (
        <View
          className={`mx-4 mt-2.5 rounded-[18px] px-3.5 py-3 ${
            feedback.tone === "success" ? "bg-[#ECFDF3]" : "bg-[#FEF2F2]"
          }`}
        >
          <Text
            className={`font-bold text-[13px] ${
              feedback.tone === "success" ? "text-[#166534]" : "text-red-700"
            }`}
          >
            {feedback.message}
          </Text>
        </View>
      ) : null}

      {/* List */}
      <FlashList
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 24,
          paddingTop: 12,
        }}
        data={items}
        keyExtractor={(item: AdminUserItem) => item.id}
        ListEmptyComponent={
          <Text className="py-8 text-center font-semibold text-[#9E9890] text-[13px]">
            {isLoading ? "Loading users..." : "No users found"}
          </Text>
        }
        renderItem={({ item }: { item: AdminUserItem }) => (
          <UserCard
            activeUserId={activeUserId}
            isBanPending={isBanPending}
            isBusy={isBusy}
            isFinderPaidPending={isFinderPaidPending}
            item={item}
            onBanUser={onBanUser}
            onToggleFinderPaid={onToggleFinderPaid}
          />
        )}
      />
    </View>
  );
}
