import Ionicons from "@expo/vector-icons/Ionicons";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Location from "expo-location";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, Switch, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { SetupProgressBar } from "@/components/ui/setup-progress-bar";
import { ONBOARDING_STEPS } from "@/lib/auth";
import { useAuth } from "@/providers/auth-provider";
import { setOnboardingCompletion } from "@/services/onboarding";

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const CURRENT_STEP = 4;

export default function PermissionsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bottomAreaStyle = useMemo(
    () => ({ paddingBottom: Math.max(insets.bottom + 8, 24) }),
    [insets.bottom],
  );

  const handleToggleLocation = useCallback(async (value: boolean) => {
    if (value) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationEnabled(status === "granted");
    } else {
      setLocationEnabled(false);
    }
  }, []);

  const handleToggleNotifications = useCallback(async (value: boolean) => {
    if (!value) {
      setNotificationsEnabled(false);
      return;
    }
    if (isExpoGo) {
      Alert.alert(
        "Not available in Expo Go",
        "Push notifications require a development build. This will work in the production app.",
      );
      return;
    }
    try {
      const { requestPermissionsAsync } = await import("expo-notifications");
      const { status } = await requestPermissionsAsync();
      setNotificationsEnabled(status === "granted");
    } catch {
      setNotificationsEnabled(false);
    }
  }, []);

  const handleDone = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await setOnboardingCompletion(user?.id);
      router.replace("/(tabs)/map");
    } finally {
      setIsSubmitting(false);
    }
  }, [user?.id]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="flex-1">
        <SetupProgressBar current={CURRENT_STEP} total={ONBOARDING_STEPS} />

        <View className="px-4 pt-3">
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full bg-[#F4F0EA]"
            onPress={() => router.replace("/auth/contact-info")}
          >
            <Ionicons color="#1A1A1A" name="chevron-back" size={20} />
          </Pressable>
        </View>

        <View className="flex-1 px-6 pt-8">
          <Text className="text-[28px] font-bold leading-[34px] text-[#1A1A1A]">
            One last step
          </Text>
          <Text className="mt-2 text-[14px] leading-6 text-[#8A8480]">
            WheresMyDorm needs these to help you find housing near you. You can change them anytime in Settings.
          </Text>

          <View className="mt-8 gap-3">
            <Pressable
              className="flex-row items-center gap-4 rounded-2xl border border-[#EAE5DE] bg-[#FAF8F5] px-5 py-4"
              onPress={() => handleToggleLocation(!locationEnabled)}
            >
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF5F1]">
                <Ionicons color="#0B4A30" name="location-outline" size={22} />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-[#1A1A1A]">Location</Text>
                <Text className="mt-0.5 text-[12px] leading-[18px] text-[#8A8480]">
                  Find listings near you. Only used while the app is open.
                </Text>
              </View>
              <Switch
                onValueChange={handleToggleLocation}
                thumbColor="#ffffff"
                trackColor={{ false: "#E4DED4", true: "#0B2D23" }}
                value={locationEnabled}
              />
            </Pressable>

            <Pressable
              className="flex-row items-center gap-4 rounded-2xl border border-[#EAE5DE] bg-[#FAF8F5] px-5 py-4"
              onPress={() => handleToggleNotifications(!notificationsEnabled)}
            >
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF5F1]">
                <Ionicons color="#0B4A30" name="notifications-outline" size={22} />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-[#1A1A1A]">Notifications</Text>
                <Text className="mt-0.5 text-[12px] leading-[18px] text-[#8A8480]">
                  Get alerted when a lister replies or new listings appear.
                </Text>
              </View>
              <Switch
                onValueChange={handleToggleNotifications}
                thumbColor="#ffffff"
                trackColor={{ false: "#E4DED4", true: "#0B2D23" }}
                value={notificationsEnabled}
              />
            </Pressable>
          </View>

          <View className="mt-5 flex-row items-start gap-2 rounded-xl bg-[#FAF8F5] px-4 py-3">
            <Ionicons color="#8A8480" name="lock-closed-outline" size={14} style={{ marginTop: 1 }} />
            <Text className="flex-1 text-[12px] leading-[18px] text-[#8A8480]">
              We take your privacy seriously and never share your data with third parties.
            </Text>
          </View>

          <View className="flex-1" />
        </View>

        <View className="px-6" style={bottomAreaStyle}>
          <Pressable
            className="h-[52px] w-full items-center justify-center rounded-xl"
            disabled={isSubmitting}
            onPress={handleDone}
            style={{ backgroundColor: "#04170E" }}
          >
            <Text className="text-[15px] font-semibold text-white">
              {isSubmitting ? "Setting up\u2026" : "Get started"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
