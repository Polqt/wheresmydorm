# Ship Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make wheresmydorm shippable — production backend, native app store builds, CI, and environment configuration all ready for real users.

**Architecture:** Monorepo (Turborepo). Web/API on Cloudflare Workers via Next.js + Alchemy. Native app via Expo/EAS. Supabase for auth + DB. PayMongo for payments. No new features — only production hardening.

**Tech Stack:** pnpm workspaces · Expo SDK 53 · EAS Build · Next.js 15 · Cloudflare Workers · Supabase · tRPC · Drizzle ORM · Biome · GitHub Actions

---

## Files To Create / Modify

| File | Action | Purpose |
|---|---|---|
| `apps/native/app.config.ts` | Modify | Bundle ID, version, EAS project ID, OTA, push certs |
| `apps/native/eas.json` | Create | EAS build profiles (development / preview / production) |
| `apps/native/.env.example` | Create | Document all required native env vars |
| `.env.example` | Create | Document all required server env vars |
| `packages/env/src/native.ts` | Modify | Make PayMongo key required; add OTA channel |
| `apps/web/src/middleware.ts` | Create | CORS restriction on `/api/` routes |
| `apps/web/src/app/api/trpc/[trpc]/route.ts` | Modify | Respect CORS_ORIGIN header |
| `.github/workflows/ci.yml` | Create | Lint + typecheck on every PR/push |
| `.github/workflows/deploy-web.yml` | Create | Deploy web to Cloudflare on main push |
| `packages/db/supabase/migrations/<timestamp>_missing_rls_tables.sql` | Create | RLS for inquiry_statuses + saved_searches |
| `apps/native/app/profile.tsx` (finder) | Create | Dedicated finder profile screen |
| `apps/native/app/(finder-tabs)/profile.tsx` | Modify | Point to new finder profile screen |
| `apps/native/components/screens/lister/*` | Modify | Redesign 5 lister screens per approved mockup |
| `apps/native/components/screens/finder/*` | Modify | Redesign 5 finder screens per approved mockup |

---

## Phase 1 — Environment & Secrets

### Task 1: Create `.env.example` files

**Files:**
- Create: `.env.example` (server/web)
- Create: `apps/native/.env.example`

- [ ] **Step 1: Create root `.env.example`**

```bash
cat > .env.example << 'EOF'
# Supabase
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# API
ANTHROPIC_API_KEY=
CORS_ORIGIN=https://yourapp.com
NODE_ENV=production

# PayMongo
PAYMONGO_SECRET_KEY=sk_live_...
PAYMONGO_WEBHOOK_SECRET=whsec_...
EOF
```

- [ ] **Step 2: Create `apps/native/.env.example`**

```bash
cat > apps/native/.env.example << 'EOF'
EXPO_PUBLIC_SERVER_URL=https://yourapp.com
EXPO_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
EXPO_PUBLIC_SUPABASE_KEY=
EXPO_PUBLIC_GOOGLE_MAPS_KEY=
EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_live_...
EOF
```

- [ ] **Step 3: Make PayMongo public key required in native env schema**

In `packages/env/src/native.ts`, change:
```ts
EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY: z.string().min(1).optional(),
```
to:
```ts
EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY: z.string().min(1),
```

- [ ] **Step 4: Commit**

```bash
git add .env.example apps/native/.env.example packages/env/src/native.ts
git commit -m "chore: add env examples and make PayMongo key required"
```

---

## Phase 2 — Native App Config (EAS)

### Task 2: Fix `app.config.ts` — bundle ID, version, iOS bundle

**Files:**
- Modify: `apps/native/app.config.ts`

- [ ] **Step 1: Update bundle identifiers and version**

In `apps/native/app.config.ts`, update the `ios` and `android` blocks:

```ts
// Replace existing ios: {} and android: {} blocks with:
ios: {
  supportsTablet: true,
  bundleIdentifier: "com.wheresmydorm.app",   // choose your real bundle ID
  buildNumber: "1",
  config: googleMapsApiKey ? { googleMapsApiKey } : undefined,
},
android: {
  edgeToEdgeEnabled: true,
  predictiveBackGestureEnabled: false,
  package: "com.wheresmydorm.app",             // must match Play Console
  versionCode: 1,
  config: googleMapsApiKey
    ? { googleMaps: { apiKey: googleMapsApiKey } }
    : undefined,
},
```

