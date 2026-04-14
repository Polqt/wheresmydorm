-- =============================================================================
-- Listing rating aggregation
-- Recalculates all rating columns on listings whenever a review row changes.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_listing_ratings()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing_id uuid;
BEGIN
  -- Determine which listing_id changed
  v_listing_id := CASE
    WHEN TG_OP = 'DELETE' THEN OLD.listing_id
    ELSE NEW.listing_id
  END;

  UPDATE public.listings l
  SET
    rating_overall     = agg.avg_overall,
    rating_value       = agg.avg_value,
    rating_safety      = agg.avg_safety,
    rating_cleanliness = agg.avg_cleanliness,
    rating_location    = agg.avg_location,
    rating_landlord    = agg.avg_landlord,
    review_count       = agg.cnt
  FROM (
    SELECT
      AVG(rating_overall)::real     AS avg_overall,
      AVG(rating_value)::real       AS avg_value,
      AVG(rating_safety)::real      AS avg_safety,
      AVG(rating_cleanliness)::real AS avg_cleanliness,
      AVG(rating_location)::real    AS avg_location,
      AVG(rating_landlord)::real    AS avg_landlord,
      COUNT(*)::int                 AS cnt
    FROM public.reviews
    WHERE listing_id = v_listing_id
      AND is_removed = false
  ) agg
  WHERE l.id = v_listing_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_listing_ratings ON public.reviews;
CREATE TRIGGER trg_update_listing_ratings
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_listing_ratings();
