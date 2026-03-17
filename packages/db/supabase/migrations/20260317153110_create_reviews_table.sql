CREATE TABLE IF NOT EXISTS public.reviews (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  uuid  NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  finder_id   uuid  NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 
  -- 5 sub-category ratings (1.0 – 5.0)
  rating_overall     real NOT NULL CHECK (rating_overall     BETWEEN 1 AND 5),
  rating_value       real NOT NULL CHECK (rating_value       BETWEEN 1 AND 5),
  rating_safety      real NOT NULL CHECK (rating_safety      BETWEEN 1 AND 5),
  rating_cleanliness real NOT NULL CHECK (rating_cleanliness BETWEEN 1 AND 5),
  rating_location    real NOT NULL CHECK (rating_location    BETWEEN 1 AND 5),
  rating_landlord    real NOT NULL CHECK (rating_landlord    BETWEEN 1 AND 5),
 
  -- Minimum 20 characters enforced at API layer + DB constraint
  body  text NOT NULL CHECK (char_length(body) >= 20),
 
  -- Up to 5 Supabase Storage URLs
  photo_urls  jsonb NOT NULL DEFAULT '[]',
 
  helpful_count  integer NOT NULL DEFAULT 0,
 
  -- Lister public response
  lister_response    text,
  lister_responded_at timestamptz,
 
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
 
  -- One review per finder per listing
  UNIQUE (listing_id, finder_id)
);
 
CREATE INDEX IF NOT EXISTS reviews_listing_idx ON public.reviews(listing_id);
CREATE INDEX IF NOT EXISTS reviews_finder_idx  ON public.reviews(finder_id);
 
-- ---------------------------------------------------------------------------
-- review_helpful_votes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.review_helpful_votes (
  review_id   uuid NOT NULL REFERENCES public.reviews(id)   ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (review_id, user_id)
);
 
-- ---------------------------------------------------------------------------
-- review_reports
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.review_reports (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id    uuid          NOT NULL REFERENCES public.reviews(id)  ON DELETE CASCADE,
  reporter_id  uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason       report_reason NOT NULL,
  notes        text,
  status       report_status NOT NULL DEFAULT 'pending',
  reviewed_by  uuid          REFERENCES public.profiles(id),
  reviewed_at  timestamptz,
  created_at   timestamptz   NOT NULL DEFAULT now()
);
 
CREATE INDEX IF NOT EXISTS review_reports_status_idx ON public.review_reports(status);
CREATE INDEX IF NOT EXISTS review_reports_review_idx ON public.review_reports(review_id);
 