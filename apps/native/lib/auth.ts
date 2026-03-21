import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";

import type { PendingAuthEmail, RoleCard } from "@/types/auth";

export const AUTH_TERMS_COPY =
  "By continuing you agree to our Terms of Service and Privacy Policy.";
export const EMAIL_CODE_LENGTH = 8;
export const EMAIL_OTP_COOLDOWN_MS = 60_000;
export const SOCIAL_BUTTON_CLASS_NAME =
  "mt-3 h-14 w-full flex-row items-center rounded-2xl border border-slate-200 bg-white px-5";
export const AUTH_TEXT_INPUT_CLASS_NAME =
  "mt-2 h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-900";
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

export function getEmailOtpRateLimitMessage(secondsRemaining: number) {
  return `Please wait ${secondsRemaining}s before requesting another code.`;
}

export function parseEmailOtpRetryAfterSeconds(errorMessage: string) {
  const lowerCaseMessage = errorMessage.toLowerCase();
  const messageHasRateLimit =
    lowerCaseMessage.includes("rate limit") ||
    lowerCaseMessage.includes("too many requests") ||
    lowerCaseMessage.includes("security purposes") ||
    lowerCaseMessage.includes("try again") ||
    lowerCaseMessage.includes("wait");

  if (!messageHasRateLimit) {
    return null;
  }

  const minutesMatch = lowerCaseMessage.match(/(\d+)\s*(minute|min)\b/);
  if (minutesMatch) {
    const parsedMinutes = Number.parseInt(minutesMatch[1] ?? "", 10);

    if (Number.isFinite(parsedMinutes) && parsedMinutes > 0) {
      return parsedMinutes * 60;
    }
  }

  const secondsMatch = lowerCaseMessage.match(/(\d+)\s*(second|sec)\b/);

  if (!secondsMatch) {
    return EMAIL_OTP_COOLDOWN_MS / 1000;
  }

  const parsedSeconds = Number.parseInt(secondsMatch[1] ?? "", 10);

  return Number.isFinite(parsedSeconds) && parsedSeconds > 0
    ? parsedSeconds
    : EMAIL_OTP_COOLDOWN_MS / 1000;
}
