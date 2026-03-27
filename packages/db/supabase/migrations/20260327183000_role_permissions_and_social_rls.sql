-- =============================================================================
-- Role permissions, role-specific onboarding fields, and realtime-safe RLS
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS finder_budget_min text,
  ADD COLUMN IF NOT EXISTS finder_budget_max text;

CREATE OR REPLACE FUNCTION public.can_view_listing(p_listing_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.listings
    WHERE id = p_listing_id
      AND (
        status = 'active'
        OR lister_id = auth.uid()
        OR public.is_admin()
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_listing(p_listing_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.listings
    WHERE id = p_listing_id
      AND (
        lister_id = auth.uid()
        OR public.is_admin()
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_message_listing(
  p_listing_id uuid,
  p_sender_id uuid,
  p_receiver_id uuid
)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.listings l
    JOIN public.profiles sender_profile ON sender_profile.id = p_sender_id
    JOIN public.profiles receiver_profile ON receiver_profile.id = p_receiver_id
    WHERE l.id = p_listing_id
      AND (
        public.is_admin()
        OR (
          l.lister_id = p_receiver_id
          AND sender_profile.role = 'finder'
          AND receiver_profile.role = 'lister'
        )
        OR (
          l.lister_id = p_sender_id
          AND sender_profile.role = 'lister'
          AND receiver_profile.role = 'finder'
        )
      )
  );
$$;

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "listings: select visible" ON public.listings;
CREATE POLICY "listings: select visible"
  ON public.listings FOR SELECT
  USING (public.can_view_listing(id));

DROP POLICY IF EXISTS "listings: insert own" ON public.listings;
CREATE POLICY "listings: insert own"
  ON public.listings FOR INSERT
  WITH CHECK (
    auth.uid() = lister_id
    AND public.get_user_role() IN ('lister', 'admin')
  );

DROP POLICY IF EXISTS "listings: update own" ON public.listings;
CREATE POLICY "listings: update own"
  ON public.listings FOR UPDATE
  USING (public.can_manage_listing(id))
  WITH CHECK (public.can_manage_listing(id));

DROP POLICY IF EXISTS "listing_photos: select visible" ON public.listing_photos;
CREATE POLICY "listing_photos: select visible"
  ON public.listing_photos FOR SELECT
  USING (public.can_view_listing(listing_id));

DROP POLICY IF EXISTS "listing_photos: manage own" ON public.listing_photos;
CREATE POLICY "listing_photos: manage own"
  ON public.listing_photos FOR ALL
  USING (public.can_manage_listing(listing_id))
  WITH CHECK (public.can_manage_listing(listing_id));

DROP POLICY IF EXISTS "reviews: select public" ON public.reviews;
CREATE POLICY "reviews: select public"
  ON public.reviews FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "reviews: finder insert own" ON public.reviews;
CREATE POLICY "reviews: finder insert own"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = finder_id
    AND public.get_user_role() IN ('finder', 'admin')
    AND public.check_review_eligibility(finder_id, listing_id)
  );

DROP POLICY IF EXISTS "reviews: owner or author update" ON public.reviews;
CREATE POLICY "reviews: owner or author update"
  ON public.reviews FOR UPDATE
  USING (
    finder_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.listings
      WHERE id = listing_id
        AND lister_id = auth.uid()
    )
  )
  WITH CHECK (
    finder_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.listings
      WHERE id = listing_id
        AND lister_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "review_helpful_votes: select public" ON public.review_helpful_votes;
CREATE POLICY "review_helpful_votes: select public"
  ON public.review_helpful_votes FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "review_helpful_votes: insert own" ON public.review_helpful_votes;
CREATE POLICY "review_helpful_votes: insert own"
  ON public.review_helpful_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "review_helpful_votes: delete own" ON public.review_helpful_votes;
CREATE POLICY "review_helpful_votes: delete own"
  ON public.review_helpful_votes FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "review_reports: select own or admin" ON public.review_reports;
CREATE POLICY "review_reports: select own or admin"
  ON public.review_reports FOR SELECT
  USING (reporter_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "review_reports: insert own" ON public.review_reports;
CREATE POLICY "review_reports: insert own"
  ON public.review_reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "posts: select active" ON public.posts;
CREATE POLICY "posts: select active"
  ON public.posts FOR SELECT
  USING (auth.role() = 'authenticated' AND is_removed = false);

DROP POLICY IF EXISTS "posts: insert own" ON public.posts;
CREATE POLICY "posts: insert own"
  ON public.posts FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND public.get_user_role() IN ('finder', 'lister', 'admin')
  );

DROP POLICY IF EXISTS "posts: update own or admin" ON public.posts;
CREATE POLICY "posts: update own or admin"
  ON public.posts FOR UPDATE
  USING (author_id = auth.uid() OR public.is_admin())
  WITH CHECK (author_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "post_comments: select active" ON public.post_comments;
CREATE POLICY "post_comments: select active"
  ON public.post_comments FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND is_removed = false
    AND EXISTS (
      SELECT 1
      FROM public.posts
      WHERE id = post_id
        AND is_removed = false
    )
  );

DROP POLICY IF EXISTS "post_comments: insert own" ON public.post_comments;
CREATE POLICY "post_comments: insert own"
  ON public.post_comments FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1
      FROM public.posts
      WHERE id = post_id
        AND is_removed = false
    )
  );

