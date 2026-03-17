CREATE TABLE IF NOT EXISTS public.listings (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  lister_id      uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 
  title          text          NOT NULL,
  description    text          NOT NULL,
  property_type  property_type NOT NULL,
 
  price_per_month  numeric(10,2) NOT NULL,
  size_sqm         real,
  max_occupants    integer,
 
  -- Location
  lat       real  NOT NULL,
  lng       real  NOT NULL,
  address   text  NOT NULL,
  city      text  NOT NULL,  -- 'Bacolod' | 'Metro Manila' | 'Cebu'
  barangay  text,
 
  -- Amenities stored as JSONB string array
  -- e.g. '["wifi","ac","water_included","cctv","parking","pet_friendly"]'
  amenities  jsonb NOT NULL DEFAULT '[]',
 
  is_available    boolean       NOT NULL DEFAULT true,
  available_from  timestamptz,
 
  status      listing_status NOT NULL DEFAULT 'active',
  expires_at  timestamptz,                 -- auto-pause after 90 days
 
  -- Denormalised aggregate ratings (updated by trigger after each review change)
  rating_overall     real,
  rating_value       real,
  rating_safety      real,
  rating_cleanliness real,
  rating_location    real,
  rating_landlord    real,
  review_count       integer NOT NULL DEFAULT 0,
 
  -- Denormalised engagement counters
  view_count      integer NOT NULL DEFAULT 0,
  bookmark_count  integer NOT NULL DEFAULT 0,
  inquiry_count   integer NOT NULL DEFAULT 0,
 
  is_featured  boolean NOT NULL DEFAULT false,
 
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
 

CREATE INDEX IF NOT EXISTS listings_lister_idx       ON public.listings(lister_id);
CREATE INDEX IF NOT EXISTS listings_status_idx       ON public.listings(status);
CREATE INDEX IF NOT EXISTS listings_city_idx         ON public.listings(city);
CREATE INDEX IF NOT EXISTS listings_type_idx         ON public.listings(property_type);
CREATE INDEX IF NOT EXISTS listings_price_idx        ON public.listings(price_per_month);
CREATE INDEX IF NOT EXISTS listings_active_city_idx  ON public.listings(status, city);
-- GIN index for JSONB amenities filter queries
CREATE INDEX IF NOT EXISTS listings_amenities_idx    ON public.listings USING gin(amenities);
-- Full-text search on title + description
CREATE INDEX IF NOT EXISTS listings_fts_idx          ON public.listings
  USING gin(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')));


CREATE TABLE IF NOT EXISTS public.listing_photos (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  uuid  NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  url         text  NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  alt_text    text,
  created_at  timestamptz NOT NULL DEFAULT now()
);