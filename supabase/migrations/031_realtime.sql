-- Sprint 60: Real-Time Subscription Architecture
-- Enables Supabase Realtime on communication tables and adds presence/typing support.
--
-- === Subscription Topology ===
-- Clients subscribe to channels via Supabase Realtime:
--
--   1. Channel-level: postgres_changes on channels table (INSERT/UPDATE/DELETE)
--      Filter: convergence_id=eq.<id>
--      Use: channel list updates, new channels appearing
--
--   2. Thread-level: postgres_changes on threads table (INSERT/UPDATE)
--      Filter: channel_id=eq.<id>
--      Use: new threads, status changes in current channel
--
--   3. Message-level: postgres_changes on messages table (INSERT/UPDATE)
--      Filter: thread_id=eq.<id>
--      Use: live chat within a thread
--
--   4. Presence: Supabase Presence on channel:<channel_id>
--      Use: who's online in a channel
--
--   5. Typing: postgres_changes on typing_indicators (INSERT/DELETE)
--      Filter: channel_id=eq.<id>
--      Use: "X is typing..." indicators
--
-- Clients should subscribe to (1) globally per convergence, (2) per active channel,
-- and (3) per active thread. Presence and typing are per-channel.

-- ===== Enable Realtime on communication tables =====
-- Supabase uses the supabase_realtime publication for change events.
-- Add our new tables to it.

DO $$
BEGIN
  -- Add tables to supabase_realtime publication if not already members
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'channels'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE channels;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'threads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE threads;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'message_reactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
  END IF;
END $$;

-- ===== Typing Indicators =====
-- Ephemeral table for "X is typing..." UI. Rows auto-expire after 5 seconds.
CREATE TABLE typing_indicators (
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (channel_id, participant_id)
);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;

-- ===== Auto-expire typing indicators =====
-- Function to clean up stale typing indicators (older than 5 seconds)
CREATE OR REPLACE FUNCTION clean_stale_typing_indicators()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM typing_indicators
  WHERE started_at < NOW() - INTERVAL '5 seconds';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Clean stale entries on every insert (lightweight since table is tiny)
CREATE TRIGGER trg_clean_typing
  AFTER INSERT ON typing_indicators
  FOR EACH STATEMENT EXECUTE FUNCTION clean_stale_typing_indicators();

-- ===== Upsert typing indicator =====
-- Call this to signal typing; refreshes the timestamp if already present.
CREATE OR REPLACE FUNCTION upsert_typing(p_channel_id UUID, p_participant_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO typing_indicators (channel_id, participant_id, started_at)
  VALUES (p_channel_id, p_participant_id, NOW())
  ON CONFLICT (channel_id, participant_id)
  DO UPDATE SET started_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== Clear typing indicator =====
CREATE OR REPLACE FUNCTION clear_typing(p_channel_id UUID, p_participant_id UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators
  WHERE channel_id = p_channel_id AND participant_id = p_participant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== RLS for typing_indicators =====
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY typing_select ON typing_indicators
  FOR SELECT
  USING (true);

CREATE POLICY typing_insert ON typing_indicators
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY typing_delete ON typing_indicators
  FOR DELETE TO authenticated
  USING (true);

-- ===== Presence Note =====
-- Supabase Presence is handled client-side via supabase.channel('channel:<id>').track().
-- No server-side table needed — Supabase manages presence state in-memory.
-- Clients join: supabase.channel('channel:<channel_id>').on('presence', { event: 'sync' }, callback).subscribe()
