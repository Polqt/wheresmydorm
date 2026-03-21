import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { AppLaunchScreen } from "@/components/ui/app-launch-screen";
import { supabase } from "@/utils/supabase";

export default function AuthCallbackScreen() {
  const { access_token: accessToken, code, refresh_token: refreshToken } =
    useLocalSearchParams<{
      access_token?: string;
      code?: string;
      refresh_token?: string;
    }>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const completeAuth = async () => {
      try {
        if (
          typeof accessToken === "string" &&
          typeof refreshToken === "string"
        ) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }
        } else if (typeof code === "string") {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }
        } else {
          throw new Error("Missing OAuth callback data.");
        }

        if (!isCancelled) {
          router.replace("/");
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
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
  }, [accessToken, code, refreshToken]);

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
