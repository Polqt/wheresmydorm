# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**wheresmydorm** is a student housing marketplace monorepo with two frontends (Next.js web marketing site + Expo React Native mobile app) and a shared tRPC backend. Users are either **finders** (apartment seekers) or **listers** (property owners).

- **Package manager**: pnpm (workspaces)
- **Build system**: Turborepo

## Common Commands

```bash
pnpm dev              # Start all dev servers
pnpm dev:web          # Start only the Next.js web app
pnpm dev:native       # Start only the Expo native app
pnpm build            # Build all packages
pnpm check-types      # TypeScript type checking across all packages
pnpm check            # Run Biome linter/formatter check
pnpm test             # Run all tests

# Database
pnpm db:push          # Push Drizzle schema changes to DB
pnpm db:generate      # Generate Drizzle migration files
pnpm db:migrate       # Run Drizzle migrations
pnpm db:studio        # Open Drizzle Studio UI

# Web deployment (Cloudflare via Alchemy)
pnpm --filter web deploy
pnpm --filter web destroy
```

## Project Structure

```
apps/
  web/          # Next.js marketing site + tRPC API host
  native/       # Expo Router React Native app

packages/
  api/          # tRPC routers and business logic
  db/           # Drizzle ORM schema + Supabase migrations
  env/          # Environment variable validation (server/web/native)
  config/       # Shared TypeScript config
  infra/        # Cloudflare/Alchemy deployment config
```

## Architecture

### API Layer (`packages/api`)

tRPC with a Supabase-backed context. Authentication is handled by extracting sessions from:
- **Web**: Supabase SSR cookies
- **Native**: Bearer token in Authorization header

The `protectedProcedure` middleware throws `UNAUTHORIZED` if no session is present.

Routers: `profiles`, `listings`, `messages`, `posts`

Key non-obvious router behaviors:
- `listings.getById` increments `viewCount` only if the caller is not the owner
- `messages.send` checks for user blocks and increments `inquiryCount` on the listing for the first message in a thread
- `posts.list` is follow-gated (see Key Domain Concepts below)
- `profiles.sync` must be called after OAuth login to pull `firstName`/`lastName`/`avatarUrl` from Supabase auth into the profile row

**Important**: The native app's `services/profile.ts` calls Supabase directly (bypassing tRPC) for all profile CRUD — reading/writing the `profiles` table with camelCase ↔ snake_case mapping done in the service itself. tRPC's `profiles` router is only used for social actions (sync, setRole, follow/unfollow). Don't add profile reads/writes to the tRPC router for native.

The tRPC handler is hosted at `apps/web/src/app/api/trpc/[trpc]/route.ts` — the web app serves the API for both itself and the native app.

### Database (`packages/db`)

Two separate migration tracks:
1. **Drizzle** (`packages/db/src/schema/`) — TypeScript schema definition, pushed with `pnpm db:push`
2. **Supabase** (`packages/db/supabase/`) — SQL migrations for auth triggers, RLS policies, SQL functions, PostGIS extension, storage buckets — pushed separately via Supabase CLI

Key schema notes:
- Listing coordinates stored as `lat`/`lng` `REAL` columns (not PostGIS geometry)
- Counts (`viewCount`, `bookmarkCount`, `likeCount`, `commentCount`) are denormalized into tables
- Soft deletes: messages use `isDeleted`, posts use `isRemoved`
- Currently only `profiles` has RLS enabled; other tables rely on tRPC-layer auth
- `handle_new_user()` SQL trigger auto-creates a profile row on Supabase auth signup

### Native App (`apps/native`)

Uses **Expo Router** for file-based navigation. The `AuthProvider` (`providers/auth-provider.tsx`) drives routing:

- No session → `auth/sign-in`
- Incomplete setup → auth flow screens (role-select, profile-setup, avatar-setup, etc.)
- `finder` role → `(finder-tabs)` group
- `lister` role → `(lister-tabs)` group

**Role-based tab groups:**
- `(finder-tabs)/`: discover, feed, map, saved, profile
- `(lister-tabs)/`: dashboard, listings, inbox, feed, profile

