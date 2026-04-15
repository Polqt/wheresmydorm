ALTER TYPE public.search_event_type ADD VALUE IF NOT EXISTS 'search_query';
DO $$
BEGIN
  CREATE TYPE public.inquiry_status AS ENUM ('pending', 'responded', 'closed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.search_events
  ADD COLUMN IF NOT EXISTS search_filters jsonb,
  ADD COLUMN IF NOT EXISTS search_text text;

CREATE TABLE IF NOT EXISTS public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finder_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label text NOT NULL,
  filters jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS saved_searches_finder_idx ON public.saved_searches(finder_id);
CREATE INDEX IF NOT EXISTS saved_searches_created_idx ON public.saved_searches(created_at DESC);

CREATE TABLE IF NOT EXISTS public.inquiry_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finder_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lister_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  status public.inquiry_status NOT NULL DEFAULT 'pending',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inquiry_statuses_listing_idx
  ON public.inquiry_statuses(listing_id, finder_id, lister_id);

CREATE TABLE IF NOT EXISTS public.conversation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  reason public.report_reason NOT NULL,
  notes text,
  status public.report_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conversation_reports_status_idx
  ON public.conversation_reports(status);
CREATE INDEX IF NOT EXISTS conversation_reports_listing_idx
  ON public.conversation_reports(listing_id, reporter_id);
