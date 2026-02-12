-- Sprint 93: Cross-Convergence Search
-- Search across all convergences with source labels

-- Enhanced search function that includes convergence origin
CREATE OR REPLACE FUNCTION search_content_cross_convergence(
  query_text text,
  convergence_filter uuid DEFAULT NULL
)
RETURNS TABLE(
  result_type text,
  id uuid,
  title text,
  snippet text,
  rank real,
  created_at timestamptz,
  convergence_id uuid,
  convergence_name text,
  convergence_slug text
) AS $$
BEGIN
  RETURN QUERY
  -- Search artifacts
  SELECT 
    'artifact'::text as result_type,
    a.id,
    a.title,
    ts_headline('english', coalesce(a.content, a.description, ''), 
                websearch_to_tsquery('english', query_text),
                'MaxWords=30, MinWords=15') as snippet,
    ts_rank(a.search_vector, websearch_to_tsquery('english', query_text)) as rank,
    a.created_at,
    a.convergence_id,
    conv.name as convergence_name,
    conv.slug as convergence_slug
  FROM artifacts a
  LEFT JOIN convergences conv ON conv.id = a.convergence_id
  WHERE a.search_vector @@ websearch_to_tsquery('english', query_text)
    AND (convergence_filter IS NULL OR a.convergence_id = convergence_filter)
  
  UNION ALL
  
  -- Search contributions
  SELECT 
    'contribution'::text as result_type,
    c.id,
    'Contribution'::text as title,
    ts_headline('english', c.content, 
                websearch_to_tsquery('english', query_text),
                'MaxWords=30, MinWords=15') as snippet,
    ts_rank(c.search_vector, websearch_to_tsquery('english', query_text)) as rank,
    c.created_at,
    c.convergence_id,
    conv.name as convergence_name,
    conv.slug as convergence_slug
  FROM contributions c
  LEFT JOIN convergences conv ON conv.id = c.convergence_id
  WHERE c.search_vector @@ websearch_to_tsquery('english', query_text)
    AND (convergence_filter IS NULL OR c.convergence_id = convergence_filter)
  
  ORDER BY rank DESC, created_at DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- View for cross-convergence search results with aggregates
CREATE OR REPLACE VIEW search_results_by_convergence AS
SELECT 
  a.convergence_id,
  conv.name as convergence_name,
  conv.slug as convergence_slug,
  COUNT(DISTINCT a.id) as artifact_count,
  COUNT(DISTINCT c.id) as contribution_count,
  MAX(GREATEST(a.created_at, c.created_at)) as last_activity
FROM artifacts a
FULL OUTER JOIN contributions c ON c.convergence_id = a.convergence_id
LEFT JOIN convergences conv ON conv.id = COALESCE(a.convergence_id, c.convergence_id)
GROUP BY a.convergence_id, conv.name, conv.slug;

-- Function to get search statistics across convergences
CREATE OR REPLACE FUNCTION get_search_stats(query_text text)
RETURNS TABLE(
  total_results integer,
  convergence_count integer,
  artifact_results integer,
  contribution_results integer,
  top_convergences jsonb
) AS $$
DECLARE
  v_total integer;
  v_conv_count integer;
  v_artifact_count integer;
  v_contribution_count integer;
  v_top_conv jsonb;
BEGIN
  -- Count total results
  SELECT COUNT(*) INTO v_total
  FROM (
    SELECT id FROM artifacts 
    WHERE search_vector @@ websearch_to_tsquery('english', query_text)
    UNION ALL
    SELECT id FROM contributions
    WHERE search_vector @@ websearch_to_tsquery('english', query_text)
  ) all_results;
  
  -- Count unique convergences
  SELECT COUNT(DISTINCT convergence_id) INTO v_conv_count
  FROM (
    SELECT convergence_id FROM artifacts 
    WHERE search_vector @@ websearch_to_tsquery('english', query_text)
    UNION
    SELECT convergence_id FROM contributions
    WHERE search_vector @@ websearch_to_tsquery('english', query_text)
  ) conv_results;
  
  -- Count by type
  SELECT COUNT(*) INTO v_artifact_count
  FROM artifacts
  WHERE search_vector @@ websearch_to_tsquery('english', query_text);
  
  SELECT COUNT(*) INTO v_contribution_count
  FROM contributions
  WHERE search_vector @@ websearch_to_tsquery('english', query_text);
  
  -- Get top 5 convergences by result count
  SELECT jsonb_agg(
    jsonb_build_object(
      'convergenceId', convergence_id,
      'convergenceName', convergence_name,
      'resultCount', result_count
    )
  ) INTO v_top_conv
  FROM (
    SELECT 
      COALESCE(a.convergence_id, c.convergence_id) as convergence_id,
      MAX(conv.name) as convergence_name,
      COUNT(*) as result_count
    FROM (
      SELECT id, convergence_id FROM artifacts 
      WHERE search_vector @@ websearch_to_tsquery('english', query_text)
    ) a
    FULL OUTER JOIN (
      SELECT id, convergence_id FROM contributions
      WHERE search_vector @@ websearch_to_tsquery('english', query_text)
    ) c ON false  -- Force full outer join
    LEFT JOIN convergences conv ON conv.id = COALESCE(a.convergence_id, c.convergence_id)
    WHERE COALESCE(a.convergence_id, c.convergence_id) IS NOT NULL
    GROUP BY COALESCE(a.convergence_id, c.convergence_id)
    ORDER BY result_count DESC
    LIMIT 5
  ) top;
  
  RETURN QUERY SELECT v_total, v_conv_count, v_artifact_count, v_contribution_count, v_top_conv;
END;
$$ LANGUAGE plpgsql;

-- Grant access
GRANT EXECUTE ON FUNCTION search_content_cross_convergence(text, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_search_stats(text) TO authenticated, anon;
GRANT SELECT ON search_results_by_convergence TO authenticated, anon;

-- Comments for documentation
COMMENT ON FUNCTION search_content_cross_convergence IS 'Search across all convergences or filter by specific convergence. Returns results with convergence origin tags.';
COMMENT ON FUNCTION get_search_stats IS 'Get aggregate search statistics: total results, convergence count, result breakdown by type and convergence.';
COMMENT ON VIEW search_results_by_convergence IS 'Aggregated view of search content grouped by convergence for quick stats.';
