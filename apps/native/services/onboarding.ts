import AsyncStorage from "@react-native-async-storage/async-storage";

import { ONBOARDING_COMPLETE_KEY } from "@/lib/onboarding";

export async function getOnboardingCompletion() {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
    return value === "true";
  } catch {
    return false;
  }
}

export async function setOnboardingCompletion() {
  await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
}
