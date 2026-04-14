import Ionicons from "@expo/vector-icons/Ionicons";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { SetupProgressBar } from "@/components/ui/setup-progress-bar";
import { useCurrentProfile } from "@/hooks/use-current-profile";
import { ONBOARDING_STEPS, PROFILE_QUERY_KEY } from "@/lib/auth";
import { useAuth } from "@/providers/auth-provider";
import { LISTING_PROPERTY_TYPES } from "@/services/listings";
import { updateCurrentProfile } from "@/services/profile";
import type { ListingPropertyType } from "@/types/listings";

const CURRENT_STEP = 4;

function toggleTypedValue<T>(value: T, current: T[]) {
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
}

export default function RolePreferencesScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { role, user } = useAuth();
  const profileQuery = useCurrentProfile(user);
  const profile = profileQuery.data;

  const [preferredArea, setPreferredArea] = useState("");
  const [finderBudgetMin, setFinderBudgetMin] = useState("");
  const [finderBudgetMax, setFinderBudgetMax] = useState("");
  const [finderPropertyTypes, setFinderPropertyTypes] = useState<
    ListingPropertyType[]
  >([]);
  const [propertyTypes, setPropertyTypes] = useState<ListingPropertyType[]>([]);
  const [listerPropertyCount, setListerPropertyCount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFinder = role === "finder";
  const canContinue = !isSubmitting;
  const bottomAreaStyle = useMemo(
    () => ({ paddingBottom: Math.max(insets.bottom + 8, 24) }),
    [insets.bottom],
  );

  useEffect(() => {
    if (!profile) {
      return;
    }

    setPreferredArea(profile.preferredArea ?? "");
    setFinderBudgetMin(profile.finderBudgetMin ?? "");
    setFinderBudgetMax(profile.finderBudgetMax ?? "");
    setFinderPropertyTypes(
      (profile.finderPropertyTypes as ListingPropertyType[] | undefined) ?? [],
    );
    setPropertyTypes((profile.propertyTypes as ListingPropertyType[] | undefined) ?? []);
    setListerPropertyCount(
      profile.listerPropertyCount ? String(profile.listerPropertyCount) : "",
    );
  }, [profile]);

  const handleToggleFinderPropertyType = useCallback(
    (value: ListingPropertyType) => {
      setFinderPropertyTypes((current) => toggleTypedValue(value, current));
    },
    [],
  );

  const handleToggleListerPropertyType = useCallback(
    (value: ListingPropertyType) => {
      setPropertyTypes((current) => toggleTypedValue(value, current));
    },
    [],
  );

  const handleContinue = useCallback(async () => {
    if (!user) {
      return;
    }

    const parsedPropertyCount = Number(listerPropertyCount);

    if (
      !isFinder &&
      listerPropertyCount.trim().length > 0 &&
      (!Number.isInteger(parsedPropertyCount) || parsedPropertyCount < 0)
    ) {
      setError("Enter a valid number of properties.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const nextProfile = await updateCurrentProfile(user.id, {
        finderBudgetMax: isFinder ? finderBudgetMax.trim() || null : null,
        finderBudgetMin: isFinder ? finderBudgetMin.trim() || null : null,
        finderPropertyTypes: isFinder ? finderPropertyTypes : [],
        listerPropertyCount:
          isFinder || listerPropertyCount.trim().length === 0
            ? null
            : parsedPropertyCount,
        preferredArea: isFinder ? preferredArea.trim() || null : null,
        propertyTypes: isFinder ? [] : propertyTypes,
      });
      queryClient.setQueryData([PROFILE_QUERY_KEY, user.id], nextProfile);
      router.replace("/auth/permissions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    finderBudgetMax,
    finderBudgetMin,
    finderPropertyTypes,
    isFinder,
    listerPropertyCount,
    preferredArea,
    propertyTypes,
    queryClient,
    user,
  ]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
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
              {isFinder ? "Set your search lane" : "Set your listing lane"}
            </Text>
            <Text className="mt-2 text-[14px] leading-6 text-[#8A8480]">
              {isFinder
                ? "Tell us where and how you usually search so Finder results feel more relevant from day one."
                : "Tell us what kinds of spaces you manage so your Lister dashboard starts with the right context."}
            </Text>

            {isFinder ? (
              <View className="mt-8 gap-5">
                <View>
                  <Text className="mb-2 text-[13px] font-semibold text-[#4A4540]">
                    Preferred area
                  </Text>
                  <TextInput
                    autoCapitalize="words"
                    autoCorrect={false}
                    className="h-[52px] rounded-xl border border-[#D8D2CA] bg-white px-4 text-[15px] text-[#1A1A1A]"
                    onChangeText={(value) => {
                      setPreferredArea(value);
                      setError(null);
                    }}
                    placeholder="USLS, Mandalagan, Bacolod"
                    placeholderTextColor="#C0B8B0"
                    value={preferredArea}
                  />
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="mb-2 text-[13px] font-semibold text-[#4A4540]">
                      Budget min
                    </Text>
                    <TextInput
                      className="h-[52px] rounded-xl border border-[#D8D2CA] bg-white px-4 text-[15px] text-[#1A1A1A]"
                      keyboardType="numeric"
                      onChangeText={setFinderBudgetMin}
                      placeholder="2500"
                      placeholderTextColor="#C0B8B0"
                      value={finderBudgetMin}
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="mb-2 text-[13px] font-semibold text-[#4A4540]">
                      Budget max
                    </Text>
                    <TextInput
                      className="h-[52px] rounded-xl border border-[#D8D2CA] bg-white px-4 text-[15px] text-[#1A1A1A]"
                      keyboardType="numeric"
                      onChangeText={setFinderBudgetMax}
                      placeholder="6000"
                      placeholderTextColor="#C0B8B0"
                      value={finderBudgetMax}
                    />
                  </View>
                </View>

                <View>
                  <Text className="mb-3 text-[13px] font-semibold text-[#4A4540]">
                    Search preferences
                  </Text>
                  <View className="flex-row flex-wrap gap-3">
                    {LISTING_PROPERTY_TYPES.map((propertyType) => {
                      const isSelected = finderPropertyTypes.includes(
                        propertyType.value,
                      );

                      return (
                        <Pressable
                          key={propertyType.value}
                          className={`rounded-full border px-4 py-2.5 ${
                            isSelected
                              ? "border-[#0B2D23] bg-[#EEF5F1]"
                              : "border-[#D8D2CA] bg-white"
                          }`}
                          onPress={() =>
                            handleToggleFinderPropertyType(propertyType.value)
                          }
                        >
                          <Text
                            className={`text-[13px] font-semibold ${
                              isSelected ? "text-[#0B2D23]" : "text-[#4A4540]"
                            }`}
                          >
                            {propertyType.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            ) : (
              <View className="mt-8 gap-5">
                <View>
                  <Text className="mb-2 text-[13px] font-semibold text-[#4A4540]">
                    Number of properties
                  </Text>
                  <TextInput
                    className="h-[52px] rounded-xl border border-[#D8D2CA] bg-white px-4 text-[15px] text-[#1A1A1A]"
                    keyboardType="numeric"
                    onChangeText={setListerPropertyCount}
                    placeholder="1"
                    placeholderTextColor="#C0B8B0"
                    value={listerPropertyCount}
                  />
                </View>

                <View>
                  <Text className="mb-3 text-[13px] font-semibold text-[#4A4540]">
                    Property types you manage
                  </Text>
                  <View className="flex-row flex-wrap gap-3">
                    {LISTING_PROPERTY_TYPES.map((propertyType) => {
                      const isSelected = propertyTypes.includes(propertyType.value);

                      return (
                        <Pressable
                          key={propertyType.value}
                          className={`rounded-full border px-4 py-2.5 ${
                            isSelected
                              ? "border-[#0B2D23] bg-[#EEF5F1]"
                              : "border-[#D8D2CA] bg-white"
                          }`}
                          onPress={() =>
                            handleToggleListerPropertyType(propertyType.value)
                          }
                        >
                          <Text
                            className={`text-[13px] font-semibold ${
                              isSelected ? "text-[#0B2D23]" : "text-[#4A4540]"
                            }`}
                          >
                            {propertyType.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            <View className="mt-5 rounded-xl bg-[#FAF8F5] px-4 py-3">
              <Text className="text-[12px] leading-[18px] text-[#8A8480]">
                {isFinder
                  ? "These preferences prefill finder search context, but they never lock you into one area or budget."
                  : "This does not limit your listings. Listers can still create unlimited listings under the current product rules."}
              </Text>
            </View>

            {error ? (
              <Text className="mt-3 text-[13px] text-red-500">{error}</Text>
            ) : null}

            <View className="flex-1" />
          </View>

          <View className="px-6" style={bottomAreaStyle}>
            <Pressable
              className={`h-[52px] w-full items-center justify-center rounded-2xl ${
                canContinue ? "bg-brand-orange" : "bg-[#E8E3DC]"
              }`}
              disabled={!canContinue}
              onPress={handleContinue}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text className={`text-[15px] font-bold ${canContinue ? "text-white" : "text-[#A09A90]"}`}>
                  Continue
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
