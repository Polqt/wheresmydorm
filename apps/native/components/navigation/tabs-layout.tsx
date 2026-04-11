import Ionicons from "@expo/vector-icons/Ionicons";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs } from "expo-router";
import { memo, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Platform, View } from "react-native";
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

type FinderTabName = "discover" | "feed" | "map" | "profile" | "saved";
type ListerTabName = "dashboard" | "feed" | "inbox" | "listings" | "profile";

function BounceIcon({
  children,
  pressKey,
}: {
  children: ReactNode;
  pressKey: number;
}) {
  const scale = useSharedValue(1);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

    scale.set(
      withSequence(
      withTiming(1.2, { duration: 120, easing: Easing.out(Easing.quad) }),
      withSpring(1.0, { damping: 6, stiffness: 80 }),
      ),
    );
  }, [pressKey, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

const ProfileTabIcon = memo(function ProfileTabIcon({
  focused,
  pressKey,
}: {
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
        className={`rounded-full p-[2px] ${
          focused ? "border-2 border-[#EA580C]" : ""
        }`}
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

function ListerTabIcon({
  color,
  name,
  pressKey,
}: {
  color: string;
  name:
    | "apps-outline"
    | "business-outline"
    | "chatbubble-ellipses-outline";
  pressKey: number;
}) {
  return (
    <BounceIcon pressKey={pressKey}>
      <Ionicons color={color} name={name} size={22} />
    </BounceIcon>
  );
}

function useTabPressKeys<T extends string>(keys: readonly T[]) {
  const [pressKeys, setPressKeys] = useState<Record<T, number>>(
    () =>
      Object.fromEntries(keys.map((key) => [key, 0])) as Record<T, number>,
  );

  const press = (key: T) => {
    setPressKeys((current) => ({ ...current, [key]: current[key] + 1 }));
  };

  return { press, pressKeys };
}

export function FinderTabsLayout() {
  const { press, pressKeys } = useTabPressKeys<FinderTabName>([
    "map",
    "discover",
    "feed",
    "saved",
    "profile",
  ]);

  return (
    <Tabs screenOptions={TAB_SCREEN_OPTIONS}>
      <Tabs.Screen
        name="map"
        listeners={{ tabPress: () => press("map") }}
        options={{
          title: "Map",
          tabBarIcon: ({ color }) => (
            <BounceIcon pressKey={pressKeys.map}>
              <MapIcon color={color} height={24} width={24} />
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
              <HomeIcon color={color} height={24} width={24} />
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
              <FeedIcon color={color} height={24} width={24} />
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
              <HeartIcon color={color} height={24} width={24} />
            </BounceIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        listeners={{ tabPress: () => press("profile") }}
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <ProfileTabIcon focused={focused} pressKey={pressKeys.profile} />
          ),
        }}
      />
    </Tabs>
  );
}

export function ListerTabsLayout() {
  const { press, pressKeys } = useTabPressKeys<ListerTabName>([
    "dashboard",
    "listings",
    "feed",
    "inbox",
    "profile",
  ]);

  return (
    <Tabs screenOptions={TAB_SCREEN_OPTIONS}>
      <Tabs.Screen
        name="dashboard"
        listeners={{ tabPress: () => press("dashboard") }}
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <ListerTabIcon
              color={color}
              name="apps-outline"
              pressKey={pressKeys.dashboard}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="listings"
        listeners={{ tabPress: () => press("listings") }}
        options={{
          title: "Listings",
          tabBarIcon: ({ color }) => (
            <ListerTabIcon
              color={color}
              name="business-outline"
              pressKey={pressKeys.listings}
            />
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
              <FeedIcon color={color} height={24} width={24} />
            </BounceIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        listeners={{ tabPress: () => press("inbox") }}
        options={{
          title: "Inbox",
          tabBarIcon: ({ color }) => (
            <ListerTabIcon
              color={color}
              name="chatbubble-ellipses-outline"
              pressKey={pressKeys.inbox}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        listeners={{ tabPress: () => press("profile") }}
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <ProfileTabIcon focused={focused} pressKey={pressKeys.profile} />
          ),
        }}
      />
    </Tabs>
  );
}

const TAB_SCREEN_OPTIONS = {
  headerShown: false,
  sceneStyle: {
    backgroundColor: "#F7F4EE",
  },
  tabBarActiveTintColor: "#EA580C",
  tabBarInactiveTintColor: "#706A5F",
  tabBarHideOnKeyboard: true,
  tabBarStyle: {
    backgroundColor: "#FFFDFC",
    borderTopColor: "#E9E1D6",
    borderTopWidth: 1,
    height: Platform.select({ ios: 74, default: 64 }),
    paddingBottom: Platform.select({ ios: 10, default: 8 }),
    paddingTop: 8,
    boxShadow: "0 -4px 12px rgba(15, 23, 42, 0.03)",
  },
  tabBarItemStyle: {
    paddingTop: 2,
  },
  tabBarLabelStyle: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
} as const;
