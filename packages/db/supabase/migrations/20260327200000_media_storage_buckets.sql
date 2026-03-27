-- =============================================================================
-- Media storage buckets + RLS policies
--
-- Creates the public media buckets used by listings, messages, and feed posts.
-- Uploads are restricted to an authenticated user's own folder (<userId>/*).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Create buckets (idempotent)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('listing-photos', 'listing-photos', true),
  ('message-media', 'message-media', true),
  ('post-media', 'post-media', true)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Drop existing policies so the migration can be re-run safely
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "listing-photos: public read" ON storage.objects;
DROP POLICY IF EXISTS "listing-photos: authenticated users can upload their own" ON storage.objects;
DROP POLICY IF EXISTS "listing-photos: authenticated users can update their own" ON storage.objects;
DROP POLICY IF EXISTS "listing-photos: authenticated users can delete their own" ON storage.objects;

DROP POLICY IF EXISTS "message-media: public read" ON storage.objects;
DROP POLICY IF EXISTS "message-media: authenticated users can upload their own" ON storage.objects;
DROP POLICY IF EXISTS "message-media: authenticated users can update their own" ON storage.objects;
DROP POLICY IF EXISTS "message-media: authenticated users can delete their own" ON storage.objects;

DROP POLICY IF EXISTS "post-media: public read" ON storage.objects;
DROP POLICY IF EXISTS "post-media: authenticated users can upload their own" ON storage.objects;
DROP POLICY IF EXISTS "post-media: authenticated users can update their own" ON storage.objects;
DROP POLICY IF EXISTS "post-media: authenticated users can delete their own" ON storage.objects;

-- ---------------------------------------------------------------------------
-- 3. Listing photos
-- ---------------------------------------------------------------------------
CREATE POLICY "listing-photos: public read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'listing-photos');

CREATE POLICY "listing-photos: authenticated users can upload their own"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'listing-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "listing-photos: authenticated users can update their own"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'listing-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "listing-photos: authenticated users can delete their own"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'listing-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- 4. Message media
-- ---------------------------------------------------------------------------
CREATE POLICY "message-media: public read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'message-media');

CREATE POLICY "message-media: authenticated users can upload their own"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'message-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "message-media: authenticated users can update their own"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'message-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "message-media: authenticated users can delete their own"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'message-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- 5. Post media
-- ---------------------------------------------------------------------------
CREATE POLICY "post-media: public read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'post-media');

CREATE POLICY "post-media: authenticated users can upload their own"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'post-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "post-media: authenticated users can update their own"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'post-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "post-media: authenticated users can delete their own"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'post-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
