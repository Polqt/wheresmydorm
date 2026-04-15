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
    bundleIdentifier: "com.wheresmydorm.app",
    buildNumber: "1",
    config: googleMapsApiKey
      ? {
          googleMapsApiKey,
        }
      : undefined,
  },
  android: {
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.wheresmydorm.app",
    versionCode: 1,
    googleServicesFile: "./google-services.json",
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
  extra: {
    eas: {
      projectId: "YOUR_EAS_PROJECT_ID",
    },
  },
  updates: {
    url: "https://u.expo.dev/YOUR_EAS_PROJECT_ID",
  },
  runtimeVersion: {
    policy: "appVersion",
  },
  plugins: [
    "expo-router",
    [
      "expo-notifications",
      {
        icon: "./assets/icons/notification-icon.png",
        color: "#ea580c",
        defaultChannel: "default",
        sounds: [],
      },
    ],
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
