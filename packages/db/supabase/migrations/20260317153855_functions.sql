-- =============================================================================
-- 0003_functions.sql
-- All helper functions and triggers
-- =============================================================================

-- ---------------------------------------------------------------------------
-- HELPER: get the role of the currently authenticated user
-- Used inside RLS policies — avoids repeated subqueries.
-- SECURITY DEFINER so it can read profiles even under restrictive RLS.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- HELPER: check if the current user is an admin
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- TRIGGER FUNCTION: auto-update updated_at on every row change
-- Attach to any table that has an updated_at column.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Attach to all tables with updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_listings
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_reviews
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_posts
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_post_comments
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_payments
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- TRIGGER FUNCTION: auto-create a profile row when a new Supabase auth user
-- signs up via Google OAuth. Pulls display_name and avatar_url from
-- raw_user_meta_data populated by the OAuth provider.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    display_name,
    avatar_url,
    role
  ) VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    'finder'  -- default role; user selects Finder/Lister on first login
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- TRIGGER FUNCTION: recalculate aggregate ratings on listings after every
-- INSERT, UPDATE, or DELETE on reviews.
-- Keeps listing.rating_* columns in sync without N+1 queries at read time.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_listing_aggregate_rating()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_listing_id uuid;
BEGIN
  -- For DELETE, use OLD; for INSERT/UPDATE, use NEW
  IF TG_OP = 'DELETE' THEN
    target_listing_id := OLD.listing_id;
  ELSE
    target_listing_id := NEW.listing_id;
  END IF;

  UPDATE public.listings
  SET
    rating_overall     = agg.avg_overall,
    rating_value       = agg.avg_value,
    rating_safety      = agg.avg_safety,
    rating_cleanliness = agg.avg_cleanliness,
    rating_location    = agg.avg_location,
    rating_landlord    = agg.avg_landlord,
    review_count       = agg.cnt,
    updated_at         = now()
  FROM (
    SELECT
      AVG(rating_overall)     AS avg_overall,
      AVG(rating_value)       AS avg_value,
      AVG(rating_safety)      AS avg_safety,
      AVG(rating_cleanliness) AS avg_cleanliness,
      AVG(rating_location)    AS avg_location,
      AVG(rating_landlord)    AS avg_landlord,
      COUNT(*)                AS cnt
    FROM public.reviews
    WHERE listing_id = target_listing_id
  ) agg
  WHERE id = target_listing_id;

  RETURN NULL;
END;
$$;

CREATE TRIGGER sync_listing_rating_on_insert
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_listing_aggregate_rating();

CREATE TRIGGER sync_listing_rating_on_update
  AFTER UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_listing_aggregate_rating();

CREATE TRIGGER sync_listing_rating_on_delete
  AFTER DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_listing_aggregate_rating();

-- ---------------------------------------------------------------------------
-- TRIGGER FUNCTION: keep listing.bookmark_count in sync with saved_listings
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_bookmark_count()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.listings
    SET bookmark_count = bookmark_count + 1
    WHERE id = NEW.listing_id;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.listings
    SET bookmark_count = GREATEST(bookmark_count - 1, 0)
    WHERE id = OLD.listing_id;
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER sync_bookmark_count_on_save
  AFTER INSERT ON public.saved_listings
  FOR EACH ROW EXECUTE FUNCTION public.sync_bookmark_count();

CREATE TRIGGER sync_bookmark_count_on_unsave
  AFTER DELETE ON public.saved_listings
  FOR EACH ROW EXECUTE FUNCTION public.sync_bookmark_count();

-- ---------------------------------------------------------------------------
-- TRIGGER FUNCTION: keep review.helpful_count in sync with review_helpful_votes
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_helpful_count()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reviews
    SET helpful_count = helpful_count + 1
    WHERE id = NEW.review_id;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.reviews
    SET helpful_count = GREATEST(helpful_count - 1, 0)
    WHERE id = OLD.review_id;
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER sync_helpful_count_on_vote
  AFTER INSERT ON public.review_helpful_votes
  FOR EACH ROW EXECUTE FUNCTION public.sync_helpful_count();

CREATE TRIGGER sync_helpful_count_on_unvote
  AFTER DELETE ON public.review_helpful_votes
  FOR EACH ROW EXECUTE FUNCTION public.sync_helpful_count();

