import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { ProfileRow } from "@/components/profile/profile-row";
import { ProfileSection } from "@/components/profile/profile-section";
import { ProfileStatsRow } from "@/components/profile/profile-stat";
import { useAuth } from "@/providers/auth-provider";
import { getOrCreateCurrentProfile } from "@/services/profile";
import { formatMemberSince, getInitials } from "@/utils/profile";

export default function ProfileTabScreen() {
  const { signOut, user, role } = useAuth();

  const { data: profile } = useQuery({
    enabled: Boolean(user),
    queryFn: () => getOrCreateCurrentProfile(user!),
    queryKey: ["auth-profile", user?.id],
  });

  const initials = useMemo(
    () => getInitials(profile?.firstName, profile?.lastName),
    [profile?.firstName, profile?.lastName],
  );

  const displayName = profile?.fullName ?? user?.email?.split("@")[0] ?? "Member";

  const stats = useMemo(() => {
    const base = [
      { label: role === "lister" ? "Listings" : "Saved", value: "0" },
      { label: "Reviews", value: "0" },
      { label: "Member since", value: formatMemberSince(profile?.createdAt) },
    ];
    return base;
  }, [role, profile?.createdAt]);

  const goEdit = () => router.push("/profile/edit");

  return (
    <SafeAreaView className="flex-1 bg-[#FAF8F5]" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 56 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Edit button top-right */}
        <View className="flex-row justify-end px-5 pt-5">
          <Pressable
            className="h-9 w-9 items-center justify-center rounded-full bg-[#EFECE7]"
            hitSlop={8}
            onPress={goEdit}
          >
            <Ionicons color="#1A1A1A" name="pencil" size={15} />
          </Pressable>
        </View>

        {/* Avatar + name */}
        <View className="mt-2 items-center px-5">
          <ProfileAvatar
            avatarUrl={profile?.avatarUrl ?? null}
            initials={initials}
            size={96}
          />

          <View className="mt-4 items-center gap-1">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-[22px] font-bold tracking-tight text-[#1A1A1A]">
                {displayName}
              </Text>
              {profile?.isVerifiedMember ? (
                <Ionicons color="#0B4A30" name="checkmark-circle" size={18} />
              ) : null}
            </View>
            <Text className="text-[14px] text-[#A09A90]">
              {user?.email ?? ""}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View className="mx-5 mt-7 h-px bg-[#EAE5DE]" />
        <View className="mx-5 mt-5">
          <ProfileStatsRow stats={stats} />
        </View>
        <View className="mx-5 mt-5 h-px bg-[#EAE5DE]" />

        {/* Account */}
        <ProfileSection title="Account">
          <ProfileRow
            icon="person-outline"
            label="Name"
            onPress={goEdit}
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
            onPress={goEdit}
            value={profile?.contactPhone ?? null}
          />
          <ProfileRow
            icon="at-outline"
            label="Contact"
            last
            onPress={goEdit}
            value={profile?.contactEmail ?? null}
          />
        </ProfileSection>

        <View className="mx-5 mt-5 h-px bg-[#EAE5DE]" />

        {/* Role-specific */}
        {role === "lister" ? (
          <>
            <ProfileSection title="Listings">
              <ProfileRow icon="home-outline" label="My listings" onPress={() => {}} />
              <ProfileRow icon="star-outline" label="Reviews received" last onPress={() => {}} />
            </ProfileSection>
            <View className="mx-5 mt-5 h-px bg-[#EAE5DE]" />
          </>
        ) : role === "finder" ? (
          <>
            <ProfileSection title="Activity">
              <ProfileRow icon="bookmark-outline" label="Saved listings" onPress={() => {}} />
              <ProfileRow icon="chatbubble-outline" label="My reviews" last onPress={() => {}} />
            </ProfileSection>
            <View className="mx-5 mt-5 h-px bg-[#EAE5DE]" />
          </>
        ) : null}

        {/* Preferences */}
        <ProfileSection title="Preferences">
          <ProfileRow icon="notifications-outline" label="Notifications" onPress={() => {}} />
          <ProfileRow icon="moon-outline" label="Appearance" last onPress={() => {}} />
        </ProfileSection>

        <View className="mx-5 mt-5 h-px bg-[#EAE5DE]" />

        {/* Support */}
        <ProfileSection title="Support">
          <ProfileRow icon="help-circle-outline" label="Help center" onPress={() => {}} />
          <ProfileRow icon="document-text-outline" label="Terms of service" onPress={() => {}} />
          <ProfileRow icon="shield-checkmark-outline" label="Privacy policy" last onPress={() => {}} />
        </ProfileSection>

        <View className="mx-5 mt-5 h-px bg-[#EAE5DE]" />

        {/* Sign out */}
        <ProfileSection>
          <ProfileRow destructive icon="log-out-outline" label="Sign out" last onPress={signOut} />
        </ProfileSection>
      </ScrollView>
    </SafeAreaView>
  );
}
