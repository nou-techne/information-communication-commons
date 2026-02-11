-- Sprint 45: Session Model Enhancements
-- Add missing columns to existing sessions table

-- Add missing columns
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS track text,
ADD COLUMN IF NOT EXISTS speakers text[],
ADD COLUMN IF NOT EXISTS session_type text,
ADD COLUMN IF NOT EXISTS tags text[],
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create index on time_start (using existing column name)
CREATE INDEX IF NOT EXISTS idx_sessions_time_start ON sessions(time_start);

-- View: Session with artifact counts
CREATE OR REPLACE VIEW session_stats AS
SELECT 
  s.id,
  s.title,
  s.time_start AS start_time,
  s.time_end AS end_time,
  s.track,
  s.speakers,
  s.session_type,
  COUNT(DISTINCT c.id) AS contribution_count,
  COUNT(DISTINCT a.id) AS artifact_count,
  COUNT(DISTINCT c.participant_id) AS participant_count
FROM sessions s
LEFT JOIN contributions c ON c.session_id = s.id
LEFT JOIN artifacts a ON a.session_id = s.id
GROUP BY s.id, s.title, s.time_start, s.time_end, s.track, s.speakers, s.session_type;

-- Function: Get session with contributions and artifacts
CREATE OR REPLACE FUNCTION get_session_detail(p_session_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'session', row_to_json(s),
    'contributions', (
      SELECT COALESCE(jsonb_agg(c ORDER BY c.created_at DESC), '[]'::jsonb)
      FROM contributions c
      WHERE c.session_id = p_session_id
    ),
    'artifacts', (
      SELECT COALESCE(jsonb_agg(a ORDER BY a.created_at DESC), '[]'::jsonb)
      FROM artifacts a
      WHERE a.session_id = p_session_id
    ),
    'participants', (
      SELECT COALESCE(jsonb_agg(DISTINCT p), '[]'::jsonb)
      FROM contributions c
      JOIN participants p ON p.id = c.participant_id
      WHERE c.session_id = p_session_id
    )
  ) INTO v_result
  FROM sessions s
  WHERE s.id = p_session_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON VIEW session_stats IS 'Sprint 45: Session statistics with contribution and artifact counts';
COMMENT ON FUNCTION get_session_detail IS 'Sprint 45: Get full session details including contributions and artifacts';