Also update top-level version:
```ts
version: "1.0.0",   // bump to "1.0.0" when submitting to stores
```

- [ ] **Step 2: Add EAS project ID and OTA update config**

First, run `eas init` to get your project ID, then add to `app.config.ts`:

```ts
// Add after `version`:
extra: {
  eas: {
    projectId: "YOUR_EAS_PROJECT_ID",  // from `eas init` output
  },
},
updates: {
  url: "https://u.expo.dev/YOUR_EAS_PROJECT_ID",
},
runtimeVersion: {
  policy: "appVersion",
},
```

- [ ] **Step 3: Commit**

```bash
git add apps/native/app.config.ts
git commit -m "chore(native): set real bundle IDs, version, EAS project"
```

---

### Task 3: Create `eas.json`

**Files:**
- Create: `apps/native/eas.json`

- [ ] **Step 1: Create EAS build config**

```bash
cat > apps/native/eas.json << 'EOF'
{
  "$schema": "https://raw.githubusercontent.com/expo/eas-cli/main/packages/eas-cli/schema/eas.schema.json",
  "cli": {
    "version": ">= 16.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "autoIncrement": true,
      "channel": "production",
      "ios": {
        "enterpriseProvisioning": "adhoc"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "YOUR_APPLE_ID",
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-key.json",
        "track": "internal"
      }
    }
  }
}
EOF
```

- [ ] **Step 2: Verify EAS CLI is installed**

```bash
pnpm dlx eas-cli --version
# Expected: eas-cli/X.X.X
```

- [ ] **Step 3: Link project to EAS**

```bash
cd apps/native && pnpm dlx eas-cli init
# Follow prompts — this writes projectId into app.config.ts extra.eas
```

- [ ] **Step 4: Commit**

```bash
git add apps/native/eas.json
git commit -m "chore(native): add EAS build configuration"
```

---

### Task 4: Configure push notifications (Expo + FCM)

**Files:**
- Modify: `apps/native/app.config.ts`

Push notifications require an FCM server key (Android) and APNs key (iOS). EAS handles APNs automatically during build. FCM requires a `google-services.json`.

- [ ] **Step 1: Add `expo-notifications` plugin config to `app.config.ts`**

In the `plugins` array, update the `expo-notifications` entry:

```ts
[
  "expo-notifications",
  {
    icon: "./assets/icons/notification-icon.png",  // 96×96 white on transparent
    color: "#ea580c",
    defaultChannel: "default",
    sounds: [],
  },
],
```

- [ ] **Step 2: Download `google-services.json` from Firebase Console**

1. Go to Firebase Console → your project → Project Settings → Android app
2. Download `google-services.json`
3. Place at `apps/native/google-services.json`
4. Add to `.gitignore`: `apps/native/google-services.json`

- [ ] **Step 3: Add `google-services.json` to `app.config.ts`**

```ts
android: {
  // ... existing android config ...
  googleServicesFile: "./google-services.json",
},
```

- [ ] **Step 4: For iOS — EAS handles APNs automatically**

```bash
# During first production build EAS will prompt for APNs credentials
cd apps/native && pnpm dlx eas-cli credentials
# Select iOS → Auto-manage credentials
```

- [ ] **Step 5: Commit non-secret config**

```bash
git add apps/native/app.config.ts
git commit -m "chore(native): configure push notification plugin"
```

---

## Phase 3 — Backend Hardening

### Task 5: Add CORS middleware to API routes

**Files:**
- Create: `apps/web/src/middleware.ts`
- Modify: `apps/web/src/app/api/trpc/[trpc]/route.ts`

The tRPC API is currently open to any origin. Restrict it to `CORS_ORIGIN` env var in production.

- [ ] **Step 1: Create Next.js middleware for CORS**

