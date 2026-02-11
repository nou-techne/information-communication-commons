-- Sprint 30: Dimension Weighting
-- Add weight (0-1) to dimension tags for intensity/relevance scoring

-- Add weight column to artifact_dimensions (the join table between artifacts and dimensions)
ALTER TABLE artifact_dimensions
ADD COLUMN weight numeric(3,2) DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 1.0);

-- Index for weighted queries
CREATE INDEX idx_artifact_dimensions_weight ON artifact_dimensions(weight DESC);

-- Function to get dimension distribution with weights
CREATE OR REPLACE FUNCTION get_weighted_dimension_distribution(p_convergence_id uuid DEFAULT NULL)
RETURNS TABLE (
  dimension_key text,
  total_weight numeric,
  artifact_count bigint,
  avg_weight numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ad.key as dimension_key,
    COALESCE(SUM(ad.weight), 0)::numeric as total_weight,
    COUNT(DISTINCT ad.artifact_id)::bigint as artifact_count,
    COALESCE(AVG(ad.weight), 0)::numeric as avg_weight
  FROM artifact_dimensions ad
  JOIN artifacts a ON a.id = ad.artifact_id
  WHERE (p_convergence_id IS NULL OR a.origin_convergence_id = p_convergence_id)
  GROUP BY ad.key
  ORDER BY total_weight DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant access
GRANT EXECUTE ON FUNCTION get_weighted_dimension_distribution(uuid) TO authenticated, anon;

-- Backfill: Set existing tags to weight 1.0 (was implied binary)
UPDATE artifact_dimensions SET weight = 1.0 WHERE weight IS NULL;
