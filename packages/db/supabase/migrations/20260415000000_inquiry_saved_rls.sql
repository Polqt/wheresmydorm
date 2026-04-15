-- ============================================================
-- RLS for inquiry_statuses and saved_searches
-- ============================================================

-- inquiry_statuses: finders and listers can see/manage their own rows
ALTER TABLE public.inquiry_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inquiry_statuses: participant can view"
  ON public.inquiry_statuses FOR SELECT
  USING (finder_id = auth.uid() OR lister_id = auth.uid() OR public.is_admin());

CREATE POLICY "inquiry_statuses: lister can update own"
  ON public.inquiry_statuses FOR UPDATE
  USING (lister_id = auth.uid() OR public.is_admin());

CREATE POLICY "inquiry_statuses: finder can insert own"
  ON public.inquiry_statuses FOR INSERT
  WITH CHECK (finder_id = auth.uid() OR public.is_admin());

-- saved_searches: finder owns their own rows
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_searches: finder can manage own"
  ON public.saved_searches FOR ALL
  USING (finder_id = auth.uid())
  WITH CHECK (finder_id = auth.uid());