-- ---------------------------------------------------------------------------
-- TRIGGER FUNCTION: keep post.comment_count in sync with post_comments
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_post_comment_count()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET comment_count = GREATEST(comment_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER sync_comment_count_on_insert
  AFTER INSERT ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_comment_count();

CREATE TRIGGER sync_comment_count_on_delete
  AFTER DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_comment_count();

-- ---------------------------------------------------------------------------
-- TRIGGER FUNCTION: keep post.like_count in sync with post_reactions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_post_reaction_count()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET like_count = like_count + 1
    WHERE id = NEW.post_id;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER sync_reaction_count_on_insert
  AFTER INSERT ON public.post_reactions
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_reaction_count();

CREATE TRIGGER sync_reaction_count_on_delete
  AFTER DELETE ON public.post_reactions
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_reaction_count();

-- ---------------------------------------------------------------------------
-- FUNCTION: consume_search_quota
-- Called by the tRPC listing_view and ai_chat procedures.
-- Atomically decrements free_searches_remaining and logs the search event.
-- Returns the remaining count after the decrement (or -1 if already paid).
--
-- Usage from API:
--   SELECT * FROM consume_search_quota(auth.uid(), <listing_id>, 'listing_view');
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.consume_search_quota(
  p_user_id    uuid,
  p_listing_id uuid,
  p_event_type search_event_type
)
RETURNS TABLE (
  allowed                  boolean,
  searches_remaining       integer,
  is_paid                  boolean
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile         public.profiles%ROWTYPE;
  v_remaining       integer;
BEGIN
  -- Lock the profile row for update to prevent race conditions
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, false;
    RETURN;
  END IF;

  -- Paid finders have unlimited access — log event but don't decrement
  IF v_profile.is_paid_finder THEN
    INSERT INTO public.search_events (user_id, listing_id, event_type, searches_remaining_after)
    VALUES (p_user_id, p_listing_id, p_event_type, NULL);

    RETURN QUERY SELECT true, -1, true;
    RETURN;
  END IF;

  -- Free tier: check quota
  IF v_profile.free_searches_remaining <= 0 THEN
    RETURN QUERY SELECT false, 0, false;
    RETURN;
  END IF;

  -- Decrement quota
  v_remaining := v_profile.free_searches_remaining - 1;

  UPDATE public.profiles
  SET free_searches_remaining = v_remaining
  WHERE id = p_user_id;

  INSERT INTO public.search_events (user_id, listing_id, event_type, searches_remaining_after)
  VALUES (p_user_id, p_listing_id, p_event_type, v_remaining);

  RETURN QUERY SELECT true, v_remaining, false;
END;
$$;

-- ---------------------------------------------------------------------------
-- FUNCTION: check_review_eligibility
-- Returns true if the given finder has a verified search_event (listing_view)
-- for the given listing — gating review creation per PRD §5.3.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_review_eligibility(
  p_finder_id  uuid,
  p_listing_id uuid
)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.search_events
    WHERE user_id    = p_finder_id
      AND listing_id = p_listing_id
      AND event_type = 'listing_view'
  );
$$;

-- ---------------------------------------------------------------------------
-- FUNCTION: auto-pause listings that have passed their expires_at date.
-- Intended to be called by pg_cron daily:
--   SELECT cron.schedule('0 2 * * *', 'SELECT public.expire_stale_listings()');
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_stale_listings()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.listings
  SET status     = 'paused',
      updated_at = now()
  WHERE status     = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ---------------------------------------------------------------------------
-- FUNCTION: full-text search on listings
-- Returns listings matching a query string, ranked by relevance.
-- Used by the Search & Discovery tab (PRD §5.9).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_listings(
  p_query  text,
  p_city   text    DEFAULT NULL,
  p_limit  integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS SETOF public.listings
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.*
  FROM public.listings l
  WHERE
    l.status = 'active'
    AND (p_city IS NULL OR l.city = p_city)
    AND to_tsvector('english',
          coalesce(l.title,'') || ' ' ||
          coalesce(l.description,'') || ' ' ||
          coalesce(l.address,'') || ' ' ||
          coalesce(l.barangay,'')
        ) @@ plainto_tsquery('english', p_query)
  ORDER BY
    ts_rank(
      to_tsvector('english', coalesce(l.title,'') || ' ' || coalesce(l.description,'')),
      plainto_tsquery('english', p_query)
    ) DESC,
    l.rating_overall DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
$$;