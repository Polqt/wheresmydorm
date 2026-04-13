import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { db, profiles } from "@wheresmydorm/db";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

type AppRole = "admin" | "finder" | "lister";

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export async function createContext(req: NextRequest) {
  const authorization = req.headers.get("Authorization") ?? "";
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        // trpc route handler - cookie writes (handled by middleware)
        setAll: () => {},
      },
      global: {
        // support bearer token from the native app
        headers: {
          Authorization: authorization,
        },
      },
    },
  );
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  if (!authorization && req.cookies.getAll().length === 0) {
    return {
      supabaseAdmin,
      supabase,
      user: null,
      userId: null,
      role: null as AppRole | null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabaseAdmin,
      supabase,
      user: null,
      userId: null,
      role: null as AppRole | null,
    };
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
    columns: { role: true },
  });

  return {
    supabaseAdmin,
    supabase,
    user,
    userId: user.id,
    role: (profile?.role ?? null) as AppRole | null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
