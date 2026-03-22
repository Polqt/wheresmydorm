import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/providers/auth-provider";
import { getOrCreateCurrentProfile } from "@/services/profile";

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <View className="overflow-hidden rounded-2xl border border-[#EAE5DE] bg-white">
      {children}
    </View>
  );
}

type RowProps = {
  icon: string;
  label: string;
  value: string;
  last?: boolean;
};

function Row({ icon, label, value, last = false }: RowProps) {
  return (
    <View
      className={`flex-row items-center px-4 py-[14px] ${last ? "" : "border-b border-[#F2EDE7]"}`}
    >
      <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-[#F0EBE3]">
        <Ionicons color="#6A716A" name={icon as any} size={15} />
      </View>
      <Text className="flex-1 text-[13px] font-medium text-[#7A7570]">{label}</Text>
      <Text className="max-w-[55%] text-right text-[13px] font-semibold capitalize text-[#1A1A1A]" numberOfLines={1}>
        {value}
      </Text>
    </View>
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

  const initials = `${profile?.firstName?.[0] ?? "W"}${profile?.lastName?.[0] ?? "D"}`.toUpperCase();
  const displayName = profile?.fullName ?? user?.email?.split("@")[0] ?? "Member";
  const roleLabel =
    role === "finder"
      ? "Looking for housing"
      : role === "lister"
        ? "Listing a property"
        : null;

  return (
    <SafeAreaView className="flex-1 bg-[#FAF8F5]" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text className="pb-5 pt-5 font-bold text-[26px] text-[#1A1A1A]">
          Profile
        </Text>

        {/* Hero card */}
        <View className="mb-3 rounded-2xl border border-[#EAE5DE] bg-white px-5 py-6">
          <View className="mb-4 h-18 w-18 items-center justify-center rounded-full bg-[#0B2D23]"
            style={{ height: 72, width: 72 }}
          >
            <Text className="font-bold text-[26px] text-white">{initials}</Text>
          </View>
          <Text className="font-bold text-[22px] text-[#1A1A1A]">{displayName}</Text>
          <Text className="mt-0.5 text-[14px] text-[#8A8480]">{user?.email ?? ""}</Text>
          {roleLabel ? (
            <View className="mt-3 self-start rounded-full bg-[#EEF5F1] px-3 py-1">
              <Text className="text-[12px] font-bold text-[#0B4A30]">{roleLabel}</Text>
            </View>
          ) : null}
        </View>

        {/* Account section */}
        <Text className="mb-2 mt-3 px-1 text-[11px] font-bold uppercase tracking-[1.4px] text-[#A09A90]">
          Account
        </Text>
        <SectionCard>
          <Row icon="person-outline" label="First name" value={profile?.firstName ?? "—"} />
          <Row icon="person-outline" label="Last name" value={profile?.lastName ?? "Not set"} />
          <Row icon="mail-outline" label="Email" value={user?.email ?? "—"} last />
        </SectionCard>

        {/* Sign out */}
        <Pressable
          className="mt-6 h-[52px] w-full items-center justify-center rounded-xl border border-[#EAE5DE] bg-white"
          onPress={signOut}
        >
          <Text className="font-semibold text-[15px] text-red-500">Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
