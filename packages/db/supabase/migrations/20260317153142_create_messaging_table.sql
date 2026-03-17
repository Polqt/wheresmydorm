-- ---------------------------------------------------------------------------
-- follows
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  -- Prevent self-follow
  CHECK (follower_id <> following_id)
);
 
CREATE INDEX IF NOT EXISTS follows_follower_idx  ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_idx ON public.follows(following_id);
 
-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id           uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    uuid  NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id  uuid  NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id   uuid  NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  body         text  NOT NULL,
  media_url    text,
  is_read      boolean     NOT NULL DEFAULT false,
  read_at      timestamptz,
  is_deleted   boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);
 
CREATE INDEX IF NOT EXISTS messages_thread_idx  ON public.messages(listing_id, sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS messages_receiver_idx ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS messages_sender_idx   ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_created_idx  ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS messages_unread_idx   ON public.messages(receiver_id, is_read);
 
-- ---------------------------------------------------------------------------
-- user_blocks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason      text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
 
CREATE INDEX IF NOT EXISTS user_blocks_blocker_idx ON public.user_blocks(blocker_id);
 
-- ---------------------------------------------------------------------------
-- search_events
-- Quota enforcement + review eligibility gate
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.search_events (
  id          uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid              NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id  uuid              REFERENCES public.listings(id) ON DELETE SET NULL,
  event_type  search_event_type NOT NULL,
  -- Snapshot of remaining quota at time of event (audit trail)
  searches_remaining_after  integer,
  created_at  timestamptz NOT NULL DEFAULT now()
);
 
CREATE INDEX IF NOT EXISTS search_events_user_idx    ON public.search_events(user_id);
CREATE INDEX IF NOT EXISTS search_events_listing_idx ON public.search_events(listing_id);
-- Review gate: did this user view this listing?
CREATE INDEX IF NOT EXISTS search_events_gate_idx    ON public.search_events(user_id, listing_id, event_type);
