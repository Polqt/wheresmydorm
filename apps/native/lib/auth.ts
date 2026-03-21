import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";

import type { PendingAuthEmail, RoleCard } from "@/types/auth";

export const AUTH_TERMS_COPY =
  "By continuing you agree to our Terms of Service and Privacy Policy.";
export const EMAIL_CODE_LENGTH = 6;
export const SOCIAL_BUTTON_CLASS_NAME =
  "mt-3 h-14 w-full flex-row items-center rounded-2xl border border-slate-200 bg-white px-5";
export const AUTH_TEXT_INPUT_CLASS_NAME =
  "mt-2 h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-900";
export const ROLE_CARDS: readonly RoleCard[] = [
  {
    emoji: "🔍",
    role: "finder",
    subtitle: "Search listings, AI chat, reviews.",
    title: "I'm looking for a place",
  },
  {
    emoji: "🏠",
    role: "lister",
    subtitle: "Post listings, manage inquiries, respond to reviews.",
    title: "I have a place to rent",
  },
] as const;

export function getAuthRedirectUrl() {
  const scheme = Array.isArray(Constants.expoConfig?.scheme)
    ? Constants.expoConfig.scheme[0]
    : Constants.expoConfig?.scheme;

  return AuthSession.makeRedirectUri({
    scheme: scheme ?? "mybettertapp",
    path: "auth/callback",
  });
}

export function normalizeAuthEmail(email: string): PendingAuthEmail {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeAuthEmail(email));
}
