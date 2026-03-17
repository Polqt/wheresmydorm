-- ---------------------------------------------------------------------------
-- profiles
-- Mirrors auth.users — id must match auth.uid() exactly.
-- Row is auto-created by handle_new_user() trigger (defined in 0003_functions.sql).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id                       uuid        PRIMARY KEY,  -- same as auth.users.id
  display_name             text        NOT NULL,
  avatar_url               text,
  bio                      text,
  role                     user_role   NOT NULL DEFAULT 'finder',
 
  -- Monetization state
  is_paid_finder           boolean     NOT NULL DEFAULT false,
  free_searches_remaining  integer     NOT NULL DEFAULT 5,
  free_listings_remaining  integer     NOT NULL DEFAULT 2,
  is_verified_member       boolean     NOT NULL DEFAULT false,
 
  -- Contact preferences (user-controlled visibility)
  contact_email            text,
  contact_phone            text,
  contact_viber            text,
  contact_messenger        text,
 
  -- Push notifications
  fcm_token                text,
 
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);