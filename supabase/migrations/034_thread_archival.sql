-- Sprint 72: Thread Archival
-- Auto-archive consolidated/resolved threads after configurable period
-- Default: 7 days after resolution/consolidation

-- Archive stale threads (call via cron or manual trigger)
CREATE OR REPLACE FUNCTION auto_archive_threads(p_days_after_resolve INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE threads 
  SET status = 'archived'
  WHERE status IN ('resolved', 'consolidated')
    AND COALESCE(consolidated_at, resolved_at) < NOW() - (p_days_after_resolve || ' days')::INTERVAL;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Manual archive for any thread
CREATE OR REPLACE FUNCTION archive_thread(p_thread_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE threads SET status = 'archived' WHERE id = p_thread_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
