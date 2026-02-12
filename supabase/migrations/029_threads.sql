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
  INSERT INTO artifacts (name, description, convergence_id)
  VALUES (
    v_thread.title,
    COALESCE(v_content, 'Consolidated from thread: ' || v_thread.title),
    v_convergence_id
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
