import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";

export async function createContext(req: NextRequest) {
  // No auth configured
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
        }
      }
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    supabase,
    user,
    userId:  user?.id ?? null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
