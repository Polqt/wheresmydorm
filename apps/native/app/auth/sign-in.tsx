import { router } from "expo-router";
import { useCallback, useState } from "react";

import { SignInForm } from "@/components/sign-in-form";
import { getOAuthErrorMessage } from "@/lib/auth";
import { signInWithOAuth } from "@/services/auth";
import type { ActiveProvider, OAuthProvider } from "@/types/auth";

export default function NativeSignInScreen() {
  const [activeProvider, setActiveProvider] = useState<ActiveProvider>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOAuthSignIn = useCallback(async (provider: OAuthProvider) => {
    setActiveProvider(provider);
    setErrorMessage(null);

    try {
      const didComplete = await signInWithOAuth(provider);

      if (didComplete) {
        router.replace("/(tabs)/map");
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
