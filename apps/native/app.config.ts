import type { ExpoConfig } from "expo/config";

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;

const config: ExpoConfig = {
  name: "wheresmydorm",
  slug: "wheresmydorm",
  version: "1.0.0",
  orientation: "portrait",
  scheme: ["wheresmydorm", "mybetterapp"],
  userInterfaceStyle: "light",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    config: googleMapsApiKey
      ? {
          googleMapsApiKey,
        }
      : undefined,
  },
  android: {
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.anonymous.wheresmydorm",
    config: googleMapsApiKey
      ? {
          googleMaps: {
            apiKey: googleMapsApiKey,
          },
        }
      : undefined,
  },
  web: {
    output: "static",
  },
  plugins: [
    "expo-router",
    "expo-notifications",
    "expo-video",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#04170E",
        dark: {
          backgroundColor: "#04170E",
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
