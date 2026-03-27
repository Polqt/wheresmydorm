-- =============================================================================
-- Finder daily quota + unlimited free lister listings
-- =============================================================================

ALTER TYPE public.search_event_type ADD VALUE IF NOT EXISTS 'find_nearby';
ALTER TYPE public.payment_type ADD VALUE IF NOT EXISTS 'listing_boost';

ALTER TABLE public.search_events
  ADD COLUMN IF NOT EXISTS center_lat double precision,
  ADD COLUMN IF NOT EXISTS center_lng double precision,
  ADD COLUMN IF NOT EXISTS radius_meters integer;

CREATE INDEX IF NOT EXISTS search_events_quota_idx
  ON public.search_events(user_id, event_type, created_at DESC);

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS free_searches_remaining,
  DROP COLUMN IF EXISTS free_listings_remaining;

CREATE OR REPLACE FUNCTION public.get_finder_find_quota(p_user_id uuid)
RETURNS TABLE (
  allowed boolean,
  remaining_finds integer,
  used_today integer,
  daily_limit integer,
  is_paid boolean
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_used_today integer := 0;
  v_daily_limit integer := 5;
  v_remaining integer := 0;
BEGIN
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 0, v_daily_limit, false;
    RETURN;
  END IF;

  IF v_profile.role IS DISTINCT FROM 'finder' AND v_profile.role IS DISTINCT FROM 'admin' THEN
    RETURN QUERY SELECT false, 0, 0, v_daily_limit, v_profile.is_paid_finder;
    RETURN;
  END IF;

  IF v_profile.is_paid_finder THEN
    RETURN QUERY SELECT true, -1, 0, v_daily_limit, true;
    RETURN;
  END IF;

  SELECT COUNT(*)
  INTO v_used_today
  FROM public.search_events
  WHERE user_id = p_user_id
    AND event_type = 'find_nearby'
    AND (created_at AT TIME ZONE 'Asia/Manila')::date = (now() AT TIME ZONE 'Asia/Manila')::date;

  v_remaining := GREATEST(v_daily_limit - v_used_today, 0);

  RETURN QUERY SELECT v_remaining > 0, v_remaining, v_used_today, v_daily_limit, false;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_finder_find(
  p_user_id uuid,
  p_center_lat double precision,
  p_center_lng double precision,
  p_radius_meters integer
)
RETURNS TABLE (
  allowed boolean,
  remaining_finds integer,
  used_today integer,
  daily_limit integer,
  is_paid boolean
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quota record;
BEGIN
  SELECT * INTO v_quota
  FROM public.get_finder_find_quota(p_user_id);

  IF NOT COALESCE(v_quota.allowed, false) THEN
    RETURN QUERY SELECT false, COALESCE(v_quota.remaining_finds, 0), COALESCE(v_quota.used_today, 0), COALESCE(v_quota.daily_limit, 5), COALESCE(v_quota.is_paid, false);
    RETURN;
  END IF;

  IF v_quota.is_paid THEN
    INSERT INTO public.search_events (
      user_id,
      event_type,
      center_lat,
      center_lng,
      radius_meters,
      searches_remaining_after
    )
    VALUES (
      p_user_id,
      'find_nearby',
      p_center_lat,
      p_center_lng,
      p_radius_meters,
      NULL
    );

    RETURN QUERY SELECT true, -1, 0, COALESCE(v_quota.daily_limit, 5), true;
    RETURN;
  END IF;

  INSERT INTO public.search_events (
    user_id,
    event_type,
    center_lat,
    center_lng,
    radius_meters,
    searches_remaining_after
  )
  VALUES (
    p_user_id,
    'find_nearby',
    p_center_lat,
    p_center_lng,
    p_radius_meters,
    GREATEST(COALESCE(v_quota.remaining_finds, 0) - 1, 0)
  );

  RETURN QUERY
  SELECT
    true,
    GREATEST(COALESCE(v_quota.remaining_finds, 0) - 1, 0),
    COALESCE(v_quota.used_today, 0) + 1,
    COALESCE(v_quota.daily_limit, 5),
    false;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_search_quota(
  p_user_id uuid,
  p_listing_id uuid,
  p_event_type search_event_type
)
RETURNS TABLE (
  allowed boolean,
  searches_remaining integer,
  is_paid boolean
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quota record;
BEGIN
  SELECT * INTO v_quota
  FROM public.get_finder_find_quota(p_user_id);

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, false;
    RETURN;
  END IF;

  INSERT INTO public.search_events (
    user_id,
    listing_id,
    event_type,
    searches_remaining_after
  )
  VALUES (
    p_user_id,
    p_listing_id,
    p_event_type,
    CASE
      WHEN v_quota.is_paid THEN NULL
      ELSE v_quota.remaining_finds
    END
  );

  RETURN QUERY
  SELECT true, COALESCE(v_quota.remaining_finds, 0), COALESCE(v_quota.is_paid, false);
END;
$$;
