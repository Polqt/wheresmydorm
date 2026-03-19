import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.redirect(`${origin}/login?error=missing-user`);
      }

      const admin = createAdminClient();
      const fallbackName = user.email?.split("@")[0] ?? "WheresMyDorm user";
      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .upsert(
          {
            id: user.id,
            display_name:
              user.user_metadata.full_name ??
              user.user_metadata.name ??
              fallbackName,
            avatar_url: user.user_metadata.avatar_url ?? null,
          },
          { onConflict: "id" },
        )
        .select("role")
        .single();

      if (profileError) {
        return NextResponse.redirect(
          `${origin}/login?error=profile-sync-error`,
        );
      }

      const destination = profile?.role ? next : "/role-selection";
      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        // we can be confident that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${destination}`);
      }
      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${destination}`);
      }
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
}
