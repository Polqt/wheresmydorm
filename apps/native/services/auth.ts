import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { getAuthRedirectUrl, normalizeAuthEmail } from "@/lib/auth";
import type { OAuthProvider } from "@/types/auth";
import { supabase } from "@/utils/supabase";

WebBrowser.maybeCompleteAuthSession();

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
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return true;
    throw new Error(
      "Sign-in finished in the browser but the app didn't receive the callback. " +
      `Make sure ${redirectTo} is in your Supabase Auth redirect URLs.`,
    );
  }

  const { accessToken, code, error: oauthError, errorDescription, refreshToken } =
    parseOAuthResponse(result.url);

  if (oauthError || errorDescription) {
    throw new Error(errorDescription ?? oauthError ?? "OAuth sign-in was denied.");
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
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return true;
    throw new Error("Missing OAuth callback data.");
  }

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
  return true;
}

/**
 * Try to restore an existing session for this email.
 * If the user logged out softly and the refresh token is still valid,
 * this avoids hitting the OTP rate limit entirely.
 */
export async function tryRestoreSession(email: string): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  // Verify the session belongs to this email
  if (session.user.email?.toLowerCase() !== normalizeAuthEmail(email)) {
    return false;
  }

  // Validate with server — token might be expired
  const { error } = await supabase.auth.getUser();
  if (error) {
    await supabase.auth.signOut({ scope: "local" });
    return false;
  }

  return true;
}

export async function sendEmailOtp(email: string) {
  const normalizedEmail = normalizeAuthEmail(email);

  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: { shouldCreateUser: true },
  });

  if (error) throw error;
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
