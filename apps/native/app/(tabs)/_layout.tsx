import Ionicons from "@expo/vector-icons/Ionicons";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, router, useSegments } from "expo-router";
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
import { finderHomeRoute, listerHomeRoute } from "@/utils/routes";

const FINDER_ONLY_TABS = new Set(["map", "discover", "saved"]);
const LISTER_ONLY_TABS = new Set(["dashboard", "listings", "inbox"]);

function BounceIcon({
  pressKey,
  children,
}: {
  pressKey: number;
  children: ReactNode;
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

export default function NativeTabsLayout() {
  const { role } = useAuth();
  const segments = useSegments();
  const [pressKeys, setPressKeys] = useState({
    dashboard: 0,
    discover: 0,
    feed: 0,
    inbox: 0,
    listings: 0,
    map: 0,
    profile: 0,
    saved: 0,
  });

  const currentLeaf = segments[segments.length - 1];
  const isLister = role === "lister";

  useEffect(() => {
    if (typeof currentLeaf !== "string") {
      return;
    }

    if (isLister && FINDER_ONLY_TABS.has(currentLeaf)) {
      router.replace(listerHomeRoute());
      return;
    }

    if (!isLister && LISTER_ONLY_TABS.has(currentLeaf)) {
      router.replace(finderHomeRoute());
    }
  }, [currentLeaf, isLister]);

  function press(tab: keyof typeof pressKeys) {
    setPressKeys((prev) => ({ ...prev, [tab]: prev[tab] + 1 }));
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: SCENE_STYLE,
        tabBarActiveTintColor: "#EA580C",
        tabBarInactiveTintColor: "#706A5F",
        tabBarHideOnKeyboard: true,
        tabBarStyle: TAB_BAR_STYLE,
        tabBarItemStyle: TAB_BAR_ITEM_STYLE,
        tabBarLabelStyle: TAB_BAR_LABEL_STYLE,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        listeners={{ tabPress: () => press("dashboard") }}
        options={{
          href: isLister ? undefined : null,
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
        name="map"
        listeners={{ tabPress: () => press("map") }}
        options={{
          href: isLister ? null : undefined,
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
          href: isLister ? null : undefined,
          title: "Discover",
          tabBarIcon: ({ color }) => (
            <BounceIcon pressKey={pressKeys.discover}>
              <HomeIcon color={color} height={24} width={24} />
            </BounceIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="listings"
        listeners={{ tabPress: () => press("listings") }}
        options={{
          href: isLister ? undefined : null,
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
        name="saved"
        listeners={{ tabPress: () => press("saved") }}
        options={{
          href: isLister ? null : undefined,
          title: "Saved",
          tabBarIcon: ({ color }) => (
            <BounceIcon pressKey={pressKeys.saved}>
              <HeartIcon color={color} height={24} width={24} />
            </BounceIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        listeners={{ tabPress: () => press("inbox") }}
        options={{
          href: isLister ? undefined : null,
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
            <ProfileTabIcon
              focused={focused}
              pressKey={pressKeys.profile}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const SCENE_STYLE = {
  backgroundColor: "#F7F4EE",
} as const;

const TAB_BAR_STYLE = {
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
} as const;

const TAB_BAR_ITEM_STYLE = {
  paddingTop: 2,
} as const;

const TAB_BAR_LABEL_STYLE = {
  fontSize: 11,
  fontWeight: "700",
  marginTop: 2,
} as const;
