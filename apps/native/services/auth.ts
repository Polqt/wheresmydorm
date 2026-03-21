import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { getAuthRedirectUrl, normalizeAuthEmail } from "@/lib/auth";
import type { OAuthProvider, PendingAuthEmail } from "@/types/auth";
import { supabase } from "@/utils/supabase";

WebBrowser.maybeCompleteAuthSession();

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
    return false;
  }

  const parsed = Linking.parse(result.url);
  const code =
    typeof parsed.queryParams?.code === "string"
      ? parsed.queryParams.code
      : null;

  if (!code) {
    throw new Error("Missing OAuth code.");
  }

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    throw exchangeError;
  }

  return true;
}

export async function sendEmailOtp(email: string) {
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

  return normalizedEmail;
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
