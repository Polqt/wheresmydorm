import { useQueryClient } from "@tanstack/react-query";
import { Tabs } from "expo-router";
import { memo, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import FeedIcon from "@/assets/icons/tabs/feed.svg";
import HeartIcon from "@/assets/icons/tabs/heart.svg";
import HomeIcon from "@/assets/icons/tabs/home.svg";
import MapIcon from "@/assets/icons/tabs/map.svg";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { PROFILE_QUERY_KEY } from "@/lib/auth";
import { useAuth } from "@/providers/auth-provider";
import type { NativeProfile } from "@/services/profile";
import { getInitials } from "@/utils/profile";

// Animates whenever `pressKey` increments (once per tab press)
function BounceIcon({
  pressKey,
  children,
}: {
  pressKey: number;
  children: React.ReactNode;
}) {
  const scale = useSharedValue(1);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    scale.value = withSequence(
      withTiming(1.2, { duration: 120, easing: Easing.out(Easing.quad) }),
      withSpring(1.0, { damping: 6, stiffness: 80 }),
    );
  }, [pressKey, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

const ProfileTabIcon = memo(function ProfileTabIcon({
  color,
  focused,
  pressKey,
}: {
  color: string;
  focused: boolean;
  pressKey: number;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const profile = queryClient.getQueryData<NativeProfile>([
    PROFILE_QUERY_KEY,
    user?.id,
  ]);

  const initials = getInitials(profile?.firstName, profile?.lastName);

  return (
    <BounceIcon pressKey={pressKey}>
      <View
        style={{
          borderRadius: 12,
          borderWidth: focused ? 2 : 0,
          borderColor: focused ? "#EA580C" : "transparent",
          padding: focused ? 1 : 0,
        }}
      >
        <ProfileAvatar
          avatarUrl={profile?.avatarUrl ?? null}
          initials={initials}
          size={24}
        />
      </View>
    </BounceIcon>
  );
});

export default function NativeTabsLayout() {
  const [pressKeys, setPressKeys] = useState({
    map: 0,
    discover: 0,
    feed: 0,
    saved: 0,
    profile: 0,
  });

  function press(tab: keyof typeof pressKeys) {
    setPressKeys((prev) => ({ ...prev, [tab]: prev[tab] + 1 }));
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: styles.scene,
        tabBarActiveTintColor: "#EA580C",
        tabBarInactiveTintColor: "#706A5F",
        tabBarHideOnKeyboard: true,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="map"
        listeners={{ tabPress: () => press("map") }}
        options={{
          title: "Map",
          tabBarIcon: ({ color }) => (
            <BounceIcon pressKey={pressKeys.map}>
              <MapIcon width={24} height={24} color={color} />
            </BounceIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        listeners={{ tabPress: () => press("discover") }}
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) => (
            <BounceIcon pressKey={pressKeys.discover}>
              <HomeIcon width={24} height={24} color={color} />
            </BounceIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        listeners={{ tabPress: () => press("feed") }}
        options={{
          title: "Feed",
          tabBarIcon: ({ color }) => (
            <BounceIcon pressKey={pressKeys.feed}>
              <FeedIcon width={24} height={24} color={color} />
            </BounceIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        listeners={{ tabPress: () => press("saved") }}
        options={{
          title: "Saved",
          tabBarIcon: ({ color }) => (
            <BounceIcon pressKey={pressKeys.saved}>
              <HeartIcon width={24} height={24} color={color} />
            </BounceIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        listeners={{ tabPress: () => press("profile") }}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <ProfileTabIcon
              color={color}
              focused={focused}
              pressKey={pressKeys.profile}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scene: {
    backgroundColor: "#F7F4EE",
  },
  tabBar: {
    backgroundColor: "#FFFDFC",
    borderTopColor: "#E9E1D6",
    borderTopWidth: 1,
    height: Platform.select({ ios: 74, default: 64 }),
    paddingBottom: Platform.select({ ios: 10, default: 8 }),
    paddingTop: 8,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 8,
  },
  tabBarItem: {
    paddingTop: 2,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
});
