-- Migration 019: Graph views and functions for constellation graph, coordination overlay, and timeline
-- Phase 3 of Graph Enhancement

-- ============================================================================
-- 1. graph_data view — comprehensive graph data per artifact
-- ============================================================================

CREATE OR REPLACE VIEW graph_data AS
SELECT
  a.id,
  a.title,
  a.type,
  a.state,
  a.rea_role,
  a.agent_type,
  a.event_temporality,
  a.created_at,
  a.origin_convergence_id,
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object('dimension', ad.dimension, 'key', ad.key, 'weight', ad.weight))
     FROM artifact_dimensions ad WHERE ad.artifact_id = a.id),
    '[]'::jsonb
  ) AS dimensions,
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object('participant_id', ap.participant_id, 'name', p.name, 'role', ap.role))
     FROM artifact_participants ap
     JOIN participants p ON p.id = ap.participant_id
     WHERE ap.artifact_id = a.id),
    '[]'::jsonb
  ) AS participants,
  (
    (SELECT count(*) FROM artifact_relationships ar WHERE ar.from_artifact_id = a.id OR ar.to_artifact_id = a.id)
    + (SELECT count(*) FROM artifact_dimensions ad WHERE ad.artifact_id = a.id)
  )::int AS connection_count
FROM artifacts a
WHERE a.deleted_at IS NULL;

COMMENT ON VIEW graph_data IS 'Comprehensive graph node data with aggregated dimensions, participants, and connection counts';

-- ============================================================================
-- 2. get_graph_data(p_convergence_id) — full graph dataset
-- ============================================================================

CREATE OR REPLACE FUNCTION get_graph_data(p_convergence_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE
AS $$
  SELECT jsonb_build_object(
    'nodes', (
      SELECT COALESCE(jsonb_agg(row_to_json(g)::jsonb), '[]'::jsonb)
      FROM graph_data g
      WHERE g.origin_convergence_id = p_convergence_id
    ),
    'edges', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', ar.id,
        'from', ar.from_artifact_id,
        'to', ar.to_artifact_id,
        'type', ar.type,
        'description', ar.description,
        'created_at', ar.created_at
      )), '[]'::jsonb)
      FROM artifact_relationships ar
      JOIN artifacts a1 ON a1.id = ar.from_artifact_id AND a1.origin_convergence_id = p_convergence_id
      JOIN artifacts a2 ON a2.id = ar.to_artifact_id AND a2.origin_convergence_id = p_convergence_id
    ),
    'dimension_summary', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'dimension', sub.dimension,
        'count', sub.cnt,
        'total_weight', sub.total_weight
      )), '[]'::jsonb)
      FROM (
        SELECT ad.dimension, count(*) AS cnt, sum(ad.weight) AS total_weight
        FROM artifact_dimensions ad
        JOIN artifacts a ON a.id = ad.artifact_id AND a.origin_convergence_id = p_convergence_id AND a.deleted_at IS NULL
        GROUP BY ad.dimension
      ) sub
    )
  );
$$;

COMMENT ON FUNCTION get_graph_data(uuid) IS 'Returns full graph dataset (nodes, edges, dimension summary) for a convergence';

-- ============================================================================
-- 3. get_coordination_graph(p_convergence_id) — coordination signals
-- ============================================================================

CREATE OR REPLACE FUNCTION get_coordination_graph(p_convergence_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'participant_id', ci.participant_id,
    'participant_name', p.name,
    'artifact_id', ci.artifact_id,
    'artifact_title', a.title,
    'note', ci.note,
    'created_at', ci.created_at
  )), '[]'::jsonb)
  FROM coordination_interests ci
  JOIN participants p ON p.id = ci.participant_id
  JOIN artifacts a ON a.id = ci.artifact_id
    AND a.origin_convergence_id = p_convergence_id
    AND a.deleted_at IS NULL;
$$;

COMMENT ON FUNCTION get_coordination_graph(uuid) IS 'Returns coordination interest edges (participant→artifact) for a convergence';

-- ============================================================================
-- 4. get_graph_timeline(p_convergence_id) — temporal data for timeline slider
-- ============================================================================

CREATE OR REPLACE FUNCTION get_graph_timeline(p_convergence_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE
AS $$
  SELECT jsonb_build_object(
    'artifacts', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', sub.id,
        'title', sub.title,
        'type', sub.type,
        'state', sub.state,
        'created_at', sub.created_at,
        'cumulative_count', sub.rn
      ) ORDER BY sub.created_at), '[]'::jsonb)
      FROM (
        SELECT a.id, a.title, a.type, a.state, a.created_at,
               row_number() OVER (ORDER BY a.created_at) AS rn
        FROM artifacts a
        WHERE a.origin_convergence_id = p_convergence_id AND a.deleted_at IS NULL
      ) sub
    ),
    'relationships', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', ar.id,
        'from', ar.from_artifact_id,
        'to', ar.to_artifact_id,
        'type', ar.type,
        'created_at', ar.created_at
      ) ORDER BY ar.created_at), '[]'::jsonb)
      FROM artifact_relationships ar
      JOIN artifacts a1 ON a1.id = ar.from_artifact_id AND a1.origin_convergence_id = p_convergence_id
      JOIN artifacts a2 ON a2.id = ar.to_artifact_id AND a2.origin_convergence_id = p_convergence_id
    )
  );
$$;

COMMENT ON FUNCTION get_graph_timeline(uuid) IS 'Returns temporal data (artifacts with cumulative count, relationships) for timeline visualization';

-- ============================================================================
-- 5. Grants
-- ============================================================================

GRANT SELECT ON graph_data TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_graph_data(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_coordination_graph(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_graph_timeline(uuid) TO authenticated, anon;
