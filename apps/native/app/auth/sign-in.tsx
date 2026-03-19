import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { supabase } from "@/utils/supabase";

WebBrowser.maybeCompleteAuthSession();

export default function NativeSignInScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const scheme = Array.isArray(Constants.expoConfig?.scheme)
        ? Constants.expoConfig?.scheme[0]
        : Constants.expoConfig?.scheme;
      const redirectTo = AuthSession.makeRedirectUri({
        scheme: scheme ?? "mybettertapp",
        path: "auth/callback",
      });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        throw error;
      }

      if (!data.url) {
        throw new Error("Supabase did not return an OAuth URL.");
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
      );

      if (result.type !== "success") {
        setIsLoading(false);
        return;
      }

      const parsed = Linking.parse(result.url);
      const code =
        typeof parsed.queryParams?.code === "string"
          ? parsed.queryParams.code
          : null;

      if (!code) {
        throw new Error("Missing OAuth code in the redirect response.");
      }

      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        throw exchangeError;
      }

      router.replace("/auth/role-select");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Google sign-in failed.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Android MVP</Text>
        <Text style={styles.title}>
          Google is the only sign-in path for WheresMyDorm
        </Text>
        <Text style={styles.body}>
          We'll keep the session alive with Supabase, create your profile, and
          send you to role selection the first time you connect.
        </Text>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <Pressable
          disabled={isLoading}
          onPress={handleGoogleSignIn}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>
            {isLoading ? "Connecting to Google..." : "Continue with Google"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "#fff7ed",
  },
  heroCard: {
    borderRadius: 32,
    backgroundColor: "#fffbeb",
    padding: 24,
  },
  eyebrow: {
    color: "#9a3412",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 10,
    color: "#0f172a",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
  },
  body: {
    marginTop: 12,
    color: "#475569",
    fontSize: 15,
    lineHeight: 24,
  },
  error: {
    marginTop: 14,
    color: "#b91c1c",
    fontSize: 13,
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: 20,
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "#ea580c",
    paddingVertical: 15,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
});
