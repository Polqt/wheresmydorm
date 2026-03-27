-- =============================================================================
-- Role-specific onboarding profile fields
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS finder_property_types text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS lister_property_count integer;
