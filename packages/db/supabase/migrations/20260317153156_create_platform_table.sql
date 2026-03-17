CREATE TABLE IF NOT EXISTS public.payments (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id  uuid          REFERENCES public.listings(id) ON DELETE SET NULL,
 
  type    payment_type   NOT NULL,
  status  payment_status NOT NULL DEFAULT 'pending',
  amount  numeric(10,2)  NOT NULL,
 
  paymongo_payment_id         text,
  paymongo_payment_intent_id  text,
  payment_method              text,  -- 'gcash' | 'card' | 'paymaya'
 
  -- Raw Paymongo webhook payload stored for reconciliation
  webhook_payload  text,
 
  paid_at      timestamptz,
  refunded_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
 
CREATE INDEX IF NOT EXISTS payments_user_idx      ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS payments_status_idx    ON public.payments(status);
CREATE INDEX IF NOT EXISTS payments_paymongo_idx  ON public.payments(paymongo_payment_id);
 
-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id      uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid              NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type    notification_type NOT NULL,
  title   text              NOT NULL,
  body    text              NOT NULL,
  is_read boolean           NOT NULL DEFAULT false,
  read_at timestamptz,
  -- Polymorphic reference (listing / post / message / review)
  reference_id    text,
  reference_type  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
 
CREATE INDEX IF NOT EXISTS notifications_user_idx    ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_unread_idx  ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS notifications_created_idx ON public.notifications(created_at DESC);
 
-- ---------------------------------------------------------------------------
-- saved_listings (wishlist / bookmarks)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_listings (
  finder_id   uuid NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  listing_id  uuid NOT NULL REFERENCES public.listings(id)  ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (finder_id, listing_id)
);
 
CREATE INDEX IF NOT EXISTS saved_listings_finder_idx ON public.saved_listings(finder_id);