```ts
// apps/web/src/middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ALLOWED_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3001";

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "";
  const isAllowed =
    origin === ALLOWED_ORIGIN ||
    process.env.NODE_ENV !== "production";

  const res = NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/trpc")) {
    res.headers.set(
      "Access-Control-Allow-Origin",
      isAllowed ? origin : ALLOWED_ORIGIN,
    );
    res.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS",
    );
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
```

- [ ] **Step 2: Verify type-check passes**

```bash
pnpm check-types
# Expected: no errors
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/middleware.ts
git commit -m "feat(web): add CORS middleware for tRPC routes"
```

---

### Task 6: Harden PayMongo webhook — add rate limiting via Supabase edge

The webhook at `apps/web/src/app/api/paymongo/webhook/route.ts` already verifies HMAC signature. Confirm it rejects unsigned requests and add basic request size guard.

- [ ] **Step 1: Read the current webhook handler**

```bash
cat apps/web/src/app/api/paymongo/webhook/route.ts
```

- [ ] **Step 2: Ensure early rejection of unsigned requests**

The file should have this shape — verify it matches, add if not:

```ts
// apps/web/src/app/api/paymongo/webhook/route.ts
import type { NextRequest } from "next/server";
import { verifyPaymongoWebhookSignature, handlePaymongoWebhook } from "@wheresmydorm/api/lib/paymongo";

export async function POST(req: NextRequest) {
  // Reject oversized payloads early
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > 1_000_000) {
    return new Response("Payload too large", { status: 413 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("paymongo-signature");

  if (!verifyPaymongoWebhookSignature(rawBody, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  try {
    const result = await handlePaymongoWebhook(rawBody);
    return Response.json(result);
  } catch (err) {
    console.error("[webhook] processing error", err);
    return new Response("Internal error", { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/api/paymongo/webhook/route.ts
git commit -m "fix(api): harden PayMongo webhook — size guard, error logging"
```

---

### Task 7: Add missing RLS for `inquiry_statuses` and `saved_searches`

**Files:**
- Create: `packages/db/supabase/migrations/20260415000000_inquiry_saved_rls.sql`

- [ ] **Step 1: Check if these tables have RLS**

```bash
grep -r "inquiry_statuses\|saved_searches" packages/db/supabase/migrations/ | grep "ENABLE ROW"
# Expected: no output — these tables are missing RLS
```

- [ ] **Step 2: Create the migration**

```bash
cat > packages/db/supabase/migrations/20260415000000_inquiry_saved_rls.sql << 'EOF'
-- ============================================================
-- RLS for inquiry_statuses and saved_searches
-- ============================================================

-- inquiry_statuses: finders and listers can see their own rows
ALTER TABLE public.inquiry_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inquiry_statuses: finder can view own"
  ON public.inquiry_statuses FOR SELECT
  USING (finder_id = auth.uid() OR lister_id = auth.uid() OR public.is_admin());

CREATE POLICY "inquiry_statuses: lister can update own"
  ON public.inquiry_statuses FOR UPDATE
  USING (lister_id = auth.uid() OR public.is_admin());

CREATE POLICY "inquiry_statuses: system can insert"
  ON public.inquiry_statuses FOR INSERT
  WITH CHECK (finder_id = auth.uid() OR public.is_admin());

-- saved_searches: finder owns their own rows
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_searches: finder can manage own"
  ON public.saved_searches FOR ALL
  USING (finder_id = auth.uid())
  WITH CHECK (finder_id = auth.uid());
EOF
```

- [ ] **Step 3: Apply migration to Supabase**

```bash
pnpm supabase db push
# Or via Supabase CLI: supabase migration up
```

- [ ] **Step 4: Commit**

```bash
git add packages/db/supabase/migrations/20260415000000_inquiry_saved_rls.sql
git commit -m "fix(db): add RLS policies for inquiry_statuses and saved_searches"
```

---

## Phase 4 — CI/CD

### Task 8: GitHub Actions — CI (lint + typecheck on every PR)

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create CI workflow**

```bash
mkdir -p .github/workflows
cat > .github/workflows/ci.yml << 'EOF'
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    name: Lint & Types
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Biome lint + format check
        run: pnpm check

      - name: TypeScript type check
        run: pnpm check-types
EOF
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add lint and typecheck workflow"
```

