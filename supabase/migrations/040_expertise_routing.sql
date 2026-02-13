-- Sprint 82: Domain Expertise Routing
-- Track participant expertise per dimension and route threads to experts

-- Expertise scores table
CREATE TABLE IF NOT EXISTS participant_expertise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL CHECK (dimension IN ('e', 'H', 'L', 'A', 'M', 'T', 'S')),
  score NUMERIC(3,2) NOT NULL DEFAULT 0.0 CHECK (score >= 0.0 AND score <= 1.0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (participant_id, dimension)
);

CREATE INDEX idx_expertise_participant ON participant_expertise(participant_id);
CREATE INDEX idx_expertise_dimension ON participant_expertise(dimension);
CREATE INDEX idx_expertise_score ON participant_expertise(dimension, score DESC);

-- Function: Get experts for a dimension (top N by score)
CREATE OR REPLACE FUNCTION get_dimension_experts(
  p_dimension TEXT,
  p_min_score NUMERIC DEFAULT 0.5,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  participant_id UUID,
  participant_name TEXT,
  score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pe.participant_id,
    p.name,
    pe.score
  FROM participant_expertise pe
  JOIN participants p ON p.id = pe.participant_id
  WHERE pe.dimension = p_dimension
    AND pe.score >= p_min_score
  ORDER BY pe.score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Increment expertise score (called when participating in dimension)
CREATE OR REPLACE FUNCTION increment_expertise(
  p_participant_id UUID,
  p_dimension TEXT,
  p_amount NUMERIC DEFAULT 0.05
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO participant_expertise (participant_id, dimension, score)
  VALUES (p_participant_id, p_dimension, LEAST(1.0, p_amount))
  ON CONFLICT (participant_id, dimension)
  DO UPDATE SET 
    score = LEAST(1.0, participant_expertise.score + p_amount),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- RLS
ALTER TABLE participant_expertise ENABLE ROW LEVEL SECURITY;

-- Anyone can view expertise scores (public leaderboard)
CREATE POLICY expertise_select ON participant_expertise
  FOR SELECT
  USING (true);

-- Only the participant can update their own scores (via functions)
CREATE POLICY expertise_update ON participant_expertise
  FOR UPDATE TO authenticated
  USING (participant_id IN (SELECT id FROM participants WHERE auth_id = auth.uid()));

-- Simple notification queue for expert routing
CREATE TABLE IF NOT EXISTS expert_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL,
  reason TEXT DEFAULT 'dimension_match',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  UNIQUE (participant_id, thread_id)
);

CREATE INDEX idx_expert_notifs_participant ON expert_notifications(participant_id, read_at);
CREATE INDEX idx_expert_notifs_thread ON expert_notifications(thread_id);

-- Function: Notify experts when thread is tagged with dimension
CREATE OR REPLACE FUNCTION notify_dimension_experts()
RETURNS TRIGGER AS $$
DECLARE
  v_expert RECORD;
BEGIN
  -- Only process dimension tags
  IF NEW.tag_type = 'dimension' THEN
    -- Find experts in this dimension and notify them
    FOR v_expert IN 
      SELECT participant_id 
      FROM participant_expertise 
      WHERE dimension = NEW.tag_value 
        AND score >= 0.5 
      ORDER BY score DESC 
      LIMIT 5
    LOOP
      -- Insert notification (ignoring duplicates)
      INSERT INTO expert_notifications (participant_id, thread_id, dimension)
      VALUES (v_expert.participant_id, NEW.thread_id, NEW.tag_value)
      ON CONFLICT (participant_id, thread_id) DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-notify when dimension tag added to thread
CREATE TRIGGER trg_notify_dimension_experts
  AFTER INSERT ON thread_tags
  FOR EACH ROW
  EXECUTE FUNCTION notify_dimension_experts();

-- RLS for notifications
ALTER TABLE expert_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifs_select ON expert_notifications
  FOR SELECT TO authenticated
  USING (participant_id IN (SELECT id FROM participants WHERE auth_id = auth.uid()));

CREATE POLICY notifs_update ON expert_notifications
  FOR UPDATE TO authenticated
  USING (participant_id IN (SELECT id FROM participants WHERE auth_id = auth.uid()));

COMMENT ON TABLE participant_expertise IS 'Track participant expertise per e/H-LAM/T dimension. Scores 0.0-1.0. Higher = more expertise. Auto-increments on dimension participation.';
COMMENT ON FUNCTION get_dimension_experts IS 'Find top experts in a dimension by score. Returns participant_id, name, score.';
COMMENT ON FUNCTION increment_expertise IS 'Increment expertise score for a participant in a dimension. Caps at 1.0.';
COMMENT ON TABLE expert_notifications IS 'Notification queue for dimension experts. Auto-populated when threads are tagged with dimensions.';
COMMENT ON FUNCTION notify_dimension_experts IS 'Trigger function: notifies top 5 experts when a thread is tagged with a dimension.';
