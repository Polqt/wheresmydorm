import Ionicons from "@expo/vector-icons/Ionicons";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { SetupProgressBar } from "@/components/ui/setup-progress-bar";
import { ONBOARDING_STEPS, PROFILE_QUERY_KEY } from "@/lib/auth";
import { useAuth } from "@/providers/auth-provider";
import { updateCurrentProfile } from "@/services/profile";

const CURRENT_STEP = 2;

export default function AvatarSetupScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomAreaStyle = useMemo(
    () => ({ paddingBottom: Math.max(insets.bottom + 8, 24) }),
    [insets.bottom],
  );

  const handlePickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  }, []);

  const handleContinue = useCallback(async () => {
    if (!user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const profile = await updateCurrentProfile(user.id, { avatarUrl: avatarUri });
      queryClient.setQueryData([PROFILE_QUERY_KEY, user.id], profile);
      router.replace("/auth/contact-info");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [avatarUri, queryClient, user]);

  const handleSkip = useCallback(() => {
    router.replace("/auth/contact-info");
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="flex-1">
        <SetupProgressBar current={CURRENT_STEP} total={ONBOARDING_STEPS} />

        <View className="flex-row items-center justify-between px-4 pt-3">
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full bg-[#F4F0EA]"
            onPress={() => router.replace("/auth/profile-setup")}
          >
            <Ionicons color="#1A1A1A" name="chevron-back" size={20} />
          </Pressable>
          <Pressable hitSlop={12} onPress={handleSkip}>
            <Text className="text-[14px] font-medium text-[#8A8480]">Skip</Text>
          </Pressable>
        </View>

        <View className="flex-1 px-6 pt-8">
          <Text className="text-[28px] font-bold leading-[34px] text-[#1A1A1A]">
            Add a profile photo
          </Text>
          <Text className="mt-2 text-[14px] leading-5 text-[#8A8480]">
            Help listers and finders recognize you. You can always change this later.
          </Text>

          <View className="mt-10 items-center">
            <Pressable
              className="relative items-center justify-center"
              onPress={handlePickImage}
            >
              {avatarUri ? (
                <Image
                  contentFit="cover"
                  source={{ uri: avatarUri }}
                  style={{ width: 140, height: 140, borderRadius: 70 }}
                />
              ) : (
                <View
                  className="h-[140px] w-[140px] items-center justify-center rounded-full"
                  style={{ backgroundColor: "#F0EBE3" }}
                >
                  <Ionicons color="#C0B8B0" name="person" size={56} />
                </View>
              )}

              <View
                className="absolute bottom-1 right-1 h-10 w-10 items-center justify-center rounded-full border-2 border-white"
                style={{ backgroundColor: "#04170E" }}
              >
                <Ionicons color="#ffffff" name="camera" size={18} />
              </View>
            </Pressable>

            <Text className="mt-4 text-[13px] text-[#A09A90]">
              {avatarUri ? "Tap to change" : "Tap to select a photo"}
            </Text>
          </View>

          <Pressable
            className="mt-6 flex-row items-center gap-3 rounded-2xl border border-[#EAE5DE] bg-[#FAF8F5] px-4 py-3.5"
            onPress={handlePickImage}
          >
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#EEF5F1]">
              <Ionicons color="#0B4A30" name="images-outline" size={18} />
            </View>
            <Text className="flex-1 text-[14px] font-medium text-[#1A1A1A]">
              Choose from library
            </Text>
            <Ionicons color="#C0B8B0" name="chevron-forward" size={16} />
          </Pressable>

          {error ? (
            <Text className="mt-4 text-[13px] text-red-500">{error}</Text>
          ) : null}

          <View className="flex-1" />
        </View>

        <View className="px-6" style={bottomAreaStyle}>
          <Pressable
            className="h-[52px] w-full items-center justify-center rounded-xl"
            disabled={isSubmitting}
            onPress={handleContinue}
            style={{ backgroundColor: "#04170E" }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text className="text-[15px] font-semibold text-white">Continue</Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
