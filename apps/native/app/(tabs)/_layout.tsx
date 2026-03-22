import { Tabs } from "expo-router";
import { Platform } from "react-native";

import { TabBarIcon } from "@/components/tabbar-icon";

const tabIconByRoute = {
  discover: "search",
  feed: "rss",
  map: "map-marker",
  profile: "user-circle",
} as const;

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
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
