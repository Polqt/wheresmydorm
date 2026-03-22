import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { ProfileRoleBadge } from "@/components/profile/profile-role-badge";
import { ProfileRow } from "@/components/profile/profile-row";
import { ProfileSection } from "@/components/profile/profile-section";
import { ProfileStatsRow } from "@/components/profile/profile-stat";
import { useAuth } from "@/providers/auth-provider";
import { getOrCreateCurrentProfile } from "@/services/profile";

function formatMemberSince(dateStr: string | undefined) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
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

  const memberSince = formatMemberSince(profile?.createdAt);

  // Role-specific stats
  const stats = useMemo(() => {
    if (role === "lister") {
      return [
        { label: "Listings", value: "0" },
        { label: "Reviews", value: "0" },
        { label: "Member since", value: memberSince },
      ];
    }
    return [
      { label: "Saved", value: "0" },
      { label: "Reviews", value: "0" },
      { label: "Member since", value: memberSince },
    ];
  }, [role, memberSince]);

  return (
    <SafeAreaView className="flex-1 bg-[#FAF8F5]" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 56 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top bar ── */}
        <View className="flex-row items-center justify-between px-5 pb-1 pt-5">
          <Text className="text-[28px] font-bold tracking-tight text-[#1A1A1A]">
            Profile
          </Text>
          <Pressable
            className="h-9 w-9 items-center justify-center rounded-full bg-[#EFECE7]"
            hitSlop={8}
            onPress={() => router.push("/profile/edit")}
          >
            <Ionicons color="#1A1A1A" name="pencil" size={15} />
          </Pressable>
        </View>

        {/* ── Hero ── */}
        <View className="mt-6 items-center px-5">
          <ProfileAvatar
            avatarUrl={profile?.avatarUrl ?? null}
            initials={initials}
            size={96}
          />

          <View className="mt-4 items-center">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-[22px] font-bold text-[#1A1A1A]">
                {displayName}
              </Text>
              {profile?.isVerifiedMember ? (
                <Ionicons color="#0B4A30" name="checkmark-circle" size={18} />
              ) : null}
            </View>

            <Text className="mt-1 text-[14px] text-[#A09A90]">
              {user?.email ?? ""}
            </Text>
          </View>
        </View>

        {/* ── Divider ── */}
        <View className="mx-5 mt-7 h-px bg-[#EAE5DE]" />

        {/* ── Stats row ── */}
        <View className="mx-5 mt-6">
          <ProfileStatsRow stats={stats} />
        </View>

        {/* ── Divider ── */}
        <View className="mx-5 mt-6 h-px bg-[#EAE5DE]" />

        {/* ── Account ── */}
        <ProfileSection title="Account">
          <ProfileRow
            icon="person-outline"
            label="Name"
            onPress={() => router.push("/profile/edit")}
            value={profile?.fullName ?? null}
          />
          <ProfileRow
            icon="mail-outline"
            label="Email"
            value={user?.email ?? null}
          />
          <ProfileRow
            icon="call-outline"
            label="Phone"
            onPress={() => router.push("/profile/edit")}
            value={profile?.contactPhone ?? null}
          />
          <ProfileRow
            icon="at-outline"
            label="Contact email"
            last
            onPress={() => router.push("/profile/edit")}
            value={profile?.contactEmail ?? null}
          />
        </ProfileSection>

        {/* ── Divider ── */}
        <View className="mx-5 mt-6 h-px bg-[#EAE5DE]" />

        {/* Role-specific section */}
        {role === "lister" ? (
          <>
            <ProfileSection title="Listings">
              <ProfileRow
                icon="home-outline"
                label="My listings"
                onPress={() => {}}
              />
              <ProfileRow
                icon="star-outline"
                label="Reviews received"
                last
                onPress={() => {}}
              />
            </ProfileSection>
            <View className="mx-5 mt-6 h-px bg-[#EAE5DE]" />
          </>
        ) : role === "finder" ? (
          <>
            <ProfileSection title="Activity">
              <ProfileRow
                icon="bookmark-outline"
                label="Saved listings"
                onPress={() => {}}
              />
              <ProfileRow
                icon="chatbubble-outline"
                label="My reviews"
                last
                onPress={() => {}}
              />
            </ProfileSection>
            <View className="mx-5 mt-6 h-px bg-[#EAE5DE]" />
          </>
        ) : null}

        {/* ── Preferences ── */}
        <ProfileSection title="Preferences">
          <ProfileRow
            icon="notifications-outline"
            label="Notifications"
            onPress={() => {}}
          />
          <ProfileRow
            icon="moon-outline"
            label="Appearance"
            last
            onPress={() => {}}
          />
        </ProfileSection>

        {/* ── Divider ── */}
        <View className="mx-5 mt-6 h-px bg-[#EAE5DE]" />

        {/* ── Support ── */}
        <ProfileSection title="Support">
          <ProfileRow
            icon="help-circle-outline"
            label="Help center"
            onPress={() => {}}
          />
          <ProfileRow
            icon="document-text-outline"
            label="Terms of service"
            onPress={() => {}}
          />
          <ProfileRow
            icon="shield-checkmark-outline"
            label="Privacy policy"
            last
            onPress={() => {}}
          />
        </ProfileSection>

        {/* ── Divider ── */}
        <View className="mx-5 mt-6 h-px bg-[#EAE5DE]" />

        {/* ── Sign out ── */}
        <ProfileSection>
          <ProfileRow
            destructive
            icon="log-out-outline"
            label="Sign out"
            last
            onPress={signOut}
          />
        </ProfileSection>
      </ScrollView>
    </SafeAreaView>
  );
}
