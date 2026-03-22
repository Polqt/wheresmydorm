import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AppLogo } from "@/components/ui/app-logo";
import { ROLE_CARDS } from "@/lib/auth";
import { useAuth } from "@/providers/auth-provider";
import {
  getOrCreateCurrentProfile,
  setCurrentProfileRole,
} from "@/services/profile";
import { useAuthFlowStore } from "@/stores/auth";
import type { RoleCardProps, RoleOption } from "@/types/auth";

const RoleCard = React.memo(function RoleCard({
  card,
  disabled,
  isSelected,
  onSelect,
}: RoleCardProps) {
  const { emoji, role, subtitle, title } = card;
  const handlePress = useCallback(() => {
    onSelect(role);
  }, [onSelect, role]);

  const cardClassName = isSelected
    ? "w-full flex-row items-start gap-4 rounded-2xl border-2 border-[#04170E] bg-[#F0F7F4] p-5"
    : "w-full flex-row items-start gap-4 rounded-2xl border border-[#E0E0E0] bg-white p-5";

  return (
    <Pressable
      className={cardClassName}
      disabled={disabled}
      onPress={handlePress}
    >
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#F0F7F4]">
        <Text className="text-2xl">{emoji}</Text>
      </View>

      <View className="flex-1">
        <Text className="font-bold text-[#1A1A1A] text-lg">
          {title}
        </Text>
        <Text className="mt-1 text-[#7A7A7A] text-sm leading-5">
          {subtitle}
        </Text>
      </View>

      {isSelected ? (
        <View className="h-6 w-6 items-center justify-center rounded-full bg-[#04170E]">
          <Ionicons color="#ffffff" name="checkmark" size={14} />
        </View>
      ) : (
        <View className="h-6 w-6 rounded-full border border-[#E0E0E0]" />
      )}
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
  const profileQuery = useQuery({
    enabled: Boolean(user),
    queryFn: () => getOrCreateCurrentProfile(user!),
    queryKey: ["auth-profile", user?.id],
  });
  const setRoleMutation = useMutation({
    mutationFn: async ({ role }: { role: RoleOption }) => {
      if (!user) {
        throw new Error("Your session expired. Please sign in again.");
      }

      return setCurrentProfileRole(user.id, role);
    },
  });

  const bottomAreaStyle = useMemo(
    () => ({
      paddingBottom: insets.bottom + 12,
    }),
    [insets.bottom],
  );

  const handleBack = useCallback(() => {
    router.replace("/auth/sign-in");
  }, []);

  const handleSelectRole = useCallback((nextRole: RoleOption) => {
    setSelectedRole(nextRole);
  }, []);

  const handleRoleSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["auth-profile"] });
    setAwaitingRoleSync();
    router.replace("/onboarding");
  }, [queryClient, setAwaitingRoleSync]);

  const handleContinue = useCallback(() => {
    if (!selectedRole) {
      return;
    }

    setRoleMutation.mutate(
      { role: selectedRole },
      {
        onSuccess: handleRoleSuccess,
      },
    );
  }, [handleRoleSuccess, selectedRole, setRoleMutation]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="flex-1">
        <View className="flex-row items-center justify-between px-4 pt-2">
          <Pressable
            className="h-11 w-11 items-center justify-center rounded-full"
            onPress={handleBack}
          >
            <Ionicons color="#1A1A1A" name="chevron-back" size={24} />
          </Pressable>

          <View className="h-11 w-11" />
        </View>

        <View className="flex-1 items-center px-6">
          <AppLogo className="mt-6 h-12 w-12" />

          <Text className="mt-6 text-center font-bold text-[24px] text-[#1A1A1A]">
            How will you use{"\n"}WheresMyDorm?
          </Text>

          <Text className="mt-2 text-center text-[#7A7A7A] text-sm">
            You can switch roles anytime in Settings.
          </Text>

          {profileQuery.isLoading ? (
            <Text className="mt-4 text-[#9A9A9A] text-sm">
              Loading your profile...
            </Text>
          ) : null}

          <View className="mt-8 w-full gap-4">
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
        </View>

        <View
          className="w-full px-6 pt-4"
          style={bottomAreaStyle}
        >
          {setRoleMutation.error ? (
            <Text className="mb-3 text-center text-red-500 text-sm leading-5">
              {setRoleMutation.error.message}
            </Text>
          ) : null}

          <Pressable
            className={`h-14 w-full items-center justify-center rounded-full ${
              selectedRole ? "bg-[#04170E]" : "bg-[#E5E5E5]"
            }`}
            disabled={!selectedRole || setRoleMutation.isPending}
            onPress={handleContinue}
          >
            {setRoleMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text
                className={`font-semibold text-base ${
                  selectedRole ? "text-white" : "text-[#9A9A9A]"
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
