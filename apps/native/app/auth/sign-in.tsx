import { router } from "expo-router";
import { useCallback, useState } from "react";

import { SignInForm } from "@/components/sign-in-form";
import { getAuthRedirectUrl } from "@/lib/auth";
import { signInWithOAuth } from "@/services/auth";
import type { ActiveProvider, OAuthProvider } from "@/types/auth";

function getProviderLabel(provider: OAuthProvider) {
  if (provider === "google") {
    return "Google";
  }

  if (provider === "facebook") {
    return "Facebook";
  }

  return "Apple";
}

function getOAuthErrorMessage(provider: OAuthProvider, error: unknown) {
  if (!(error instanceof Error)) {
    return `${getProviderLabel(provider)} sign-in failed.`;
  }

  const lowerCaseMessage = error.message.toLowerCase();

  if (
    provider === "google" &&
    lowerCaseMessage.includes("redirect_to is not allowed")
  ) {
    return `Google sign-in redirect is blocked. Add ${getAuthRedirectUrl()} to Supabase Auth redirect URLs.`;
  }

  if (provider === "google" && lowerCaseMessage.includes("provider")) {
    return "Google sign-in is not enabled in Supabase yet. Please enable Google provider with your web OAuth client ID/secret.";
  }

  return error.message;
}

export default function NativeSignInScreen() {
  const [activeProvider, setActiveProvider] = useState<ActiveProvider>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOAuthSignIn = useCallback(async (provider: OAuthProvider) => {
    setActiveProvider(provider);
    setErrorMessage(null);

    try {
      const didComplete = await signInWithOAuth(provider);

      if (didComplete) {
        router.replace("/");
      }
    } catch (error) {
      setErrorMessage(getOAuthErrorMessage(provider, error));
    } finally {
      setActiveProvider(null);
    }
  }, []);

  const handleGoogleSignIn = useCallback(() => {
    void handleOAuthSignIn("google");
  }, [handleOAuthSignIn]);

  const handleFacebookSignIn = useCallback(() => {
    void handleOAuthSignIn("facebook");
  }, [handleOAuthSignIn]);

  const handleContinueWithEmail = useCallback(() => {
    router.push("/auth/email");
  }, []);

  return (
    <SignInForm
      activeProvider={activeProvider}
      errorMessage={errorMessage}
      onContinueWithEmail={handleContinueWithEmail}
      onContinueWithFacebook={handleFacebookSignIn}
      onContinueWithGoogle={handleGoogleSignIn}
    />
  );
}
