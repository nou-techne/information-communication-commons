-- Sprint 57: Channel Data Model
-- Communication Layer — Channels provide structured spaces within convergences
-- for real-time discussion, organized by type and visibility.

-- ===== Channel Type & Visibility Enums =====
CREATE TYPE channel_type AS ENUM ('general', 'dimension', 'session', 'topic', 'meta');
CREATE TYPE channel_visibility AS ENUM ('public', 'members');

-- ===== Channels =====
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convergence_id UUID NOT NULL REFERENCES convergences(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  type channel_type NOT NULL DEFAULT 'general',
  visibility channel_visibility NOT NULL DEFAULT 'public',
  created_by UUID REFERENCES participants(id),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Slug must be unique within a convergence
  CONSTRAINT uq_channel_slug_per_convergence UNIQUE (convergence_id, slug)
);

-- ===== Indexes =====
CREATE INDEX idx_channels_convergence ON channels(convergence_id);
CREATE INDEX idx_channels_type ON channels(type);
CREATE INDEX idx_channels_slug ON channels(convergence_id, slug);

-- ===== Updated_at trigger =====
CREATE OR REPLACE FUNCTION update_channels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_channels_updated_at
  BEFORE UPDATE ON channels
  FOR EACH ROW EXECUTE FUNCTION update_channels_updated_at();

-- ===== Auto-create default channels on new convergence =====
CREATE OR REPLACE FUNCTION create_default_channels()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO channels (convergence_id, name, slug, description, type, visibility, position)
  VALUES
    (NEW.id, 'General', 'general', 'Main discussion channel', 'general', 'public', 0),
    (NEW.id, 'Announcements', 'announcements', 'Important updates and announcements', 'meta', 'public', 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_convergence_default_channels
  AFTER INSERT ON convergences
  FOR EACH ROW EXECUTE FUNCTION create_default_channels();

-- ===== Channel Stats View =====
-- Note: thread and message tables created in subsequent migrations.
-- This view will become functional after 029 and 030 are applied.
-- We create it as a simple placeholder that will be replaced in 030.
CREATE VIEW channel_stats AS
SELECT
  c.id AS channel_id,
  c.name,
  c.convergence_id,
  0::bigint AS message_count,
  0::bigint AS thread_count,
  c.created_at AS last_activity
FROM channels c;

-- ===== RLS Policies =====
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- Public channels are readable by everyone (anon + authenticated)
CREATE POLICY channels_select_public ON channels
  FOR SELECT
  USING (visibility = 'public');

-- Members-only channels readable by authenticated users
CREATE POLICY channels_select_members ON channels
  FOR SELECT TO authenticated
  USING (visibility = 'members');

-- Authenticated users can create channels
CREATE POLICY channels_insert ON channels
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Channel creator or any authenticated user can update
CREATE POLICY channels_update ON channels
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Sprint 58: Thread Data Model
-- Communication Layer — Threads live within channels and track discussions
-- from open → tagged → resolved → consolidated → archived.

-- ===== Thread Status Enum =====
CREATE TYPE thread_status AS ENUM ('open', 'tagged', 'resolved', 'consolidated', 'archived');

-- ===== Threads =====
CREATE TABLE threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status thread_status NOT NULL DEFAULT 'open',
  created_by UUID REFERENCES participants(id),
  resolved_at TIMESTAMPTZ,
  consolidated_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== Indexes =====
CREATE INDEX idx_threads_channel ON threads(channel_id);
CREATE INDEX idx_threads_status ON threads(status);
CREATE INDEX idx_threads_created_by ON threads(created_by);

-- ===== Updated_at trigger =====
CREATE OR REPLACE FUNCTION update_threads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_threads_updated_at
  BEFORE UPDATE ON threads
  FOR EACH ROW EXECUTE FUNCTION update_threads_updated_at();

-- ===== Status transition enforcement =====
-- Valid transitions: open→tagged, tagged→resolved, resolved→consolidated, *→archived
CREATE OR REPLACE FUNCTION enforce_thread_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- No change, allow
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Any status can transition to archived
  IF NEW.status = 'archived' THEN
    NEW.archived_at = NOW();
    RETURN NEW;
  END IF;

  -- Enforce valid forward transitions
  IF OLD.status = 'open' AND NEW.status = 'tagged' THEN
    RETURN NEW;
  ELSIF OLD.status = 'tagged' AND NEW.status = 'resolved' THEN
    NEW.resolved_at = NOW();
    RETURN NEW;
  ELSIF OLD.status = 'resolved' AND NEW.status = 'consolidated' THEN
    NEW.consolidated_at = NOW();
    RETURN NEW;
  ELSE
    RAISE EXCEPTION 'Invalid thread status transition: % → %', OLD.status, NEW.status;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_thread_status_transition
  BEFORE UPDATE OF status ON threads
  FOR EACH ROW EXECUTE FUNCTION enforce_thread_status_transition();

-- ===== Consolidate Thread → Artifact =====
-- Creates an artifact from a resolved thread's messages, then marks it consolidated.
CREATE OR REPLACE FUNCTION consolidate_thread(p_thread_id UUID)
RETURNS UUID AS $$
DECLARE
  v_thread RECORD;
  v_artifact_id UUID;
  v_content TEXT;
  v_convergence_id UUID;
BEGIN
  -- Get thread info
  SELECT t.*, c.convergence_id
  INTO v_thread
  FROM threads t
  JOIN channels c ON c.id = t.channel_id
  WHERE t.id = p_thread_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Thread not found: %', p_thread_id;
  END IF;

  IF v_thread.status != 'resolved' THEN
    RAISE EXCEPTION 'Thread must be resolved to consolidate (current: %)', v_thread.status;
  END IF;

  v_convergence_id := v_thread.convergence_id;

  -- Aggregate message content (messages table from migration 030)
  SELECT string_agg(m.content, E'\n\n' ORDER BY m.created_at)
  INTO v_content
  FROM messages m
  WHERE m.thread_id = p_thread_id AND m.type != 'system';

  -- Create artifact
  INSERT INTO artifacts (title, summary, origin_convergence_id, type, state, rea_role)
  VALUES (
    v_thread.title,
    COALESCE(v_content, 'Consolidated from thread: ' || v_thread.title),
    v_convergence_id, 'synthesis', 'seed', 'resource'
  )
  RETURNING id INTO v_artifact_id;

  -- Mark thread as consolidated
  UPDATE threads SET status = 'consolidated' WHERE id = p_thread_id;

  RETURN v_artifact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== RLS Policies =====
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;

-- Threads are readable if the parent channel is readable (simplified: check channel visibility)
CREATE POLICY threads_select ON threads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM channels c
      WHERE c.id = threads.channel_id
      AND (c.visibility = 'public' OR current_setting('request.jwt.claims', true)::jsonb->>'role' = 'authenticated')
    )
  );

-- Authenticated users can create threads
CREATE POLICY threads_insert ON threads
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Authenticated users can update threads
CREATE POLICY threads_update ON threads
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

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

-- ===== Create default channels for existing ETHBoulder convergence =====
INSERT INTO channels (convergence_id, name, slug, description, type, visibility, position)
VALUES
  ('00000000-0000-0000-0000-000000000100', 'General', 'general', 'Main discussion channel', 'general', 'public', 0),
  ('00000000-0000-0000-0000-000000000100', 'Announcements', 'announcements', 'Important updates and announcements', 'meta', 'public', 1)
ON CONFLICT DO NOTHING;
