import "../global.css";
import {
  DarkTheme,
  DefaultTheme,
  type Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef } from "react";
import { Platform, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NAV_THEME } from "@/lib/constants";
import { setAndroidNavigationBar } from "@/lib/navigation-bar";
import { useColorScheme } from "@/lib/use-color-scheme";
import { AuthProvider } from "@/providers/auth-provider";
import { queryClient } from "@/utils/api-client";

const LIGHT_THEME: Theme = {
  ...DefaultTheme,
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  ...DarkTheme,
  colors: NAV_THEME.dark,
};

export const unstable_settings = {
  initialRouteName: "index",
};

const useIsomorphicLayoutEffect =
  Platform.OS === "web" && typeof window === "undefined"
    ? React.useEffect
    : React.useLayoutEffect;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default function RootLayout() {
  const hasMounted = useRef(false);
  const { colorScheme, isDarkColorScheme } = useColorScheme();
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);

  useIsomorphicLayoutEffect(() => {
    if (hasMounted.current) {
      return;
    }
    setAndroidNavigationBar(colorScheme);
    setIsColorSchemeLoaded(true);
    hasMounted.current = true;
  }, []);

  if (!isColorSchemeLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
        <StatusBar style={isDarkColorScheme ? "light" : "dark"} />
        <GestureHandlerRootView style={styles.container}>
          <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(finder-tabs)" />
              <Stack.Screen name="(lister-tabs)" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen
                name="modal"
                options={{ title: "Modal", presentation: "modal" }}
              />
              <Stack.Screen name="profile" />
              <Stack.Screen name="listing" />
              <Stack.Screen name="post" />
              <Stack.Screen name="listings" />
              <Stack.Screen name="messages" />
              <Stack.Screen name="notifications" />
              <Stack.Screen name="payments" />
              <Stack.Screen name="reviews" />
              <Stack.Screen name="admin" />
            </Stack>
          </AuthProvider>
        </GestureHandlerRootView>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
