-- ---------------------------------------------------------------------------
-- Add role-specific profile fields for finders and listers.
--
-- bio            — shared short biography shown on public profile
-- preferred_area — finder: what city/area they're searching in
-- property_types — lister: what property types they manage (text array)
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio            text,
  ADD COLUMN IF NOT EXISTS preferred_area text,
  ADD COLUMN IF NOT EXISTS property_types text[] NOT NULL DEFAULT '{}';
