-- Sprint 69: Thread Tagging System
-- Workflow Engineer — Enable tagging threads with dimensions, topics, artifact types
-- Tags make threads discoverable and help with filtering/clustering

-- ===== Tag Types =====
CREATE TYPE tag_type AS ENUM ('dimension', 'topic', 'artifact_type', 'custom');

-- ===== Thread Tags =====
CREATE TABLE thread_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  tag_type tag_type NOT NULL DEFAULT 'custom',
  tag_value TEXT NOT NULL, -- e.g., "human" (dimension), "AI" (topic), "tool" (artifact type), "urgent" (custom)
  created_by UUID REFERENCES participants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: same tag can't be applied twice to same thread
  UNIQUE (thread_id, tag_type, tag_value)
);

-- ===== Indexes =====
CREATE INDEX idx_thread_tags_thread ON thread_tags(thread_id);
CREATE INDEX idx_thread_tags_type_value ON thread_tags(tag_type, tag_value);

-- ===== Tag Suggestions (Auto-suggest from content) =====
-- Analyze thread + messages to suggest relevant tags
-- Uses message content, existing artifacts, and dimension distribution
CREATE OR REPLACE FUNCTION suggest_thread_tags(p_thread_id UUID)
RETURNS TABLE (
  tag_type tag_type,
  tag_value TEXT,
  confidence FLOAT
) AS $$
BEGIN
  -- Suggest dimensions based on message content matching dimension patterns
  RETURN QUERY
  SELECT 
    'dimension'::tag_type,
    d.name,
    COUNT(*)::FLOAT / (SELECT COUNT(*) FROM messages WHERE thread_id = p_thread_id)::FLOAT AS confidence
  FROM messages m
  CROSS JOIN dimensions d
  WHERE m.thread_id = p_thread_id
    AND m.type != 'system'
    AND (
      m.content ILIKE '%' || d.name || '%' 
      OR m.content ILIKE '%' || d.description || '%'
    )
  GROUP BY d.name
  HAVING COUNT(*) >= 2 -- At least 2 messages mention this dimension
  ORDER BY confidence DESC
  LIMIT 3;

  -- Suggest artifact types based on keywords in thread
  RETURN QUERY
  SELECT 
    'artifact_type'::tag_type,
    type_name,
    0.5::FLOAT AS confidence
  FROM (
    SELECT UNNEST(ARRAY['tool', 'framework', 'method', 'artifact', 'document', 'resource']) AS type_name
  ) types
  WHERE EXISTS (
    SELECT 1 FROM messages m
    WHERE m.thread_id = p_thread_id
      AND m.type != 'system'
      AND m.content ILIKE '%' || type_name || '%'
  );

  -- Suggest topics based on common patterns (AI, governance, design, etc.)
  RETURN QUERY
  SELECT 
    'topic'::tag_type,
    topic_name,
    0.6::FLOAT AS confidence
  FROM (
    SELECT UNNEST(ARRAY['AI', 'governance', 'design', 'infrastructure', 'coordination', 'economics']) AS topic_name
  ) topics
  WHERE EXISTS (
    SELECT 1 FROM messages m
    WHERE m.thread_id = p_thread_id
      AND m.type != 'system'
      AND m.content ILIKE '%' || topic_name || '%'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== Helper: Add Tag to Thread =====
CREATE OR REPLACE FUNCTION add_thread_tag(
  p_thread_id UUID,
  p_tag_type tag_type,
  p_tag_value TEXT,
  p_participant_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_tag_id UUID;
BEGIN
  INSERT INTO thread_tags (thread_id, tag_type, tag_value, created_by)
  VALUES (p_thread_id, p_tag_type, p_tag_value, p_participant_id)
  ON CONFLICT (thread_id, tag_type, tag_value) DO NOTHING
  RETURNING id INTO v_tag_id;
  
  RETURN v_tag_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== Helper: Remove Tag from Thread =====
CREATE OR REPLACE FUNCTION remove_thread_tag(
  p_thread_id UUID,
  p_tag_type tag_type,
  p_tag_value TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM thread_tags
  WHERE thread_id = p_thread_id
    AND tag_type = p_tag_type
    AND tag_value = p_tag_value;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== Tag Counts View =====
-- Show popular tags across all threads
CREATE OR REPLACE VIEW thread_tag_counts AS
SELECT 
  tag_type,
  tag_value,
  COUNT(*) as usage_count,
  COUNT(DISTINCT thread_id) as thread_count
FROM thread_tags
GROUP BY tag_type, tag_value
ORDER BY usage_count DESC;

-- ===== RLS Policies =====
ALTER TABLE thread_tags ENABLE ROW LEVEL SECURITY;

-- Tags are readable if the thread is readable
CREATE POLICY thread_tags_select ON thread_tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM threads t
      JOIN channels c ON c.id = t.channel_id
      WHERE t.id = thread_tags.thread_id
        AND (c.visibility = 'public' OR current_setting('request.jwt.claims', true)::jsonb->>'role' = 'authenticated')
    )
  );

-- Authenticated users can add tags to any thread
CREATE POLICY thread_tags_insert ON thread_tags
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Users can delete tags they created, or any tag if they're a moderator
CREATE POLICY thread_tags_delete ON thread_tags
  FOR DELETE TO authenticated
  USING (
    created_by = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::uuid
    -- Future: OR user_is_moderator()
  );

-- ===== Update threads table to show tag count =====
-- Add a computed column for quick tag count display
ALTER TABLE threads ADD COLUMN tag_count INTEGER GENERATED ALWAYS AS (
  (SELECT COUNT(*) FROM thread_tags WHERE thread_id = threads.id)
) STORED;
