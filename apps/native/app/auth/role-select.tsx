import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AppLogo } from "@/components/ui/app-logo";
import { ROLE_CARDS } from "@/lib/auth";
import { useAuth } from "@/providers/auth-provider";
import { setCurrentProfileRole } from "@/services/profile";
import { useAuthFlowStore } from "@/stores/auth";
import type { RoleCardProps, RoleOption } from "@/types/auth";

const RoleCard = React.memo(function RoleCard({
  card,
  disabled,
  isSelected,
  onSelect,
}: RoleCardProps) {
  const { emoji, role, subtitle, title } = card;
  const handlePress = useCallback(() => onSelect(role), [onSelect, role]);

  return (
    <Pressable
      className={`w-full flex-row items-center gap-4 rounded-2xl border p-5 ${
        isSelected
          ? "border-[#0B2D23] bg-[#EEF5F1]"
          : "border-[#EAE5DE] bg-white"
      }`}
      disabled={disabled}
      onPress={handlePress}
    >
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#F5F0E8]">
        <Text className="text-2xl">{emoji}</Text>
      </View>

      <View className="flex-1">
        <Text className="font-bold text-[16px] text-[#1A1A1A]">{title}</Text>
        <Text className="mt-0.5 text-[13px] leading-5 text-[#8A8480]">
          {subtitle}
        </Text>
      </View>

      <View
        className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
          isSelected ? "border-[#0B2D23] bg-[#0B2D23]" : "border-[#D0C9C0]"
        }`}
      >
        {isSelected ? (
          <Ionicons color="#ffffff" name="checkmark" size={13} />
        ) : null}
      </View>
    </Pressable>
  );
});

export default function RoleSelectScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const setAwaitingRoleSync = useAuthFlowStore(
    (state) => state.setAwaitingRoleSync,
  );

  const setRoleMutation = useMutation({
    mutationFn: async ({ role }: { role: RoleOption }) => {
      if (!user) throw new Error("Session expired. Please sign in again.");
      return setCurrentProfileRole(user.id, role);
    },
  });

  const bottomAreaStyle = useMemo(
    () => ({ paddingBottom: Math.max(insets.bottom + 8, 24) }),
    [insets.bottom],
  );

  const handleBack = useCallback(() => router.replace("/auth/sign-in"), []);

  const handleSelectRole = useCallback(
    (nextRole: RoleOption) => setSelectedRole(nextRole),
    [],
  );

  const handleContinue = useCallback(() => {
    if (!selectedRole) return;
    setRoleMutation.mutate(
      { role: selectedRole },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["auth-profile"] });
          setAwaitingRoleSync();
          router.replace("/auth/profile-setup");
        },
      },
    );
  }, [queryClient, selectedRole, setAwaitingRoleSync, setRoleMutation]);

  return (
    <SafeAreaView className="flex-1 bg-[#FAF8F5]">
      <StatusBar style="dark" />

      <View className="flex-1">
        {/* Nav */}
        <View className="flex-row items-center px-4 pt-2">
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full bg-white border border-[#EAE5DE]"
            onPress={handleBack}
          >
            <Ionicons color="#1A1A1A" name="chevron-back" size={20} />
          </Pressable>
        </View>

        <View className="flex-1 px-5 pt-6">
          {/* Logo + header */}
          <View className="items-center">
            <AppLogo containerClassName="h-[60px] w-[60px] rounded-[18px]" size={32} />
          </View>

          <Text className="mt-6 text-center font-bold text-[28px] leading-[34px] text-[#1A1A1A]">
            How will you use{"\n"}WheresMyDorm?
          </Text>
          <Text className="mt-2 text-center text-[14px] leading-6 text-[#8A8480]">
            Pick the path that fits you best. You can switch roles later in settings.
          </Text>

          {/* Role cards */}
          <View className="mt-8 gap-3">
            {ROLE_CARDS.map((card) => (
              <RoleCard
                key={card.role}
                card={card}
                disabled={setRoleMutation.isPending}
                isSelected={selectedRole === card.role}
                onSelect={handleSelectRole}
              />
            ))}
          </View>

          {setRoleMutation.error ? (
            <Text className="mt-4 text-center text-[13px] text-red-500">
              {setRoleMutation.error.message}
            </Text>
          ) : null}
        </View>

        {/* Continue button */}
        <View className="px-5" style={bottomAreaStyle}>
          <Pressable
            className={`h-[52px] w-full items-center justify-center rounded-xl ${
              selectedRole && !setRoleMutation.isPending
                ? "bg-[#04170E]"
                : "bg-[#E8E3DC]"
            }`}
            disabled={!selectedRole || setRoleMutation.isPending}
            onPress={handleContinue}
          >
            {setRoleMutation.isPending ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text
                className={`font-semibold text-[15px] ${
                  selectedRole ? "text-white" : "text-[#A09A90]"
                }`}
              >
                Continue
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
