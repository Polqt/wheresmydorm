-- =============================================================================
-- 0001_enums.sql
-- All custom PostgreSQL enum types
-- =============================================================================

CREATE TYPE user_role AS ENUM (
  'finder',
  'lister',
  'admin'
);

CREATE TYPE property_type AS ENUM (
  'dorm',
  'apartment',
  'bedspace',
  'condo',
  'boarding_house',
  'studio'
);

CREATE TYPE listing_status AS ENUM (
  'active',
  'paused',
  'archived'
);

CREATE TYPE payment_type AS ENUM (
  'finder_upgrade',   -- P199 one-time finder unlock
  'listing_fee'       -- P150 per additional listing beyond free quota
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'paid',
  'failed',
  'refunded'
);

CREATE TYPE search_event_type AS ENUM (
  'listing_view',  -- Finder opened full listing detail page
  'ai_chat'        -- Finder used one AI Chat prompt
);

CREATE TYPE notification_type AS ENUM (
  'new_message',
  'review_response',
  'listing_update',
  'new_review',
  'bookmark_update',
  'price_drop',
  'new_listing_nearby',
  'payment_confirmed',
  'broadcast'
);

CREATE TYPE report_reason AS ENUM (
  'spam',
  'fake',
  'offensive',
  'misleading',
  'other'
);

CREATE TYPE report_status AS ENUM (
  'pending',
  'reviewed',
  'actioned',
  'dismissed'
);

CREATE TYPE reaction_type AS ENUM (
  'like',
  'helpful',
  'funny'
);