Zustand stores (`stores/`) manage UI state: discovery filters, map state, onboarding progress, auth flow state. Discovery stores persist to **MMKV** (not AsyncStorage).

A **service layer** (`services/`) sits between components and tRPC — services contain the actual query/mutation calls; hooks in `hooks/` compose services with React Query. Don't call tRPC directly from components.

The **tRPC client** (`utils/api-client.ts`) uses `httpBatchLink` and auto-injects the Supabase session Bearer token. In dev it resolves the server URL dynamically from Expo's debug host (with special-casing for Android emulator at `10.0.2.2`). Requests timeout at 20 seconds.

The `AuthProvider` blocks navigation until all setup steps complete in sequence: role-select → profile-setup → avatar-setup → contact-info → role-preferences → permissions. The `isAwaitingRoleSync` flag in the auth store prevents the role-select screen from showing again mid-setup.

**Navigation**: All route paths are defined as typed helper functions in `utils/routes.ts` (e.g. `finderHomeRoute()` → `/(finder-tabs)/map`, `listerHomeRoute()` → `/(lister-tabs)/dashboard`). Use these helpers instead of hardcoded path strings.

**Styling**: Uses **NativeWind** (Tailwind CSS for React Native). Brand colors are defined in `tailwind.config.js` under `brand.primary` (indigo scale), `brand.orange`, `brand.teal`, `brand.slate`, `brand.sand`. Dark/light theme tokens live in `lib/constants.ts` as `NAV_THEME`.

**Key UI libraries**: `@gorhom/bottom-sheet` for bottom sheets, `@shopify/flash-list` for virtualized lists (prefer over `FlatList`), `@tanstack/react-form` for form management.

**MMKV storage**: `lib/mmkv.ts` exports `asyncStorageAdapter` which wraps `react-native-mmkv` with a file-based fallback (used in Expo Go when the native module isn't compiled in). Always use `asyncStorageAdapter` rather than importing MMKV directly.

### Key Domain Concepts

**Finder quota system**: Free finders get 3 `findNearby` searches/day; paid finders (`isPaidFinder = true`) get unlimited. Calculated by `get_finder_find_quota()` SQL function, enforced in `packages/api/src/lib/finder-search.ts`.

**Message thread encoding**: Thread IDs are `{listingId}__{userId}` — the listing context plus the other participant.

**User roles** (`user_role` enum): `finder`, `lister`, `admin`

**Payment types** (Paymongo): `finder_upgrade`, `boost`

**Property types** (`property_type` enum): `dorm`, `apartment`, `bedspace`, `condo`, `boarding_house`, `studio`

**Listing status** (`listing_status` enum): `active`, `paused`, `archived`

**Post reactions** (`reaction_type` enum): `like`, `helpful`, `funny` — a user can only hold one reaction per post (toggle or switch type)

**Social feed**: `posts.list` only returns posts from users the caller follows plus their own posts — it is not a global timeline.

**Advanced filter paywall**: `findNearby` accepts price/amenity/property-type/rating filters but silently ignores them for free finders. Amenity filtering in `listings.list` is done **in-memory after the DB query** (not in SQL).

**Pagination**: listings use limit/offset; posts use a datetime cursor (`createdAt` of the last item). Always use cursor for posts to avoid missed/duplicate items on insert.

### Web App (`apps/web`)

Currently a marketing site with no authenticated user-facing pages. Hosts the tRPC API endpoint. Deployed to Cloudflare Workers via OpenNext/Alchemy (`packages/infra/`).

Routes: `/` (home), `/product`, `/pricing`, `/community`, plus `/api/trpc`

### Environment Variables

Validated via `packages/env/src/` — separate schemas for `server`, `web`, and `native`. Add new env vars there, not just to `.env`.

## Linting & Formatting

Uses **Biome** (`biome.json` at root) for both linting and formatting — not ESLint/Prettier. Run `pnpm check` to verify.

## Testing

- **E2E**: Playwright targeting `apps/web/e2e/`, base URL `http://localhost:3001`
- **Unit**: Vitest (configured per-package)
