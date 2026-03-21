import { useMutation, useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { ROLE_CARDS } from "@/lib/auth";
import { useAuth } from "@/providers/auth-provider";
import type { RoleCardProps, RoleOption } from "@/types/auth";
import { trpc } from "@/utils/trpc";

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
    ? "w-full flex-row items-start gap-4 rounded-2xl border border-brand-primary-500 bg-brand-primary-100/30 p-5"
    : "w-full flex-row items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5";

  return (
    <Pressable
      className={cardClassName}
      disabled={disabled}
      onPress={handlePress}
    >
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary-100">
        <Text className="text-2xl">{emoji}</Text>
      </View>

      <View className="flex-1">
        <Text className="font-black text-brand-primary-900 text-lg">
          {title}
        </Text>
        <Text className="mt-1 text-slate-400 text-sm leading-5">
          {subtitle}
        </Text>
      </View>

      {isSelected ? (
        <View className="h-6 w-6 items-center justify-center rounded-full bg-brand-primary-500">
          <Text className="text-white text-xs">✓</Text>
        </View>
      ) : (
        <View className="h-6 w-6 rounded-full border border-slate-200" />
      )}
    </Pressable>
  );
});

export default function RoleSelectScreen() {
  const insets = useSafeAreaInsets();
  const { role } = useAuth();
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const profileQuery = useQuery(trpc.profiles.me.queryOptions());
  const setRoleMutation = useMutation(trpc.profiles.setRole.mutationOptions());

  const bottomAreaStyle = useMemo(
    () => ({
      paddingBottom: insets.bottom,
    }),
    [insets.bottom],
  );

  const handleBack = useCallback(() => {
    router.replace("/auth/sign-in");
  }, []);

  const handleSelectRole = useCallback((nextRole: RoleOption) => {
    setSelectedRole(nextRole);
  }, []);

  const handleRoleSuccess = useCallback(async () => {
    await SecureStore.deleteItemAsync("onboarding_complete");
    router.replace("/onboarding");
  }, []);

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

  useEffect(() => {
    if (role) {
      router.replace("/(tabs)/map");
    }
  }, [role]);

  return (
    <SafeAreaView className="flex-1 bg-brand-surface">
      <StatusBar style="dark" />

      <View className="flex-1">
        <View className="flex-row items-center justify-between px-4 pt-4">
          <Pressable
            className="h-11 w-11 items-center justify-center rounded-full"
            onPress={handleBack}
          >
            <Text className="text-2xl text-brand-primary-900">←</Text>
          </Pressable>

          <View className="h-11 w-11" />
        </View>

        <View className="flex-1 items-center px-6">
          <Image
            accessibilityLabel="WheresMyDorm logo"
            className="mt-8 h-14 w-14"
            contentFit="contain"
            source={require("../../assets/images/logo.svg")}
          />

          <Text className="mt-6 text-center font-black text-2xl text-brand-primary-900">
            How will you use{"\n"}WheresMyDorm?
          </Text>

          <Text className="mt-2 text-center text-slate-400 text-sm">
            You can switch roles anytime in Settings.
          </Text>

          {profileQuery.isLoading ? (
            <Text className="mt-4 text-slate-400 text-sm">
              Loading your profile...
            </Text>
          ) : null}

          {profileQuery.error ? (
            <Text className="mt-4 text-center text-red-500 text-sm leading-5">
              {profileQuery.error.message}
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
          className="absolute bottom-0 w-full px-6 pt-4"
          style={bottomAreaStyle}
        >
          {setRoleMutation.error ? (
            <Text className="mb-3 text-center text-red-500 text-sm leading-5">
              {setRoleMutation.error.message}
            </Text>
          ) : null}

          <Pressable
            className={`h-14 w-full items-center justify-center rounded-2xl ${
              selectedRole ? "bg-brand-primary-500" : "bg-brand-primary-100"
            }`}
            disabled={!selectedRole || setRoleMutation.isPending}
            onPress={handleContinue}
          >
            {setRoleMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text
                className={`font-bold text-base ${
                  selectedRole ? "text-white" : "text-brand-primary-300"
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
