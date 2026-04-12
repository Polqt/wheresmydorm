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
import { useCurrentProfile } from "@/hooks/use-current-profile";
import { useAuth } from "@/providers/auth-provider";
import { formatMemberSince, getInitials } from "@/utils/profile";
import {
  createListingRoute,
  listerListingsTabRoute,
  messagesInboxRoute,
  profileEditRoute,
  savedListingsRoute,
} from "@/utils/routes";
import { trpc } from "@/utils/api-client";

export default function ProfileTabScreen() {
  const { signOut, user, role } = useAuth();

  const { data: profile } = useCurrentProfile(user);
  const myListingsQuery = useQuery({
    ...trpc.listings.myListings.queryOptions(),
    enabled: role === "lister",
  });
  const savedListingsQuery = useQuery({
    ...trpc.listings.savedListings.queryOptions(),
    enabled: role === "finder",
  });

  const initials = useMemo(
    () => getInitials(profile?.firstName, profile?.lastName),
    [profile?.firstName, profile?.lastName],
  );

  const displayName =
    profile?.fullName ?? user?.email?.split("@")[0] ?? "Member";

  const stats = useMemo(
    () => [
      {
        label: role === "lister" ? "Listings" : "Saved",
        value:
          role === "lister"
            ? String(myListingsQuery.data?.length ?? 0)
            : String(savedListingsQuery.data?.length ?? 0),
      },
      { label: "Reviews", value: "0" },
      { label: "Member since", value: formatMemberSince(profile?.createdAt) },
    ],
    [
      myListingsQuery.data?.length,
      profile?.createdAt,
      role,
      savedListingsQuery.data?.length,
    ],
  );

  const goEdit = () => router.push(profileEditRoute());

  return (
    <SafeAreaView className="flex-1 bg-[#F5F0E8]" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 64 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
          <Text className="text-[22px] font-bold tracking-[-0.4px] text-[#1C1917]">
            Profile
          </Text>
          <Pressable
            className="h-9 w-9 items-center justify-center rounded-full bg-white"
            hitSlop={8}
            onPress={goEdit}
            style={{
              boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
            }}
          >
            <Ionicons color="#1C1917" name="pencil" size={15} />
          </Pressable>
        </View>

        <View
          className="mx-5 mb-5 rounded-3xl bg-white p-5"
          style={{
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
          }}
        >
          <View className="flex-row items-center gap-4">
            <ProfileAvatar
              avatarUrl={profile?.avatarUrl ?? null}
              initials={initials}
              size={72}
            />
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text
                  className="text-[18px] font-bold tracking-[-0.3px] text-[#1C1917]"
                  numberOfLines={1}
                >
                  {displayName}
                </Text>
                {profile?.isVerifiedMember ? (
                  <Ionicons color="#0B4A30" name="checkmark-circle" size={17} />
                ) : null}
              </View>
              <Text className="mt-0.5 text-[13px] text-[#78716C]" numberOfLines={1}>
                {user?.email ?? ""}
              </Text>
              {role ? (
                <View className="mt-2 self-start rounded-full bg-[#EEF5F1] px-3 py-1">
                  <Text className="text-[12px] font-semibold capitalize text-[#0B4A30]">
                    {role}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View className="mt-4 h-px bg-[#F0EBE3]" />

          <View className="mt-4">
            <ProfileStatsRow stats={stats} />
          </View>
        </View>

        <View className="px-5">
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

          {role === "lister" ? (
            <ProfileSection title="Listings">
              <ProfileRow
                icon="home-outline"
                label="My listings"
                onPress={() => router.push(listerListingsTabRoute())}
              />
              <ProfileRow
                icon="add-circle-outline"
                label="Create listing"
                last
                onPress={() => router.push(createListingRoute())}
              />
            </ProfileSection>
          ) : role === "finder" ? (
            <ProfileSection title="Activity">
              <ProfileRow
                icon="bookmark-outline"
                label="Saved listings"
                onPress={() => router.push(savedListingsRoute())}
              />
              <ProfileRow
                icon="chatbubble-outline"
                label="Messages"
                last
                onPress={() => router.push(messagesInboxRoute())}
              />
            </ProfileSection>
          ) : null}

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

          <ProfileSection>
            <ProfileRow
              destructive
              icon="log-out-outline"
              label="Sign out"
              last
              onPress={() => void signOut()}
            />
          </ProfileSection>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
