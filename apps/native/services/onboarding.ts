import AsyncStorage from "@react-native-async-storage/async-storage";

import { ONBOARDING_COMPLETE_KEY } from "@/lib/onboarding";

function getOnboardingStorageKey(userId?: string | null) {
  return userId ? `${ONBOARDING_COMPLETE_KEY}:${userId}` : ONBOARDING_COMPLETE_KEY;
}

export async function getOnboardingCompletion(userId?: string | null) {
  try {
    const value = await AsyncStorage.getItem(getOnboardingStorageKey(userId));
    return value === "true";
  } catch {
    return false;
  }
}

export async function setOnboardingCompletion(userId?: string | null) {
  const key = getOnboardingStorageKey(userId);
  await AsyncStorage.setItem(key, "true");

  if (userId) {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
  }
}