- [ ] **Step 3: Push and verify the workflow runs green**

```bash
git push origin main
# Go to GitHub → Actions tab → confirm CI passes
```

---

### Task 9: GitHub Actions — Deploy web to Cloudflare on main

**Files:**
- Create: `.github/workflows/deploy-web.yml`

- [ ] **Step 1: Add Cloudflare secrets to GitHub**

In GitHub repo → Settings → Secrets and variables → Actions, add:
- `CLOUDFLARE_API_TOKEN` — from Cloudflare dashboard → API tokens → create token with Workers + Pages write
- `CLOUDFLARE_ACCOUNT_ID` — from Cloudflare dashboard sidebar

Also add all server env vars as secrets:
- `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`, `PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET`
- `CORS_ORIGIN` (your production domain)

- [ ] **Step 2: Create deploy workflow**

```bash
cat > .github/workflows/deploy-web.yml << 'EOF'
name: Deploy Web

on:
  push:
    branches: [main]

jobs:
  deploy:
    name: Deploy to Cloudflare
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Deploy web
        run: pnpm --filter web deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          PAYMONGO_SECRET_KEY: ${{ secrets.PAYMONGO_SECRET_KEY }}
          PAYMONGO_WEBHOOK_SECRET: ${{ secrets.PAYMONGO_WEBHOOK_SECRET }}
          CORS_ORIGIN: ${{ secrets.CORS_ORIGIN }}
          NODE_ENV: production
EOF
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy-web.yml
git commit -m "ci: add Cloudflare deploy workflow on main push"
```

---

## Phase 5 — App Store Preparation

### Task 10: App store assets and policy URLs

**Files:**
- Create: `apps/native/assets/store/` (screenshots, descriptions)
- Modify: `apps/native/app/(finder-tabs)/profile.tsx` — link privacy policy
- Modify: `apps/native/components/screens/shared/profile-screen.tsx` — link terms + privacy

- [ ] **Step 1: Add privacy policy and terms URLs to profile screen**

In `apps/native/components/screens/shared/profile-screen.tsx`, the Help/Support section already has empty `onPress={() => {}}` for Terms and Privacy. Replace with real URLs:

```tsx
// Replace the two empty onPress handlers:
<ProfileRow
  icon="document-text-outline"
  label="Terms of service"
  onPress={() => Linking.openURL("https://wheresmydorm.com/terms")}
/>
<ProfileRow
  icon="shield-checkmark-outline"
  label="Privacy policy"
  last
  onPress={() => Linking.openURL("https://wheresmydorm.com/privacy")}
/>
```

Also add the `Linking` import:
```ts
import { Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
```

- [ ] **Step 2: Create store asset directory**

```bash
mkdir -p apps/native/assets/store
# Add screenshots (1290×2796 for iPhone 14 Pro Max, 1284×2778 for iPhone 13 Pro)
# Add feature graphic (1024×500 for Google Play)
# These are manual — placeholder README:
cat > apps/native/assets/store/README.md << 'EOF'
# App Store Assets

## iOS (App Store Connect)
- Screenshots: 1290×2796px (iPhone 6.7")
- App icon: 1024×1024px (no alpha, no rounded corners)

## Android (Google Play)
- Screenshots: 1080×1920px minimum
- Feature graphic: 1024×500px

## Short description (80 chars max)
Find student housing near USLS-Bacolod fast.

## Full description
wheresmydorm helps USLS-Bacolod students find dorms, bedspaces, and apartments near campus. Browse listings on the map, save favorites, message listers directly, and get notified when new places open up.
EOF
```

- [ ] **Step 3: Commit**

```bash
git add apps/native/components/screens/shared/profile-screen.tsx apps/native/assets/store/
git commit -m "chore(native): add policy URLs and store asset directory"
```

---

## Phase 6 — First EAS Build

### Task 11: Build and submit to TestFlight / Play Internal Track

- [ ] **Step 1: Build iOS preview (internal)**

