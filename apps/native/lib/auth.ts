import Constants from "expo-constants";

import type { RoleCard } from "@/types/auth";

export const AUTH_CALLBACK_PATH = "auth/callback";
export const AUTH_SCHEME = "mybetterapp";
export const AUTH_TERMS_COPY =
  "By continuing you agree to our Terms of Service and Privacy Policy.";
export const EMAIL_CODE_LENGTH = 8;

export const ROLE_CARDS: readonly RoleCard[] = [
  {
    emoji: "\u{1F50D}",
    role: "finder",
    subtitle: "Search listings, AI chat, reviews.",
    title: "I'm looking for a place",
  },
  {
    emoji: "\u{1F3E0}",
    role: "lister",
    subtitle: "Post listings, manage inquiries, respond to reviews.",
    title: "I have a place to rent",
  },
] as const;

export function getAuthRedirectUrl() {
  const scheme = Array.isArray(Constants.expoConfig?.scheme)
    ? Constants.expoConfig.scheme[0]
    : (Constants.expoConfig?.scheme ?? AUTH_SCHEME);

  return `${scheme}://${AUTH_CALLBACK_PATH}`;
}

export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeAuthEmail(email));
}
