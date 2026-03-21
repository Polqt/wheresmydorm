import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import {
  EMAIL_OTP_COOLDOWN_MS,
  getAuthRedirectUrl,
  normalizeAuthEmail,
} from "@/lib/auth";
import type {
  EmailOtpSendResult,
  OAuthProvider,
  PendingAuthEmail,
} from "@/types/auth";
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

  const code = parseParamValue(query.code) ?? hashParams.get("code");
  const accessToken =
    parseParamValue(query.access_token) ?? hashParams.get("access_token");
  const refreshToken =
    parseParamValue(query.refresh_token) ?? hashParams.get("refresh_token");
  const errorDescription =
    parseParamValue(query.error_description) ??
    hashParams.get("error_description");
  const error = parseParamValue(query.error) ?? hashParams.get("error");

  return {
    accessToken,
    code,
    error,
    errorDescription,
    refreshToken,
  };
}

export async function signInWithOAuth(provider: OAuthProvider) {
  const redirectTo = getAuthRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    throw error;
  }

  if (!data.url) {
    throw new Error("No OAuth URL returned.");
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== "success") {
    // On Android, the custom tab closes via deep link before openAuthSessionAsync
    // signals "success". The callback screen may have already set the session.
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      return true;
    }

    return false;
  }

  const { accessToken, code, error: oauthError, errorDescription, refreshToken } =
    parseOAuthResponse(result.url);

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

    if (setSessionError) {
      throw setSessionError;
    }

    return true;
  }

  if (!code) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      return true;
    }

    throw new Error("Missing OAuth callback data.");
  }

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    throw exchangeError;
  }

  return true;
}

export async function sendEmailOtp(email: string): Promise<EmailOtpSendResult> {
  const normalizedEmail = normalizeAuthEmail(email);
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    throw error;
  }

  return {
    email: normalizedEmail,
    resendAvailableAt: Date.now() + EMAIL_OTP_COOLDOWN_MS,
  };
}

export async function verifyEmailOtp(email: PendingAuthEmail, token: string) {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    throw error;
  }
}
