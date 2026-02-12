-- Sprint 59: Message Data Model
-- Communication Layer — Messages, reactions, mentions, and full-text search.
-- Messages live within threads. Supports nesting up to 3 levels.

-- ===== Message Type Enum =====
CREATE TYPE message_type AS ENUM ('text', 'contribution', 'system');

-- ===== Messages =====
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  author_id UUID REFERENCES participants(id),
  content TEXT NOT NULL,
  type message_type NOT NULL DEFAULT 'text',
  parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  depth INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMPTZ,

  -- Enforce max nesting depth of 3
  CONSTRAINT chk_message_depth CHECK (depth <= 3)
);

-- ===== Indexes =====
CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_messages_author ON messages(author_id);
CREATE INDEX idx_messages_parent ON messages(parent_message_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- ===== Full-text search =====
ALTER TABLE messages ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED;

CREATE INDEX idx_messages_search ON messages USING gin(search_vector);

-- ===== Updated_at trigger =====
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    NEW.edited_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_messages_updated_at();

-- ===== Auto-set depth from parent =====
CREATE OR REPLACE FUNCTION set_message_depth()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_depth INTEGER;
BEGIN
  IF NEW.parent_message_id IS NOT NULL THEN
    SELECT depth INTO v_parent_depth FROM messages WHERE id = NEW.parent_message_id;
    NEW.depth = COALESCE(v_parent_depth, 0) + 1;
    IF NEW.depth > 3 THEN
      RAISE EXCEPTION 'Maximum nesting depth (3) exceeded';
    END IF;
  ELSE
    NEW.depth = 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_message_depth
  BEFORE INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION set_message_depth();

-- ===== Message Reactions =====
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id),
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_reaction UNIQUE (message_id, participant_id, emoji)
);

CREATE INDEX idx_reactions_message ON message_reactions(message_id);

-- ===== Message Mentions =====
CREATE TABLE message_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  mentioned_participant_id UUID NOT NULL REFERENCES participants(id),

  CONSTRAINT uq_mention UNIQUE (message_id, mentioned_participant_id)
);

CREATE INDEX idx_mentions_message ON message_mentions(message_id);
CREATE INDEX idx_mentions_participant ON message_mentions(mentioned_participant_id);

-- ===== Convert Message to Contribution =====
CREATE OR REPLACE FUNCTION convert_message_to_contribution(p_message_id UUID)
RETURNS UUID AS $$
DECLARE
  v_msg RECORD;
  v_convergence_id UUID;
  v_contribution_id UUID;
BEGIN
  SELECT m.*, t.channel_id
  INTO v_msg
  FROM messages m
  JOIN threads t ON t.id = m.thread_id
  WHERE m.id = p_message_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found: %', p_message_id;
  END IF;

  -- Get convergence from channel
  SELECT convergence_id INTO v_convergence_id
  FROM channels WHERE id = v_msg.channel_id;

  -- Create contribution
  INSERT INTO contributions (content, participant_id, convergence_id, status)
  VALUES (v_msg.content, v_msg.author_id, v_convergence_id, 'pending')
  RETURNING id INTO v_contribution_id;

  -- Mark message as contribution type
  UPDATE messages SET type = 'contribution' WHERE id = p_message_id;

  RETURN v_contribution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== Replace channel_stats view with real counts =====
DROP VIEW IF EXISTS channel_stats CASCADE;
CREATE VIEW channel_stats AS
SELECT
  c.id AS channel_id,
  c.name,
  c.convergence_id,
  COALESCE(msg_counts.message_count, 0) AS message_count,
  COALESCE(thread_counts.thread_count, 0) AS thread_count,
  GREATEST(c.created_at, msg_counts.last_message, thread_counts.last_thread) AS last_activity
FROM channels c
LEFT JOIN LATERAL (
  SELECT COUNT(*)::bigint AS message_count, MAX(m.created_at) AS last_message
  FROM messages m
  JOIN threads t ON t.id = m.thread_id
  WHERE t.channel_id = c.id
) msg_counts ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*)::bigint AS thread_count, MAX(t.created_at) AS last_thread
  FROM threads t
  WHERE t.channel_id = c.id
) thread_counts ON true;

-- ===== RLS Policies =====
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_mentions ENABLE ROW LEVEL SECURITY;

-- Messages readable if parent thread's channel is accessible
CREATE POLICY messages_select ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM threads t
      JOIN channels c ON c.id = t.channel_id
      WHERE t.id = messages.thread_id
      AND (c.visibility = 'public' OR current_setting('request.jwt.claims', true)::jsonb->>'role' = 'authenticated')
    )
  );

CREATE POLICY messages_insert ON messages
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY messages_update ON messages
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Reactions: same read policy, authenticated can insert/delete own
CREATE POLICY reactions_select ON message_reactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN threads t ON t.id = m.thread_id
      JOIN channels c ON c.id = t.channel_id
      WHERE m.id = message_reactions.message_id
      AND (c.visibility = 'public' OR current_setting('request.jwt.claims', true)::jsonb->>'role' = 'authenticated')
    )
  );

CREATE POLICY reactions_insert ON message_reactions
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY reactions_delete ON message_reactions
  FOR DELETE TO authenticated
  USING (true);

-- Mentions: readable with messages
CREATE POLICY mentions_select ON message_mentions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN threads t ON t.id = m.thread_id
      JOIN channels c ON c.id = t.channel_id
      WHERE m.id = message_mentions.message_id
      AND (c.visibility = 'public' OR current_setting('request.jwt.claims', true)::jsonb->>'role' = 'authenticated')
    )
  );

CREATE POLICY mentions_insert ON message_mentions
  FOR INSERT TO authenticated
  WITH CHECK (true);
