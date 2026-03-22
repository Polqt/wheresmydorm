# Supabase Development Guide

This project uses both Drizzle and Supabase, and they serve different jobs:

- Drizzle is the TypeScript schema/query layer used by the app code in `packages/db/src`.
- Supabase SQL migrations in `packages/db/supabase/migrations` handle hosted Postgres features such as auth triggers, RLS, extensions, and SQL functions.

Those two tracks are not the same thing in this repo.

## Current Repo Layout

- Drizzle schema: `packages/db/src/schema`
- Drizzle config: `packages/db/drizzle.config.ts`
- Supabase CLI config: `packages/db/supabase/config.toml`
- Supabase SQL migrations: `packages/db/supabase/migrations`
- Native Supabase client: `apps/native/utils/supabase.ts`
- API Supabase server context: `packages/api/src/context.ts`

## Important Difference: Drizzle vs Supabase Migrations

Root scripts such as `pnpm db:push` and `pnpm db:migrate` currently run Drizzle:

```bash
pnpm db:push
pnpm db:migrate
```

These commands use `packages/db/drizzle.config.ts` and connect directly to the database URL from env vars.

They do not apply the SQL files inside `packages/db/supabase/migrations`.

That means:

- `pnpm db:push` can update schema derived from Drizzle.
- It does not guarantee that Supabase auth triggers, RLS policies, SQL functions, or local Supabase config were applied.
- If you added or edited `packages/db/supabase/migrations/20260322120000_fix_handle_new_user_and_rls.sql`, you must run it through the Supabase migration flow against the correct project.

## Why `profiles` Can Still Show `UNRESTRICTED`

If the hosted Supabase dashboard still shows `public.profiles` as unrestricted, one of these is true:

- The migration was only present in the repo but never pushed to the hosted project.
- The SQL was run against local Supabase, not the hosted project.
- The SQL was run against a different Supabase project than the one your app is using.
- You used Drizzle commands only, which do not apply `packages/db/supabase/migrations`.

Also note:

- `20260322120000_fix_handle_new_user_and_rls.sql` only fixes `public.profiles`.
- Your screenshot shows many other tables marked unrestricted. That is expected unless you also create and apply RLS policies for those tables.
- `packages/db/supabase/migrations/20260317153430_rls_policies.sql` is currently empty, so there is not yet a global RLS pass for the rest of the schema.

## What `20260322120000_fix_handle_new_user_and_rls.sql` Does

That migration is meant to:

- make `profiles.role` nullable
- recreate `public.handle_new_user()`
- recreate the `on_auth_user_created` trigger
- enable RLS on `public.profiles`
- add policies for:
  - select own profile
  - update own profile
  - admin select all

If `profiles` still shows unrestricted after this migration, the migration did not land in the database you are looking at.

## Local Supabase Development

Run all Supabase CLI commands from `packages/db`, because that is where `supabase/config.toml` lives.

### Start local Supabase

```bash
cd packages/db
npx supabase start
```

Local ports from `packages/db/supabase/config.toml`:

- API: `http://127.0.0.1:54321`
- DB: `postgres://postgres:postgres@127.0.0.1:54322/postgres`
- Studio: `http://127.0.0.1:54323`
- Inbucket: `http://127.0.0.1:54324`

### Reset local database and replay migrations

```bash
cd packages/db
npx supabase db reset
```

Use this when:

- you changed files in `packages/db/supabase/migrations`
- local auth triggers or RLS policies seem out of sync
- you want a clean local rebuild of the Supabase-managed schema

### Stop local Supabase

```bash
cd packages/db
npx supabase stop
```

## Hosted Supabase Development

The linked project ref in `packages/db/supabase/.temp/project-ref` is currently:

```text
zxzpbipgydebthlwdaps
```

Link the local Supabase folder to that hosted project:

```bash
cd packages/db
npx supabase link --project-ref zxzpbipgydebthlwdaps
```

Push pending Supabase SQL migrations to the linked hosted project:

```bash
cd packages/db
npx supabase db push
```

Check migration status:

```bash
cd packages/db
npx supabase migration list
```

If you changed only one SQL migration file locally and the hosted dashboard is still stale, `npx supabase db push` is the step that matters, not `pnpm db:push`.

## Verifying RLS on `public.profiles`

In the hosted SQL editor, run:

```sql
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'profiles';
```

Then verify policies:

```sql
select
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'profiles';
```

Expected result after the fix migration:

- `rls_enabled = true`
- policies exist for own select, own update, and admin select all

## Environment Variables Used in This Repo

### Native app

Required by `packages/env/src/native.ts`:

- `EXPO_PUBLIC_SERVER_URL`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_KEY`
- `EXPO_PUBLIC_GOOGLE_MAPS_KEY` optional

### Server / API

Required by `packages/env/src/server.ts`:

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `PAYMONGO_SECRET_KEY`
- `PAYMONGO_WEBHOOK_SECRET`
- `CORS_ORIGIN`

### Drizzle migration connection

`packages/db/drizzle.config.ts` reads one of:

- `DATABASE_URL_MIGRATION`
- `DIRECT_URL`
- `DATABASE_URL`

Recommended in this repo:

- use a direct or pooler connection for Drizzle schema commands
- use Supabase CLI commands for `packages/db/supabase/migrations`

## Auth Configuration in `supabase/config.toml`

Current repo settings include:

- local project id: `db`
- local DB port: `54322`
- local Studio port: `54323`
- local API port: `54321`
- auth enabled
- email OTP enabled with `otp_length = 6`
- email confirmation disabled locally
- Google provider enabled through env vars
- additional redirect URL for native auth callback:
  - `mybetterapp://auth/callback`

If the native app callback changes, update:

- `packages/db/supabase/config.toml`
- Supabase dashboard redirect URLs for the hosted project
- any matching auth redirect code in the native app

## Recommended Development Workflow

When changing TypeScript schema only:

```bash
pnpm db:push
```

When changing Supabase SQL features such as triggers, functions, RLS, or auth behavior:

```bash
cd packages/db
npx supabase db push
```

When testing Supabase locally from scratch:

```bash
cd packages/db
npx supabase db reset
```

When debugging auth or RLS:

1. Confirm the app points to the Supabase project you think it points to.
2. Confirm the Supabase migration was pushed to that same project.
3. Verify RLS and policies with SQL, not just dashboard badges.
4. Clear app local storage if auth state still looks stale.

## Common Pitfalls in This Repo

- Running `pnpm db:push` and expecting Supabase SQL migrations to apply.
- Running a migration locally and then checking the hosted production dashboard.
- Editing `packages/db/supabase/migrations` without pushing through Supabase CLI.
- Assuming one RLS fix migration secures every table in `public`.
- Forgetting that native auth state also persists in app storage, not just in Supabase.