DROP POLICY IF EXISTS "post_comments: update own or admin" ON public.post_comments;
CREATE POLICY "post_comments: update own or admin"
  ON public.post_comments FOR UPDATE
  USING (author_id = auth.uid() OR public.is_admin())
  WITH CHECK (author_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "post_reactions: select public" ON public.post_reactions;
CREATE POLICY "post_reactions: select public"
  ON public.post_reactions FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "post_reactions: insert own" ON public.post_reactions;
CREATE POLICY "post_reactions: insert own"
  ON public.post_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "post_reactions: update own" ON public.post_reactions;
CREATE POLICY "post_reactions: update own"
  ON public.post_reactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "post_reactions: delete own" ON public.post_reactions;
CREATE POLICY "post_reactions: delete own"
  ON public.post_reactions FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "post_reports: select own or admin" ON public.post_reports;
CREATE POLICY "post_reports: select own or admin"
  ON public.post_reports FOR SELECT
  USING (reporter_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "post_reports: insert own" ON public.post_reports;
CREATE POLICY "post_reports: insert own"
  ON public.post_reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "follows: select participant" ON public.follows;
CREATE POLICY "follows: select participant"
  ON public.follows FOR SELECT
  USING (
    follower_id = auth.uid()
    OR following_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "follows: insert own" ON public.follows;
CREATE POLICY "follows: insert own"
  ON public.follows FOR INSERT
  WITH CHECK (
    follower_id = auth.uid()
    AND follower_id <> following_id
  );

DROP POLICY IF EXISTS "follows: delete own" ON public.follows;
CREATE POLICY "follows: delete own"
  ON public.follows FOR DELETE
  USING (follower_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "messages: select participants" ON public.messages;
CREATE POLICY "messages: select participants"
  ON public.messages FOR SELECT
  USING (
    sender_id = auth.uid()
    OR receiver_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "messages: insert participants" ON public.messages;
CREATE POLICY "messages: insert participants"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND public.can_message_listing(listing_id, sender_id, receiver_id)
  );

DROP POLICY IF EXISTS "messages: update participants" ON public.messages;
CREATE POLICY "messages: update participants"
  ON public.messages FOR UPDATE
  USING (
    sender_id = auth.uid()
    OR receiver_id = auth.uid()
    OR public.is_admin()
  )
  WITH CHECK (
    sender_id = auth.uid()
    OR receiver_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "search_events: select own" ON public.search_events;
CREATE POLICY "search_events: select own"
  ON public.search_events FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "payments: select own" ON public.payments;
CREATE POLICY "payments: select own"
  ON public.payments FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "notifications: select own" ON public.notifications;
CREATE POLICY "notifications: select own"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "notifications: update own" ON public.notifications;
CREATE POLICY "notifications: update own"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "saved_listings: select own" ON public.saved_listings;
CREATE POLICY "saved_listings: select own"
  ON public.saved_listings FOR SELECT
  USING (finder_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "saved_listings: insert own" ON public.saved_listings;
CREATE POLICY "saved_listings: insert own"
  ON public.saved_listings FOR INSERT
  WITH CHECK (
    finder_id = auth.uid()
    AND public.get_user_role() IN ('finder', 'admin')
  );

DROP POLICY IF EXISTS "saved_listings: delete own" ON public.saved_listings;
CREATE POLICY "saved_listings: delete own"
  ON public.saved_listings FOR DELETE
  USING (finder_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "user_blocks: select own" ON public.user_blocks;
CREATE POLICY "user_blocks: select own"
  ON public.user_blocks FOR SELECT
  USING (blocker_id = auth.uid() OR blocked_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "user_blocks: insert own" ON public.user_blocks;
CREATE POLICY "user_blocks: insert own"
  ON public.user_blocks FOR INSERT
  WITH CHECK (blocker_id = auth.uid());

DROP POLICY IF EXISTS "user_blocks: delete own" ON public.user_blocks;
CREATE POLICY "user_blocks: delete own"
  ON public.user_blocks FOR DELETE
  USING (blocker_id = auth.uid() OR public.is_admin());
