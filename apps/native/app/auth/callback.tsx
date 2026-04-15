import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { AppLaunchScreen } from "@/components/ui/launch-screen";
import { supabase } from "@/utils/supabase";

export default function AutahCallbackScreen() {
  const {
    access_token: accessToken,
    code,
    error,
    error_description: errorDescription,
    refresh_token: refreshToken,
  } = useLocalSearchParams<{
    access_token?: string;
    code?: string;
    error?: string;
    error_description?: string;
    refresh_token?: string;
  }>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const completeAuth = async () => {
      try {
        if (typeof errorDescription === "string" || typeof error === "string") {
          throw new Error(
            errorDescription ?? error ?? "Unable to complete sign-in.",
          );
        }

        if (
          typeof accessToken === "string" &&
          typeof refreshToken === "string"
        ) {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (setSessionError) {
            throw setSessionError;
          }
        } else if (typeof code === "string") {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            throw exchangeError;
          }
        } else {
          throw new Error("Missing OAuth callback data.");
        }
      } catch (authError) {
        if (!isCancelled) {
          setErrorMessage(
            authError instanceof Error
              ? authError.message
              : "Unable to complete sign-in.",
          );
          router.replace("/auth/sign-in");
        }
      }
    };

    void completeAuth();

    return () => {
      isCancelled = true;
    };
  }, [accessToken, code, error, errorDescription, refreshToken]);

  if (!errorMessage) {
    return (
      <AppLaunchScreen
        body="We're finishing your secure sign-in."
        title="Signing you in"
      />
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-white px-8">
      <Text className="text-center text-red-600 text-sm">{errorMessage}</Text>
    </View>
  );
}
