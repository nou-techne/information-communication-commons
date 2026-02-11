-- Sprint 45: Session Model
-- Add sessions table for convergence events (talks, workshops, activities)

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convergence_id uuid NOT NULL REFERENCES convergences(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  start_time timestamptz,
  end_time timestamptz,
  track text, -- e.g., "Technical", "Governance", "Workshop"
  location text, -- Physical or virtual location
  speakers text[], -- Array of speaker names
  session_type text, -- "talk", "workshop", "panel", "unconference", "social"
  tags text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add session reference to contributions
ALTER TABLE contributions
ADD COLUMN session_id uuid REFERENCES sessions(id) ON DELETE SET NULL;

-- Add session reference to artifacts
ALTER TABLE artifacts
ADD COLUMN session_id uuid REFERENCES sessions(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_sessions_convergence ON sessions(convergence_id);
CREATE INDEX idx_sessions_start_time ON sessions(start_time);
CREATE INDEX idx_contributions_session ON contributions(session_id);
CREATE INDEX idx_artifacts_session ON artifacts(session_id);

-- RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sessions are publicly readable"
  ON sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create sessions"
  ON sessions
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Session creators can update their sessions"
  ON sessions
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- View: Session with artifact counts
CREATE OR REPLACE VIEW session_stats AS
SELECT 
  s.id,
  s.title,
  s.start_time,
  s.end_time,
  s.track,
  s.speakers,
  s.session_type,
  COUNT(DISTINCT c.id) AS contribution_count,
  COUNT(DISTINCT a.id) AS artifact_count,
  COUNT(DISTINCT c.participant_id) AS participant_count
FROM sessions s
LEFT JOIN contributions c ON c.session_id = s.id
LEFT JOIN artifacts a ON a.session_id = s.id
GROUP BY s.id, s.title, s.start_time, s.end_time, s.track, s.speakers, s.session_type;

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

COMMENT ON TABLE sessions IS 'Sprint 45: Sessions (talks, workshops, activities) at convergence events';
COMMENT ON VIEW session_stats IS 'Sprint 45: Session statistics with contribution and artifact counts';
COMMENT ON FUNCTION get_session_detail IS 'Sprint 45: Get full session details including contributions and artifacts';
