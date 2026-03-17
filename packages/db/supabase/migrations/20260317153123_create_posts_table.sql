CREATE TABLE IF NOT EXISTS public.posts (
  id         uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id  uuid  NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 
  body        text  NOT NULL,
  media_urls  jsonb NOT NULL DEFAULT '[]',
 
  -- Optional listing tag
  listing_id  uuid REFERENCES public.listings(id) ON DELETE SET NULL,
 
  -- Extracted hashtags for discovery
  hashtags  jsonb NOT NULL DEFAULT '[]',
 
  like_count     integer NOT NULL DEFAULT 0,
  comment_count  integer NOT NULL DEFAULT 0,
  share_count    integer NOT NULL DEFAULT 0,
 
  -- Admin soft-delete
  is_removed  boolean NOT NULL DEFAULT false,
  removed_at  timestamptz,
  removed_by  uuid REFERENCES public.profiles(id),
 
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
 
CREATE INDEX IF NOT EXISTS posts_author_idx     ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS posts_created_idx    ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS posts_listing_idx    ON public.posts(listing_id);
CREATE INDEX IF NOT EXISTS posts_engagement_idx ON public.posts(like_count DESC, comment_count DESC);
-- Hashtag search via GIN
CREATE INDEX IF NOT EXISTS posts_hashtags_idx   ON public.posts USING gin(hashtags);
 
-- ---------------------------------------------------------------------------
-- post_comments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_comments (
  id                uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id           uuid  NOT NULL REFERENCES public.posts(id)    ON DELETE CASCADE,
  author_id         uuid  NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body              text  NOT NULL,
  -- Threaded replies — null = top-level comment
  parent_comment_id uuid  REFERENCES public.post_comments(id) ON DELETE CASCADE,
  is_removed        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
 
CREATE INDEX IF NOT EXISTS post_comments_post_idx    ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS post_comments_author_idx  ON public.post_comments(author_id);
CREATE INDEX IF NOT EXISTS post_comments_parent_idx  ON public.post_comments(parent_comment_id);
 
-- ---------------------------------------------------------------------------
-- post_reactions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_reactions (
  post_id    uuid          NOT NULL REFERENCES public.posts(id)    ON DELETE CASCADE,
  user_id    uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction   reaction_type NOT NULL DEFAULT 'like',
  created_at timestamptz   NOT NULL DEFAULT now(),
  -- One reaction per user per post
  PRIMARY KEY (post_id, user_id)
);
 
-- ---------------------------------------------------------------------------
-- post_reports
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_reports (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      uuid          NOT NULL REFERENCES public.posts(id)    ON DELETE CASCADE,
  reporter_id  uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason       report_reason NOT NULL,
  notes        text,
  status       report_status NOT NULL DEFAULT 'pending',
  reviewed_by  uuid          REFERENCES public.profiles(id),
  reviewed_at  timestamptz,
  created_at   timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS post_reports_status_idx ON public.post_reports(status);