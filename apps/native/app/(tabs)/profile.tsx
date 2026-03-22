import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/providers/auth-provider";
import { getOrCreateCurrentProfile } from "@/services/profile";

function formatMemberSince(dateStr: string | undefined) {
  if (!dateStr) return "Member";
  const d = new Date(dateStr);
  return `Member since ${d.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
}

function MenuItem({
  icon,
  label,
  detail,
  onPress,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      className={`flex-row items-center px-5 py-[15px] ${last ? "" : "border-b border-[#F2EDE7]"}`}
      onPress={onPress}
    >
      <View className="mr-3.5 h-9 w-9 items-center justify-center rounded-xl bg-[#F4F0EA]">
        <Ionicons color="#5A5550" name={icon} size={17} />
      </View>
      <Text className="flex-1 text-[15px] font-medium text-[#1A1A1A]">
        {label}
      </Text>
      {detail ? (
        <Text className="mr-1.5 max-w-[45%] text-right text-[13px] text-[#8A8480]" numberOfLines={1}>
          {detail}
        </Text>
      ) : null}
      <Ionicons color="#C0B8B0" name="chevron-forward" size={16} />
    </Pressable>
  );
}

export default function ProfileTabScreen() {
  const { signOut, user, role } = useAuth();

  const profileQuery = useQuery({
    enabled: Boolean(user),
    queryFn: () => getOrCreateCurrentProfile(user!),
    queryKey: ["auth-profile", user?.id],
  });
  const profile = profileQuery.data;

  const initials = useMemo(
    () =>
      `${profile?.firstName?.[0] ?? "W"}${profile?.lastName?.[0] ?? "D"}`.toUpperCase(),
    [profile?.firstName, profile?.lastName],
  );

  const displayName =
    profile?.fullName ?? user?.email?.split("@")[0] ?? "Member";

  const roleLabel =
    role === "finder"
      ? "Looking for housing"
      : role === "lister"
        ? "Listing property"
        : null;

  const memberSince = formatMemberSince(profile?.createdAt);

  return (
    <SafeAreaView className="flex-1 bg-[#FAF8F5]" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pb-2 pt-5">
          <Text className="font-bold text-[28px] text-[#1A1A1A]">Profile</Text>
        </View>

        {/* Profile hero */}
        <View className="mx-5 mt-3 rounded-3xl bg-white px-5 pb-5 pt-6"
          style={{
            shadowColor: "#1A1A1A",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 12,
            elevation: 2,
          }}
        >
          <View className="flex-row items-center">
            {/* Avatar */}
            {profile?.avatarUrl ? (
              <Image
                source={{ uri: profile.avatarUrl }}
                style={{ height: 68, width: 68, borderRadius: 34 }}
                transition={200}
              />
            ) : (
              <View
                className="items-center justify-center rounded-full bg-[#0B2D23]"
                style={{ height: 68, width: 68 }}
              >
                <Text className="font-bold text-[24px] text-white">
                  {initials}
                </Text>
              </View>
            )}

            <View className="ml-4 flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="font-bold text-[20px] text-[#1A1A1A]" numberOfLines={1}>
                  {displayName}
                </Text>
                {profile?.isVerifiedMember ? (
                  <Ionicons color="#0B4A30" name="checkmark-circle" size={18} />
                ) : null}
              </View>
              <Text className="mt-0.5 text-[13px] text-[#8A8480]" numberOfLines={1}>
                {user?.email ?? ""}
              </Text>
            </View>
          </View>

          {/* Role + member since */}
          <View className="mt-4 flex-row items-center gap-2">
            {roleLabel ? (
              <View className="rounded-full bg-[#EEF5F1] px-3 py-1.5">
                <Text className="text-[12px] font-semibold text-[#0B4A30]">
                  {roleLabel}
                </Text>
              </View>
            ) : null}
            <View className="rounded-full bg-[#F4F0EA] px-3 py-1.5">
              <Text className="text-[12px] font-medium text-[#8A8480]">
                {memberSince}
              </Text>
            </View>
          </View>
        </View>

        {/* Account section */}
        <View className="mt-6 px-5">
          <Text className="mb-2 px-1 text-[12px] font-bold uppercase tracking-[1.2px] text-[#A09A90]">
            Account
          </Text>
          <View className="overflow-hidden rounded-2xl bg-white"
            style={{
              shadowColor: "#1A1A1A",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.03,
              shadowRadius: 8,
              elevation: 1,
            }}
          >
            <MenuItem
              icon="person-outline"
              label="Name"
              detail={profile?.fullName ?? "Not set"}
            />
            <MenuItem
              icon="mail-outline"
              label="Email"
              detail={user?.email ?? "Not set"}
            />
            <MenuItem
              icon="call-outline"
              label="Phone"
              detail={profile?.contactPhone ?? "Not set"}
            />
            <MenuItem
              icon="at-outline"
              label="Contact email"
              detail={profile?.contactEmail ?? "Not set"}
              last
            />
          </View>
        </View>

        {/* Preferences section */}
        <View className="mt-6 px-5">
          <Text className="mb-2 px-1 text-[12px] font-bold uppercase tracking-[1.2px] text-[#A09A90]">
            Preferences
          </Text>
          <View className="overflow-hidden rounded-2xl bg-white"
            style={{
              shadowColor: "#1A1A1A",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.03,
              shadowRadius: 8,
              elevation: 1,
            }}
          >
            <MenuItem
              icon="notifications-outline"
              label="Notifications"
            />
            <MenuItem
              icon="location-outline"
              label="Location"
            />
            <MenuItem
              icon="moon-outline"
              label="Appearance"
              last
            />
          </View>
        </View>

        {/* Support section */}
        <View className="mt-6 px-5">
          <Text className="mb-2 px-1 text-[12px] font-bold uppercase tracking-[1.2px] text-[#A09A90]">
            Support
          </Text>
          <View className="overflow-hidden rounded-2xl bg-white"
            style={{
              shadowColor: "#1A1A1A",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.03,
              shadowRadius: 8,
              elevation: 1,
            }}
          >
            <MenuItem
              icon="help-circle-outline"
              label="Help center"
            />
            <MenuItem
              icon="document-text-outline"
              label="Terms of service"
            />
            <MenuItem
              icon="shield-checkmark-outline"
              label="Privacy policy"
              last
            />
          </View>
        </View>

        {/* Sign out */}
        <View className="mt-8 px-5">
          <Pressable
            className="h-[52px] w-full items-center justify-center rounded-2xl bg-white"
            onPress={signOut}
            style={{
              shadowColor: "#1A1A1A",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.03,
              shadowRadius: 8,
              elevation: 1,
            }}
          >
            <Text className="font-semibold text-[15px] text-red-500">
              Sign out
            </Text>
          </Pressable>
        </View>

        {/* Version */}
        <Text className="mt-5 text-center text-[12px] text-[#C0B8B0]">
          WheresMyDorm v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
