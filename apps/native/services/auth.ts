import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { getAuthRedirectUrl, normalizeAuthEmail } from "@/lib/auth";
import { asyncStorageAdapter } from "@/lib/mmkv";
import type { OAuthProvider } from "@/types/auth";
import { supabase } from "@/utils/supabase";

const RESTORE_KEY = "wmd:last_session";

WebBrowser.maybeCompleteAuthSession();

async function waitForSession(timeoutMs = 2500) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return false;
}

function parseParamValue(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function parseOAuthResponse(url: string) {
  const parsed = Linking.parse(url);
  const query = parsed.queryParams ?? {};
  const hashParams =
    url.includes("#") && url.split("#")[1]
      ? new URLSearchParams(url.split("#")[1] ?? "")
      : new URLSearchParams();

  return {
    accessToken:
      parseParamValue(query.access_token) ?? hashParams.get("access_token"),
    code: parseParamValue(query.code) ?? hashParams.get("code"),
    error: parseParamValue(query.error) ?? hashParams.get("error"),
    errorDescription:
      parseParamValue(query.error_description) ??
      hashParams.get("error_description"),
    refreshToken:
      parseParamValue(query.refresh_token) ?? hashParams.get("refresh_token"),
  };
}

export async function signInWithOAuth(provider: OAuthProvider) {
  const redirectTo = getAuthRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });

  if (error) throw error;
  if (!data.url) throw new Error("No OAuth URL returned.");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== "success") {
    if (await waitForSession()) return true;
    throw new Error(
      "Sign-in finished in the browser but the app didn't receive the callback. " +
        `Make sure ${redirectTo} is in your Supabase Auth redirect URLs.`,
    );
  }

  const {
    accessToken,
    code,
    error: oauthError,
    errorDescription,
    refreshToken,
  } = parseOAuthResponse(result.url);

  if (oauthError || errorDescription) {
    throw new Error(
      errorDescription ?? oauthError ?? "OAuth sign-in was denied.",
    );
  }

  if (accessToken && refreshToken) {
    const { error: setSessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (setSessionError) throw setSessionError;
    return true;
  }

  if (!code) {
    if (await waitForSession()) return true;
    throw new Error("Missing OAuth callback data.");
  }

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
  return true;
}

/**
 * Save the current session's refresh token before sign-out.
 * Called by the AuthProvider so tryRestoreSession() can
 * skip OTP on quick re-login with the same email.
 */
export async function saveSessionForRestore(): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.refresh_token || !session.user.email) return;

  await asyncStorageAdapter.setItem(
    RESTORE_KEY,
    JSON.stringify({
      email: session.user.email.toLowerCase(),
      refreshToken: session.refresh_token,
    }),
  );
}

/**
 * Try to restore a previous session for this email.
 * Uses the refresh token saved at sign-out to get a fresh session,
 * avoiding Supabase's email OTP rate limit entirely.
 */
export async function tryRestoreSession(email: string): Promise<boolean> {
  try {
    const raw = await asyncStorageAdapter.getItem(RESTORE_KEY);
    if (!raw) return false;

    const { email: savedEmail, refreshToken } = JSON.parse(raw) as {
      email: string;
      refreshToken: string;
    };

    if (savedEmail !== normalizeAuthEmail(email)) return false;

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      await asyncStorageAdapter.removeItem(RESTORE_KEY);
      return false;
    }

    // Session restored — clean up the stored token
    await asyncStorageAdapter.removeItem(RESTORE_KEY);
    return true;
  } catch {
    return false;
  }
}

export async function sendEmailOtp(email: string) {
  const normalizedEmail = normalizeAuthEmail(email);

  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: { shouldCreateUser: true },
  });

  if (error) {
    if (error.message.toLowerCase().includes("rate limit")) {
      throw new Error(
        "Too many sign-in attempts. Please wait 60 seconds and try again.\n\n" +
          "Tip: Go to Supabase Dashboard → Authentication → SMTP Settings " +
          "and add a custom SMTP provider (e.g. Resend) to remove this limit.",
      );
    }
    throw error;
  }
  return normalizedEmail;
}

export async function verifyEmailOtp(email: string, token: string) {
  const { error } = await supabase.auth.verifyOtp({
    email: normalizeAuthEmail(email),
    token,
    type: "email",
  });
  if (error) throw error;
}
