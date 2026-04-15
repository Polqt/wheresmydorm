import { asyncStorageAdapter } from "@/lib/mmkv";
import { ONBOARDING_COMPLETE_KEY } from "@/lib/onboarding";

function getOnboardingStorageKey(userId?: string | null) {
  return userId
    ? `${ONBOARDING_COMPLETE_KEY}.${userId}`
    : ONBOARDING_COMPLETE_KEY;
}

export async function getOnboardingCompletion(userId?: string | null) {
  try {
    const value = await asyncStorageAdapter.getItem(
      getOnboardingStorageKey(userId),
    );
    return value === "true";
  } catch {
    return false;
  }
}

export async function setOnboardingCompletion(userId?: string | null) {
  const key = getOnboardingStorageKey(userId);
  await asyncStorageAdapter.setItem(key, "true");

  if (userId) {
    await asyncStorageAdapter.setItem(ONBOARDING_COMPLETE_KEY, "true");
  }
}
