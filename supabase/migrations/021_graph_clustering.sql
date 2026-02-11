-- Sprint 39: Graph Clustering
-- Community detection and cluster labeling for graph visualization

-- Function to compute graph clusters using connected components analysis
-- This is a simplified community detection - for production, consider Louvain or Girvan-Newman
CREATE OR REPLACE FUNCTION get_graph_clusters(p_convergence_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_clusters jsonb;
BEGIN
  -- Build clusters from connected components
  WITH RECURSIVE
  -- Get all artifacts for this convergence
  artifact_nodes AS (
    SELECT id, title, rea_role, type
    FROM artifacts
    WHERE origin_convergence_id = p_convergence_id
      AND state = 'active'
  ),
  -- Get all edges
  edges AS (
    SELECT ar.from_artifact_id, ar.to_artifact_id, ar.weight
    FROM artifact_relationships ar
    JOIN artifacts a ON a.id = ar.from_artifact_id
    WHERE a.origin_convergence_id = p_convergence_id
  ),
  -- Build adjacency list
  adjacency AS (
    SELECT from_artifact_id AS node_id, to_artifact_id AS neighbor
    FROM edges
    UNION
    SELECT to_artifact_id, from_artifact_id
    FROM edges
  ),
  -- Find connected components (simplified clustering)
  components(node_id, component_id, depth) AS (
    -- Seed: each node starts as its own component
    SELECT id, id, 0
    FROM artifact_nodes
    
    UNION ALL
    
    -- Expand: propagate minimum component_id through edges
    SELECT DISTINCT adj.neighbor, 
           LEAST(c.component_id::text, adj.neighbor::text)::uuid,
           c.depth + 1
    FROM components c
    JOIN adjacency adj ON adj.node_id = c.node_id
    WHERE c.depth < 10  -- Limit recursion depth
  ),
  -- Get the minimum component_id for each node (final cluster assignment)
  final_components AS (
    SELECT node_id, MIN(component_id::text)::uuid AS cluster_id
    FROM components
    GROUP BY node_id
  ),
  -- Compute cluster sizes and extract keywords
  cluster_stats AS (
    SELECT 
      fc.cluster_id,
      COUNT(*) AS size,
      array_agg(DISTINCT an.type) AS types,
      array_agg(DISTINCT an.rea_role) AS rea_roles,
      -- Extract top words from titles (simple keyword extraction)
      string_agg(an.title, ' ') AS combined_titles
    FROM final_components fc
    JOIN artifact_nodes an ON an.id = fc.node_id
    GROUP BY fc.cluster_id
    HAVING COUNT(*) >= 2  -- Only clusters with 2+ nodes
  ),
  -- Extract keywords from titles
  cluster_keywords AS (
    SELECT 
      cluster_id,
      size,
      types,
      rea_roles,
      -- Simple keyword extraction: split on whitespace, lowercase, filter common words
      (
        SELECT array_agg(word ORDER BY cnt DESC)
        FROM (
          SELECT lower(word) AS word, COUNT(*) AS cnt
          FROM regexp_split_to_table(combined_titles, '\s+') AS word
          WHERE length(word) > 3
            AND word NOT IN ('the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'been', 'will')
          GROUP BY lower(word)
          ORDER BY COUNT(*) DESC
          LIMIT 3
        ) top_words
      ) AS keywords
    FROM cluster_stats
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'cluster_id', cluster_id::text,
    'size', size,
    'types', types,
    'rea_roles', rea_roles,
    'label', COALESCE(
      array_to_string(keywords[1:3], ', '),
      'Cluster ' || cluster_id::text
    ),
    'node_ids', (
      SELECT array_agg(node_id::text)
      FROM final_components
      WHERE final_components.cluster_id = cluster_keywords.cluster_id
    )
  ) ORDER BY size DESC), '[]'::jsonb)
  INTO v_clusters
  FROM cluster_keywords;

  RETURN v_clusters;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_graph_clusters IS 'Sprint 39: Detects graph clusters using connected components, labels with top keywords';

-- Helper view for cluster membership
CREATE OR REPLACE VIEW artifact_clusters AS
WITH RECURSIVE
  artifact_nodes AS (
    SELECT id, origin_convergence_id
    FROM artifacts
    WHERE state = 'active'
  ),
  edges AS (
    SELECT ar.from_artifact_id, ar.to_artifact_id
    FROM artifact_relationships ar
    JOIN artifacts a ON a.id = ar.from_artifact_id
  ),
  adjacency AS (
    SELECT from_artifact_id AS node_id, to_artifact_id AS neighbor
    FROM edges
    UNION
    SELECT to_artifact_id, from_artifact_id
    FROM edges
  ),
  components(node_id, component_id, depth) AS (
    SELECT id, id, 0
    FROM artifact_nodes
    
    UNION ALL
    
    SELECT DISTINCT adj.neighbor, 
           LEAST(c.component_id::text, adj.neighbor::text)::uuid,
           c.depth + 1
    FROM components c
    JOIN adjacency adj ON adj.node_id = c.node_id
    WHERE c.depth < 10
  )
SELECT node_id AS artifact_id, MIN(component_id::text)::uuid AS cluster_id
FROM components
GROUP BY node_id;

COMMENT ON VIEW artifact_clusters IS 'Sprint 39: Maps each artifact to its cluster ID';
