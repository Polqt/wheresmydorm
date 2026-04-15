import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ALLOWED_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3001";

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "";
  const isAllowed =
    origin === ALLOWED_ORIGIN || process.env.NODE_ENV !== "production";

  const res = NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/trpc")) {
    res.headers.set(
      "Access-Control-Allow-Origin",
      isAllowed ? origin : ALLOWED_ORIGIN,
    );
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
  }

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: res.headers });
  }

  return res;
}

export const config = {
  matcher: ["/api/trpc/:path*"],
};
