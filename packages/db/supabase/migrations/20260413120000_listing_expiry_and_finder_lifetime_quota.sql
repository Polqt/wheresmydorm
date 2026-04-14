-- =============================================================================
-- Listing expiry (auto-pause after 90 days) + finder lifetime search quota
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Listing expiry
--    Set expiresAt = createdAt + 90 days on insert (if not already set).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_listing_expires_at()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NEW.created_at + INTERVAL '90 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_listing_set_expires_at ON public.listings;
CREATE TRIGGER trg_listing_set_expires_at
  BEFORE INSERT ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_listing_expires_at();

-- ---------------------------------------------------------------------------
-- 2. Auto-pause expired listings
--    Runs as a scheduled job (pg_cron) or called by an edge function.
--    Returns count of listings paused so callers can log it.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.expire_listings()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  WITH expired AS (
    UPDATE public.listings
    SET status = 'paused'
    WHERE status = 'active'
      AND expires_at IS NOT NULL
      AND expires_at <= now()
    RETURNING id, lister_id, title
  ),
  notified AS (
    INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type)
    SELECT
      lister_id,
      'listing_update',
      'Listing expired',
      'Your listing "' || title || '" has been paused because it reached its 90-day limit. Renew it to make it active again.',
      id::text,
      'listing'
    FROM expired
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_count FROM expired;

  RETURN v_count;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Finder search quota: switch from per-day to LIFETIME (5 free total)
--    PRD 6.1: free finders get 5 lifetime nearby searches.
--    Paid finders (is_paid_finder = true) get unlimited.
--    We keep the same function signatures so tRPC code needs no changes.
-- ---------------------------------------------------------------------------

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
  v_profile        public.profiles%ROWTYPE;
  v_used_lifetime  integer := 0;
  v_lifetime_limit integer := 5;
  v_remaining      integer := 0;
BEGIN
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 0, v_lifetime_limit, false;
    RETURN;
  END IF;

  IF v_profile.role IS DISTINCT FROM 'finder' AND v_profile.role IS DISTINCT FROM 'admin' THEN
    RETURN QUERY SELECT false, 0, 0, v_lifetime_limit, v_profile.is_paid_finder;
    RETURN;
  END IF;

  IF v_profile.is_paid_finder THEN
    -- Unlimited — return sentinel values (remaining = -1 means unlimited)
    RETURN QUERY SELECT true, -1, 0, v_lifetime_limit, true;
    RETURN;
  END IF;

  -- Count ALL find_nearby events ever recorded for this user (lifetime total)
  SELECT COUNT(*)
  INTO v_used_lifetime
  FROM public.search_events
  WHERE user_id = p_user_id
    AND event_type = 'find_nearby';

  v_remaining := GREATEST(v_lifetime_limit - v_used_lifetime, 0);

  -- used_today column reused to carry lifetime used count for client display
  RETURN QUERY SELECT v_remaining > 0, v_remaining, v_used_lifetime, v_lifetime_limit, false;
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
    RETURN QUERY SELECT
      false,
      COALESCE(v_quota.remaining_finds, 0),
      COALESCE(v_quota.used_today, 0),
      COALESCE(v_quota.daily_limit, 5),
      COALESCE(v_quota.is_paid, false);
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
    CASE
      WHEN v_quota.is_paid THEN NULL
      ELSE GREATEST(COALESCE(v_quota.remaining_finds, 0) - 1, 0)
    END
  );

  IF v_quota.is_paid THEN
    RETURN QUERY SELECT true, -1, 0, COALESCE(v_quota.daily_limit, 5), true;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    true,
    GREATEST(COALESCE(v_quota.remaining_finds, 0) - 1, 0),
    COALESCE(v_quota.used_today, 0) + 1,
    COALESCE(v_quota.daily_limit, 5),
    false;
END;
$$;
