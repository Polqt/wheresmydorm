-- =============================================================================
-- Avatars storage bucket + RLS policies
--
-- Creates the `avatars` bucket (public) and locks it down so users can only
-- read/write files inside their own folder (<userId>/*).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Create the bucket (idempotent)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Drop existing policies to make this migration re-runnable
--    (RLS on storage.objects is managed by Supabase — no ALTER needed)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "avatars: public read"                            ON storage.objects;
DROP POLICY IF EXISTS "avatars: authenticated users can upload their own" ON storage.objects;
DROP POLICY IF EXISTS "avatars: authenticated users can update their own" ON storage.objects;
DROP POLICY IF EXISTS "avatars: authenticated users can delete their own" ON storage.objects;

-- ---------------------------------------------------------------------------
-- 4. Public read — anyone (including unauthenticated) can view avatar images
-- ---------------------------------------------------------------------------
CREATE POLICY "avatars: public read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- ---------------------------------------------------------------------------
-- 5. Upload — authenticated users may only write into their own folder
-- ---------------------------------------------------------------------------
CREATE POLICY "avatars: authenticated users can upload their own"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- 6. Update — authenticated users may only overwrite their own files
-- ---------------------------------------------------------------------------
CREATE POLICY "avatars: authenticated users can update their own"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- 7. Delete — authenticated users may only remove their own files
-- ---------------------------------------------------------------------------
CREATE POLICY "avatars: authenticated users can delete their own"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
