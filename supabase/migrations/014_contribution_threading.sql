-- Sprint 29: Contribution Threading
-- Allow contributions to reference other contributions (reply chains)

-- Add parent reference to contributions table
ALTER TABLE contributions
ADD COLUMN parent_contribution_id uuid REFERENCES contributions(id) ON DELETE SET NULL;

-- Index for fast thread lookups
CREATE INDEX idx_contributions_parent ON contributions(parent_contribution_id) WHERE parent_contribution_id IS NOT NULL;

-- Function to get full thread (all replies to a contribution)
CREATE OR REPLACE FUNCTION get_contribution_thread(p_contribution_id uuid)
RETURNS TABLE (
  id uuid,
  content text,
  participant_id uuid,
  participant_name text,
  created_at timestamptz,
  status text,
  depth integer
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE thread AS (
    -- Root contribution
    SELECT 
      c.id,
      c.content,
      c.participant_id,
      p.name as participant_name,
      c.created_at,
      c.status,
      0 as depth
    FROM contributions c
    LEFT JOIN participants p ON p.id = c.participant_id
    WHERE c.id = p_contribution_id
    
    UNION ALL
    
    -- Recursive replies
    SELECT 
      c.id,
      c.content,
      c.participant_id,
      p.name as participant_name,
      c.created_at,
      c.status,
      t.depth + 1
    FROM contributions c
    LEFT JOIN participants p ON p.id = c.participant_id
    JOIN thread t ON c.parent_contribution_id = t.id
    WHERE c.status != 'deleted'
  )
  SELECT * FROM thread
  ORDER BY created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get thread count (number of replies)
CREATE OR REPLACE FUNCTION get_thread_count(p_contribution_id uuid)
RETURNS integer AS $$
  SELECT COUNT(*)::integer
  FROM contributions
  WHERE parent_contribution_id = p_contribution_id
    AND status != 'deleted';
$$ LANGUAGE sql STABLE;

-- Update contribution_feed view to include thread info
CREATE OR REPLACE VIEW contribution_feed AS
SELECT 
  c.id,
  c.content,
  c.participant_id,
  c.parent_contribution_id,
  p.name as participant_name,
  c.created_at,
  c.status,
  c.convergence_id,
  conv.name as convergence_name,
  get_thread_count(c.id) as reply_count,
  c.errors
FROM contributions c
LEFT JOIN participants p ON p.id = c.participant_id
LEFT JOIN convergences conv ON conv.id = c.convergence_id
WHERE c.status != 'deleted'
ORDER BY c.created_at DESC;

-- Grant access
GRANT EXECUTE ON FUNCTION get_contribution_thread(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_thread_count(uuid) TO authenticated, anon;
GRANT SELECT ON contribution_feed TO authenticated, anon;
