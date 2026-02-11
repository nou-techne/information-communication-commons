-- Sprint 12: Monitoring & Observability
-- Role: Frontend & DevOps Engineer | Layer: View (7)
-- AC: Operator can monitor extraction health in real-time during ETHBoulder

-- Create extraction_health_metrics view
CREATE OR REPLACE VIEW extraction_health_metrics AS
WITH recent_window AS (
  SELECT 
    COUNT(*) as total_contributions,
    COUNT(*) FILTER (WHERE status = 'complete') as successful,
    COUNT(*) FILTER (WHERE status = 'error') as failed,
    COUNT(*) FILTER (WHERE status = 'processing') as processing,
    COUNT(*) FILTER (WHERE status = 'pending') as pending,
    AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) FILTER (WHERE processed_at IS NOT NULL) as avg_processing_time_seconds,
    MAX(processed_at) as last_processed_at
  FROM contributions
  WHERE created_at > NOW() - INTERVAL '1 hour'
),
last_24h AS (
  SELECT 
    COUNT(*) as total_24h,
    COUNT(*) FILTER (WHERE status = 'complete') as successful_24h,
    COUNT(*) FILTER (WHERE status = 'error') as failed_24h
  FROM contributions
  WHERE created_at > NOW() - INTERVAL '24 hours'
)
SELECT 
  r.total_contributions as contributions_last_hour,
  r.successful,
  r.failed,
  r.processing,
  r.pending,
  ROUND((r.successful::numeric / NULLIF(r.total_contributions, 0) * 100)::numeric, 1) as success_rate_pct,
  ROUND((r.failed::numeric / NULLIF(r.total_contributions, 0) * 100)::numeric, 1) as failure_rate_pct,
  ROUND(r.avg_processing_time_seconds::numeric, 2) as avg_processing_seconds,
  r.last_processed_at,
  h.total_24h as contributions_last_24h,
  h.successful_24h,
  h.failed_24h,
  ROUND((h.successful_24h::numeric / NULLIF(h.total_24h, 0) * 100)::numeric, 1) as success_rate_24h_pct
FROM recent_window r
CROSS JOIN last_24h h;

-- Grant access to authenticated and anon users
GRANT SELECT ON extraction_health_metrics TO anon, authenticated;

-- Create function to get recent errors
CREATE OR REPLACE FUNCTION get_recent_extraction_errors(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  contribution_id UUID,
  created_at TIMESTAMPTZ,
  content_preview TEXT,
  errors JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.created_at,
    LEFT(c.content, 100) as content_preview,
    c.errors
  FROM contributions c
  WHERE c.status = 'error'
  ORDER BY c.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (operators)
GRANT EXECUTE ON FUNCTION get_recent_extraction_errors TO authenticated;

COMMENT ON VIEW extraction_health_metrics IS 'Sprint 12: Real-time extraction pipeline health metrics';
COMMENT ON FUNCTION get_recent_extraction_errors IS 'Sprint 12: Recent extraction failures for debugging';
