-- Sprint 83: Commitment Tracking
-- Track commitments made in messages, monitor fulfillment

-- Commitment status enum
CREATE TYPE commitment_status AS ENUM ('made', 'in_progress', 'fulfilled', 'broken');

-- Commitments table
CREATE TABLE IF NOT EXISTS commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  commitment_text TEXT NOT NULL,
  status commitment_status NOT NULL DEFAULT 'made',
  due_date TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commitments_thread ON commitments(thread_id);
CREATE INDEX idx_commitments_participant ON commitments(participant_id);
CREATE INDEX idx_commitments_status ON commitments(status);
CREATE INDEX idx_commitments_due ON commitments(due_date) WHERE due_date IS NOT NULL;

-- Function: Create a commitment from a message
CREATE OR REPLACE FUNCTION create_commitment(
  p_message_id UUID,
  p_commitment_text TEXT,
  p_due_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_commitment_id UUID;
  v_thread_id UUID;
  v_participant_id UUID;
BEGIN
  -- Get thread and participant from message
  SELECT thread_id, author_id INTO v_thread_id, v_participant_id
  FROM messages WHERE id = p_message_id;

  IF v_participant_id IS NULL THEN
    RAISE EXCEPTION 'Cannot create commitment: message has no author';
  END IF;

  -- Create commitment
  INSERT INTO commitments (thread_id, message_id, participant_id, commitment_text, due_date)
  VALUES (v_thread_id, p_message_id, v_participant_id, p_commitment_text, p_due_date)
  RETURNING id INTO v_commitment_id;

  RETURN v_commitment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update commitment status
CREATE OR REPLACE FUNCTION update_commitment_status(
  p_commitment_id UUID,
  p_status commitment_status
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE commitments 
  SET 
    status = p_status,
    fulfilled_at = CASE WHEN p_status = 'fulfilled' THEN NOW() ELSE fulfilled_at END,
    updated_at = NOW()
  WHERE id = p_commitment_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get commitment fulfillment rate for a participant
CREATE OR REPLACE FUNCTION get_commitment_stats(p_participant_id UUID)
RETURNS TABLE (
  total INTEGER,
  made INTEGER,
  in_progress INTEGER,
  fulfilled INTEGER,
  broken INTEGER,
  fulfillment_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER AS total,
    COUNT(*) FILTER (WHERE status = 'made')::INTEGER AS made,
    COUNT(*) FILTER (WHERE status = 'in_progress')::INTEGER AS in_progress,
    COUNT(*) FILTER (WHERE status = 'fulfilled')::INTEGER AS fulfilled,
    COUNT(*) FILTER (WHERE status = 'broken')::INTEGER AS broken,
    CASE 
      WHEN COUNT(*) FILTER (WHERE status IN ('fulfilled', 'broken')) = 0 THEN 0
      ELSE ROUND(
        COUNT(*) FILTER (WHERE status = 'fulfilled')::NUMERIC / 
        COUNT(*) FILTER (WHERE status IN ('fulfilled', 'broken'))::NUMERIC * 100,
        1
      )
    END AS fulfillment_rate
  FROM commitments
  WHERE participant_id = p_participant_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- View: Overdue commitments
CREATE OR REPLACE VIEW overdue_commitments AS
SELECT 
  c.*,
  p.name AS participant_name,
  t.title AS thread_title
FROM commitments c
JOIN participants p ON p.id = c.participant_id
JOIN threads t ON t.id = c.thread_id
WHERE c.status IN ('made', 'in_progress')
  AND c.due_date < NOW()
ORDER BY c.due_date ASC;

-- RLS
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;

-- Anyone can view commitments (transparency)
CREATE POLICY commitments_select ON commitments
  FOR SELECT
  USING (true);

-- Only the committer or thread participants can update
CREATE POLICY commitments_update ON commitments
  FOR UPDATE TO authenticated
  USING (
    participant_id IN (SELECT id FROM participants WHERE auth_id = auth.uid())
  );

-- Authenticated users can create commitments
CREATE POLICY commitments_insert ON commitments
  FOR INSERT TO authenticated
  WITH CHECK (
    participant_id IN (SELECT id FROM participants WHERE auth_id = auth.uid())
  );

COMMENT ON TABLE commitments IS 'Track commitments made in messages. Status: made → in_progress → fulfilled/broken. Transparency via public SELECT.';
COMMENT ON FUNCTION create_commitment IS 'Create a commitment linked to a message. Auto-assigns participant from message author.';
COMMENT ON FUNCTION update_commitment_status IS 'Update commitment status. Auto-sets fulfilled_at when status = fulfilled.';
COMMENT ON FUNCTION get_commitment_stats IS 'Get commitment statistics for a participant: counts per status and fulfillment rate (%).';
COMMENT ON VIEW overdue_commitments IS 'All commitments past due_date that are not yet fulfilled or broken.';
