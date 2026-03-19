import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export async function createContext(req: NextRequest) {
  const supabase = createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        // trpc route handler - cookie writes (handled by middleware)
        setAll: () => {},
      },
      global: {
        // support bearer token from the native app

        headers: {
          Authorization: req.headers.get("Authorization") ?? "",
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    supabase,
    session,
    user,
    userId: user?.id ?? null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
