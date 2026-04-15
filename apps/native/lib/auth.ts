import * as Linking from "expo-linking";

import type { OAuthProvider, RoleCard } from "@/types/auth";

export const AUTH_CALLBACK_PATH = "auth/callback";
export const AUTH_SCHEME = "wheresmydorm";
export const PROFILE_QUERY_KEY = "auth-profile";
export const ONBOARDING_STEPS = 5;
export const AUTH_TERMS_COPY =
  "By continuing you agree to our Terms of Service and Privacy Policy.";
export const EMAIL_CODE_LENGTH = 8;

export const ROLE_CARDS: readonly RoleCard[] = [
  {
    emoji: "\u{1F50D}",
    role: "finder",
    subtitle:
      "Search on the map, save places, use AI chat, and review rentals.",
    title: "I'm looking for a place",
  },
  {
    emoji: "\u{1F3E0}",
    role: "lister",
    subtitle: "Publish listings, manage inquiries, and post vacancy updates.",
    title: "I have a place to rent",
  },
] as const;

export function getAuthRedirectUrl() {
  return Linking.createURL(AUTH_CALLBACK_PATH, {
    scheme: AUTH_SCHEME,
  });
}

export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeAuthEmail(email));
}

function getProviderLabel(provider: OAuthProvider) {
  if (provider === "google") return "Google";
  if (provider === "facebook") return "Facebook";
  return "Apple";
}

export function getOAuthErrorMessage(
  provider: OAuthProvider,
  error: unknown,
): string {
  if (!(error instanceof Error)) {
    return `${getProviderLabel(provider)} sign-in failed.`;
  }

  const msg = error.message.toLowerCase();

  if (provider === "google" && msg.includes("redirect_to is not allowed")) {
    return `Google sign-in redirect is blocked. Add ${getAuthRedirectUrl()} to Supabase Auth redirect URLs, then rebuild the app so the updated scheme is registered on the device.`;
  }

  if (provider === "google" && msg.includes("provider")) {
    return "Google sign-in is not enabled in Supabase yet. Please enable Google provider with your web OAuth client ID/secret.";
  }

  if (provider === "google" && msg.includes("callback")) {
    return `Sign-in callback failed.\n\nExpected mobile callback: ${getAuthRedirectUrl()}`;
  }

  return `${getProviderLabel(provider)} sign-in failed. Please try again.`;
}
