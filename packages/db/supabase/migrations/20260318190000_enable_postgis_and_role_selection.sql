-- =============================================================================
-- Enable PostGIS for radius queries and allow deferred role selection.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE public.profiles
  ALTER COLUMN role DROP NOT NULL,
  ALTER COLUMN role DROP DEFAULT;

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
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
