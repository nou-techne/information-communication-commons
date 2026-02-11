-- Sprint 37: Graph Data Model Refinement
-- Add relationship types (supports, implements) and edge weights

-- Add new relationship types to enum
ALTER TYPE relationship_type ADD VALUE 'supports';
ALTER TYPE relationship_type ADD VALUE 'implements';

-- Add weight column to artifact_relationships
ALTER TABLE artifact_relationships
ADD COLUMN weight numeric(3,2) DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 1.0);

-- Index for weighted queries
CREATE INDEX idx_relationships_weight ON artifact_relationships(weight DESC);

COMMENT ON COLUMN artifact_relationships.weight IS 'Edge weight (0-1) indicating strength/significance of relationship';

-- Update get_graph_data function to include relationship weights
CREATE OR REPLACE FUNCTION get_graph_data(p_convergence_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'nodes', (
      SELECT COALESCE(jsonb_agg(node), '[]'::jsonb)
      FROM graph_data
      WHERE origin_convergence_id = p_convergence_id
    ),
    'edges', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'from_artifact_id', ar.from_artifact_id,
        'to_artifact_id', ar.to_artifact_id,
        'type', ar.type,
        'weight', ar.weight,
        'created_at', ar.created_at
      )), '[]'::jsonb)
      FROM artifact_relationships ar
      JOIN artifacts a ON a.id = ar.from_artifact_id
      WHERE a.origin_convergence_id = p_convergence_id
    ),
    'dimension_summary', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'dimension_key', ad.key,
        'count', COUNT(DISTINCT ad.artifact_id),
        'total_weight', SUM(ad.weight)
      )), '[]'::jsonb)
      FROM artifact_dimensions ad
      JOIN artifacts a ON a.id = ad.artifact_id
      WHERE a.origin_convergence_id = p_convergence_id
      GROUP BY ad.key
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_graph_data IS 'Sprint 37: Returns full graph data including relationship weights for visualization';
