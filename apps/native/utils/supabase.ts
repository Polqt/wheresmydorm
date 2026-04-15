import { createClient } from "@supabase/supabase-js";
import { env } from "@wheresmydorm/env/native";
import { asyncStorageAdapter } from "@/lib/mmkv";

export const supabase = createClient(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_KEY,
  {
    auth: {
      storage: asyncStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

let cachedAccessToken: string | null = null;
let didPrimeAccessToken = false;

supabase.auth.onAuthStateChange((_event, session) => {
  cachedAccessToken = session?.access_token ?? null;
});

export async function getCachedAccessToken() {
  if (cachedAccessToken || didPrimeAccessToken) {
    return cachedAccessToken;
  }

  didPrimeAccessToken = true;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  cachedAccessToken = session?.access_token ?? null;
  return cachedAccessToken;
}
