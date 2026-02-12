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
