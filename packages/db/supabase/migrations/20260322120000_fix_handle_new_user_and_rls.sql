-- =============================================================================
-- Fix handle_new_user trigger and add missing RLS policies for profiles.
--
-- Problems addressed:
-- 1. role column may still have NOT NULL if prior migration failed partially.
-- 2. RLS policies file (20260317153430) is empty — adding them here.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Ensure role is nullable (idempotent — safe to run even if already done)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ALTER COLUMN role DROP NOT NULL;

ALTER TABLE public.profiles
  ALTER COLUMN role DROP DEFAULT;

-- ---------------------------------------------------------------------------
-- 2. Re-create handle_new_user cleanly to guarantee the correct version
--    is live regardless of prior migration state.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_name text;
BEGIN
  resolved_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    avatar_url,
    role
  ) VALUES (
    NEW.id,
    COALESCE(NULLIF(split_part(trim(resolved_name), ' ', 1), ''), 'Member'),
    NULLIF(trim(regexp_replace(trim(resolved_name), '^\S+\s*', '')), ''),
    NEW.raw_user_meta_data->>'avatar_url',
    NULL  -- role is selected by the user during onboarding
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Recreate the trigger in case it was dropped or is missing
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 3. RLS — enable and define policies for public.profiles
--    (the original rls_policies.sql was empty)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
DROP POLICY IF EXISTS "profiles: select own" ON public.profiles;
CREATE POLICY "profiles: select own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "profiles: update own" ON public.profiles;
CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Profile creation is handled exclusively by the handle_new_user trigger
-- (SECURITY DEFINER bypasses RLS), so no INSERT policy needed for users.

-- Admins can read all profiles (uses get_user_role() helper)
DROP POLICY IF EXISTS "profiles: admin select all" ON public.profiles;
CREATE POLICY "profiles: admin select all"
  ON public.profiles FOR SELECT
  USING (public.get_user_role() = 'admin');
