import { useQueryClient } from "@tanstack/react-query";
import { Tabs } from "expo-router";
import { Platform, View } from "react-native";

import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { TabBarIcon } from "@/components/tabbar-icon";
import { useAuth } from "@/providers/auth-provider";
import type { NativeProfile } from "@/services/profile";

const tabIconByRoute = {
  discover: "search",
  feed: "rss",
  map: "map-marker",
} as const;

function ProfileTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const profile = queryClient.getQueryData<NativeProfile>(["auth-profile", user?.id]);

  const initials =
    `${profile?.firstName?.[0] ?? "W"}${profile?.lastName?.[0] ?? "D"}`.toUpperCase();

  return (
    <View
      style={{
        borderRadius: 12,
        borderWidth: focused ? 2 : 0,
        borderColor: focused ? "#0B2D23" : "transparent",
        padding: focused ? 1 : 0,
      }}
    >
      <ProfileAvatar
        avatarUrl={profile?.avatarUrl ?? null}
        initials={initials}
        size={24}
      />
    </View>
  );
}

export default function NativeTabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#0B2D23",
        tabBarInactiveTintColor: "#706A5F",
        tabBarStyle: {
          backgroundColor: "#fffdf9",
          borderTopColor: "#E7E0D5",
          height: Platform.select({ ios: 86, default: 78 }),
          paddingBottom: Platform.select({ ios: 14, default: 10 }),
          paddingTop: 8,
          shadowColor: "#1A1A1A",
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.06,
          shadowRadius: 14,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
        tabBarIcon: ({ color }) => (
          <TabBarIcon
            name={tabIconByRoute[route.name as keyof typeof tabIconByRoute]}
            color={color}
          />
        ),
      })}
    >
      <Tabs.Screen name="map" options={{ title: "Map" }} />
      <Tabs.Screen name="discover" options={{ title: "Discover" }} />
      <Tabs.Screen name="feed" options={{ title: "Feed" }} />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <ProfileTabIcon color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
