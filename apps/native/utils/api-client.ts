import Constants from "expo-constants";

import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { AppRouter } from "@wheresmydorm/api/routers/index";
import { env } from "@wheresmydorm/env/native";

import { getCachedAccessToken } from "./supabase";

function getExpoDebugHost() {
  const expoGoConfig = Constants.expoGoConfig as
    | { debuggerHost?: string | null }
    | undefined;

  const debuggerHost = expoGoConfig?.debuggerHost;
  return debuggerHost ? debuggerHost.split(":")[0] ?? null : null;
}

function getNativeServerUrl() {
  const url = new URL(env.EXPO_PUBLIC_SERVER_URL);
  const isLocalhost =
    url.hostname === "localhost" || url.hostname === "127.0.0.1";

  if (!isLocalhost) {
    return url.toString().replace(/\/$/, "");
  }

  const expoDebugHost = getExpoDebugHost();
  if (expoDebugHost) {
    url.hostname = expoDebugHost;
    return url.toString().replace(/\/$/, "");
  }

  if (process.env.EXPO_OS === "android") {
    url.hostname = "10.0.2.2";
  }

  return url.toString().replace(/\/$/, "");
}

export const queryClient = new QueryClient();

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getNativeServerUrl()}/api/trpc`,
      headers: async () => {
        const accessToken = await getCachedAccessToken();

        return accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : {};
      },
      fetch: async (url, options) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20_000);

        try {
          return await fetch(url, {
            ...options,
            signal: controller.signal,
          });
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            throw new Error(
              `API request timed out. Make sure ${getNativeServerUrl()} is running and reachable from your phone/emulator.`,
            );
          }

          throw error;
        } finally {
          clearTimeout(timeoutId);
        }
      },
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
