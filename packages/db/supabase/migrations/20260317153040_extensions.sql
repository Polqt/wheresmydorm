-- =============================================================================
-- 0000_extensions.sql
-- Enable required PostgreSQL extensions
-- =============================================================================

-- UUID generation (used as default for primary keys)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Full-text search with trigram similarity (used by listings search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Unaccent for search normalization (strips accents from Filipino/Spanish place names)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- pg_cron for scheduled jobs (listing 90-day auto-pause)
-- NOTE: must be enabled in Supabase dashboard under Database > Extensions
-- CREATE EXTENSION IF NOT EXISTS pg_cron;