```bash
cd apps/native
pnpm dlx eas-cli build --platform ios --profile preview
# EAS will prompt for Apple credentials on first run
# Build takes ~15 minutes — link is emailed when done
```

- [ ] **Step 2: Build Android preview**

```bash
pnpm dlx eas-cli build --platform android --profile preview
# Outputs .apk for internal testing
```

- [ ] **Step 3: Test the preview build**

Install on a real device. Verify:
- [ ] Auth flow works (email OTP, Google OAuth)
- [ ] Map loads with Google Maps key
- [ ] Search finds nearby listings
- [ ] Messaging works end-to-end
- [ ] Push notifications arrive (send test via Supabase → notifications table insert)
- [ ] PayMongo checkout flow (test mode, use `4343434343434343` card)

- [ ] **Step 4: Build production and submit**

```bash
# iOS — submits to TestFlight automatically
pnpm dlx eas-cli build --platform ios --profile production --auto-submit

# Android — submits to Play internal track
pnpm dlx eas-cli build --platform android --profile production --auto-submit
```

---

## Phase 7 — UI Redesign (Lister + Finder)

> Complete after Phase 6 preview build passes smoke tests. UI changes ship as OTA update after stores approve initial build.

### Task 12: Implement lister screen redesigns

**Files:**
- Modify: `apps/native/components/screens/lister/dashboard-screen.tsx`
- Modify: `apps/native/components/screens/lister/listings-screen.tsx`
- Modify: `apps/native/app/(lister-tabs)/inbox.tsx` + messages screens
- Modify: `apps/native/components/screens/lister/lister-feed-screen.tsx`
- Create: `apps/native/components/screens/lister/lister-profile-screen.tsx`
- Modify: `apps/native/app/(lister-tabs)/profile.tsx`

Approved design reference: `.superpowers/brainstorm/32214-1776150253/content/screen-dashboard.html`, `listings-compare.html` (Option A — compact row), `screens-inbox-feed-profile.html`.

Key design tokens:
- Background: `#fff` (cards), `#f7f7f7` (screen bg)
- Primary action: `#111827` (black pill buttons)
- Accent/CTA: `#ea580c` (brand orange — Boost, unread dots)
- Verified: `#0f766e` (teal badge)
- Card radius: `rounded-[16px]` or `border-radius: 16`
- Shadow: `boxShadow: "0 1px 6px rgba(0,0,0,0.06)"`

Each screen task: read approved mockup → implement with NativeWind → test in Expo Go → commit.

### Task 13: Implement finder screen redesigns

**Files:**
- Modify: `apps/native/components/screens/finder/discover-screen.tsx`
- Modify: `apps/native/components/screens/finder/saved-screen.tsx`
- Create: `apps/native/components/screens/finder/finder-profile-screen.tsx`
- Modify: `apps/native/app/(finder-tabs)/profile.tsx`

Approved design reference: `.superpowers/brainstorm/32214-1776150253/content/finder-screens.html`.

Key finder-specific tokens:
- Pro upgrade banner: `bg-gradient #0B2D23 → #0f766e` (dark teal)
- Free plan badge: `bg-[#f0f0f0]` gray pill
- Same card language as lister for consistency

---

## Ship Checklist (Manual — Do Before Submitting to Stores)

- [ ] Real domain deployed to Cloudflare (not `*.pages.dev`)
- [ ] PayMongo production keys swapped in (not sandbox)
- [ ] PayMongo webhook URL updated to production domain in PayMongo dashboard
- [ ] Supabase Auth → Redirect URLs includes your production scheme (`wheresmydorm://`)
- [ ] Google OAuth redirect URIs updated in Google Cloud Console
- [ ] App Store Connect: fill in app description, keywords, age rating, support URL
- [ ] Google Play Console: fill in store listing, content rating questionnaire
- [ ] Privacy policy live at `https://wheresmydorm.com/privacy`
- [ ] Terms of service live at `https://wheresmydorm.com/terms`
- [ ] Firebase project linked to production Supabase project (for FCM)
- [ ] `EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY` set to `pk_live_` (not `pk_test_`) in EAS secrets
- [ ] Run `pnpm check-types` and `pnpm check` — zero errors
