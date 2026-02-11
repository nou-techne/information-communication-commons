# Channel Data Model

**Sprint 57** — Database schema for channels

## Status

**Deferred to post-ETHBoulder.** Channels are part of the Communication Layer (Cycle 7) — the long-term vision where commons.id becomes a full communication platform replacing Discord. Not critical for Feb 13-16 event since participants contribute via the existing contribution form. The communication layer becomes valuable post-event as the platform evolves from event capture to ongoing discourse.

## Rationale

- **Event priority:** ETHBoulder starts in ~36 hours. Focus on event-critical stability
- **Long-term vision:** Communication layer is Phase 2 of platform evolution (after convergence capture works)
- **Current contribution flow works:** Participants can submit observations without needing channels
- **Post-event value:** After proving convergence capture at ETHBoulder, can build communication layer for ongoing dialogue

## Context: Communication Layer Vision

From `docs/COMMUNICATION_LAYER_SPEC.md`, the long-term vision is:

**commons.id replaces Discord** for human-human, human-agent, and agent-agent communication by integrating:
- **Channels** (topic-based spaces, mapped to dimensions or sessions)
- **Threads** (focused discussions, mapped to artifacts)
- **Messages** (contributions in threaded context)
- **Knowledge graph integration** (every message can extract artifacts)

This transforms the commons from **event capture tool** → **ongoing communication platform with knowledge graph substrate**.

## Database Schema

### channels table

**Core identity layer for communication spaces**

```sql
CREATE TABLE channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convergence_id uuid REFERENCES convergences(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  type text NOT NULL,
  visibility text NOT NULL DEFAULT 'public',
  
  -- Metadata
  icon text,  -- Lucide icon name (optional)
  color text, -- Hex color (optional)
  
  -- Relationships
  dimension_key text,  -- If type='dimension', which dimension
  session_id uuid REFERENCES sessions(id),  -- If type='session'
  parent_channel_id uuid REFERENCES channels(id),  -- Sub-channels
  
  -- Stats
  message_count int DEFAULT 0,
  participant_count int DEFAULT 0,
  last_message_at timestamptz,
  
  -- Ownership & timestamps
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  archived_at timestamptz,
  
  -- Constraints
  CONSTRAINT valid_type CHECK (type IN (
    'general',      -- General discussion
    'dimension',    -- Mapped to e/H-LAM/T dimension
    'session',      -- Mapped to event session
    'topic',        -- Custom topic channel
    'meta'          -- Meta/admin channel
  )),
  
  CONSTRAINT valid_visibility CHECK (visibility IN (
    'public',       -- Anyone can read
    'private',      -- Invite-only
    'unlisted'      -- Not shown in directory but accessible via link
  )),
  
  -- Unique slug per convergence
  CONSTRAINT unique_channel_slug UNIQUE (convergence_id, slug)
);

-- Indexes
CREATE INDEX idx_channels_convergence ON channels(convergence_id) WHERE archived_at IS NULL;
CREATE INDEX idx_channels_type ON channels(type) WHERE archived_at IS NULL;
CREATE INDEX idx_channels_dimension ON channels(dimension_key) WHERE dimension_key IS NOT NULL;
CREATE INDEX idx_channels_session ON channels(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_channels_activity ON channels(last_message_at DESC);
```

### Channel Types

**general** — Default discussion channels
- Example: `#general`, `#introductions`, `#random`
- Not mapped to any specific artifact or dimension

**dimension** — One channel per e/H-LAM/T dimension
- Example: `#human`, `#artifacts`, `#language`
- `dimension_key` → 'hlamt:H', 'hlamt:A', etc.
- Every message in dimension channel gets tagged with that dimension

**session** — One channel per event session
- Example: `#opening-keynote`, `#workshop-rea-patterns`
- `session_id` → links to sessions table
- Session-specific discussion before/during/after

**topic** — Custom topic-based channels
- Example: `#knowledge-graphs`, `#cooperative-economics`, `#regenerative-design`
- Created by participants as needed
- Can be proposed and voted on

**meta** — Administrative/meta channels
- Example: `#announcements`, `#feedback`, `#tech-support`
- Typically read-only or restricted posting

### Channel Membership (Optional Extension)

**For private channels:**

```sql
CREATE TABLE channel_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES channels(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES participants(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  
  joined_at timestamptz DEFAULT now(),
  last_read_at timestamptz,
  notification_level text DEFAULT 'all',
  
  CONSTRAINT valid_role CHECK (role IN ('owner', 'moderator', 'member')),
  CONSTRAINT valid_notification CHECK (notification_level IN ('all', 'mentions', 'none')),
  CONSTRAINT unique_channel_member UNIQUE (channel_id, participant_id)
);

CREATE INDEX idx_channel_members_participant ON channel_members(participant_id);
CREATE INDEX idx_channel_members_channel ON channel_members(channel_id);
```

### Channel Stats View

```sql
CREATE VIEW channel_stats AS
SELECT 
  c.id,
  c.name,
  c.type,
  COUNT(DISTINCT t.id) as thread_count,
  COUNT(DISTINCT m.id) as message_count,
  COUNT(DISTINCT m.participant_id) as participant_count,
  MAX(m.created_at) as last_message_at
FROM channels c
LEFT JOIN threads t ON t.channel_id = c.id
LEFT JOIN messages m ON m.thread_id = t.id
WHERE c.archived_at IS NULL
GROUP BY c.id, c.name, c.type;
```

## Row-Level Security (RLS)

**Public channels:**
```sql
-- Anyone can read public channels
CREATE POLICY channel_read_public ON channels
  FOR SELECT
  USING (visibility = 'public');

-- Authenticated users can create channels (configurable)
CREATE POLICY channel_create ON channels
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Channel owner can update
CREATE POLICY channel_update_owner ON channels
  FOR UPDATE
  USING (created_by = auth.uid());

-- Only owner can archive
CREATE POLICY channel_archive_owner ON channels
  FOR UPDATE
  USING (created_by = auth.uid() AND archived_at IS NULL);
```

**Private channels:**
```sql
-- Can read if member
CREATE POLICY channel_read_private ON channels
  FOR SELECT
  USING (
    visibility = 'private' AND
    EXISTS (
      SELECT 1 FROM channel_members cm
      WHERE cm.channel_id = channels.id
      AND cm.participant_id = auth.uid()
    )
  );
```

## Seed Data

**Default channels for new convergence:**

```sql
-- Function to create default channels when convergence is created
CREATE OR REPLACE FUNCTION create_default_channels(p_convergence_id uuid)
RETURNS void AS $$
BEGIN
  -- General channel
  INSERT INTO channels (convergence_id, name, slug, type, description, visibility)
  VALUES (
    p_convergence_id,
    'General',
    'general',
    'general',
    'General discussion and introductions',
    'public'
  );
  
  -- Dimension channels (e/H-LAM/T)
  INSERT INTO channels (convergence_id, name, slug, type, dimension_key, description, visibility)
  VALUES 
    (p_convergence_id, 'e/ Environment', 'environment', 'dimension', 'hlamt:e', 'Environmental context and place-based discussion', 'public'),
    (p_convergence_id, 'H/ Human', 'human', 'dimension', 'hlamt:H', 'People, relationships, and social dynamics', 'public'),
    (p_convergence_id, 'L/ Language', 'language', 'dimension', 'hlamt:L', 'Communication, terminology, and shared vocabulary', 'public'),
    (p_convergence_id, 'A/ Artifacts', 'artifacts', 'dimension', 'hlamt:A', 'Tools, systems, and produced resources', 'public'),
    (p_convergence_id, 'M/ Methodology', 'methodology', 'dimension', 'hlamt:M', 'Processes, practices, and ways of working', 'public'),
    (p_convergence_id, 'T/ Training', 'training', 'dimension', 'hlamt:T', 'Learning, education, and skill development', 'public');
  
  -- Meta channels
  INSERT INTO channels (convergence_id, name, slug, type, description, visibility)
  VALUES 
    (p_convergence_id, 'Announcements', 'announcements', 'meta', 'Official updates and announcements', 'public'),
    (p_convergence_id, 'Feedback', 'feedback', 'meta', 'Suggestions and feedback about the commons', 'public');
END;
$$ LANGUAGE plpgsql;
```

## Migration

```sql
-- migrations/025_channels.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create channels table
CREATE TABLE channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convergence_id uuid REFERENCES convergences(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  type text NOT NULL,
  visibility text NOT NULL DEFAULT 'public',
  icon text,
  color text,
  dimension_key text,
  session_id uuid REFERENCES sessions(id),
  parent_channel_id uuid REFERENCES channels(id),
  message_count int DEFAULT 0,
  participant_count int DEFAULT 0,
  last_message_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  archived_at timestamptz,
  
  CONSTRAINT valid_type CHECK (type IN ('general', 'dimension', 'session', 'topic', 'meta')),
  CONSTRAINT valid_visibility CHECK (visibility IN ('public', 'private', 'unlisted')),
  CONSTRAINT unique_channel_slug UNIQUE (convergence_id, slug)
);

-- Indexes
CREATE INDEX idx_channels_convergence ON channels(convergence_id) WHERE archived_at IS NULL;
CREATE INDEX idx_channels_type ON channels(type) WHERE archived_at IS NULL;
CREATE INDEX idx_channels_dimension ON channels(dimension_key) WHERE dimension_key IS NOT NULL;
CREATE INDEX idx_channels_session ON channels(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_channels_activity ON channels(last_message_at DESC);

-- RLS
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY channel_read_public ON channels
  FOR SELECT
  USING (visibility = 'public');

CREATE POLICY channel_create ON channels
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY channel_update_owner ON channels
  FOR UPDATE
  USING (created_by = auth.uid());

-- Stats view
CREATE VIEW channel_stats AS
SELECT 
  c.id,
  c.name,
  c.type,
  c.message_count,
  c.participant_count,
  c.last_message_at
FROM channels c
WHERE c.archived_at IS NULL;

-- Default channels function
CREATE OR REPLACE FUNCTION create_default_channels(p_convergence_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO channels (convergence_id, name, slug, type, dimension_key, description, visibility)
  VALUES 
    (p_convergence_id, 'General', 'general', 'general', NULL, 'General discussion', 'public'),
    (p_convergence_id, 'e/ Environment', 'environment', 'dimension', 'hlamt:e', 'Environmental context', 'public'),
    (p_convergence_id, 'H/ Human', 'human', 'dimension', 'hlamt:H', 'People and relationships', 'public'),
    (p_convergence_id, 'L/ Language', 'language', 'dimension', 'hlamt:L', 'Communication and vocabulary', 'public'),
    (p_convergence_id, 'A/ Artifacts', 'artifacts', 'dimension', 'hlamt:A', 'Tools and systems', 'public'),
    (p_convergence_id, 'M/ Methodology', 'methodology', 'dimension', 'hlamt:M', 'Processes and practices', 'public'),
    (p_convergence_id, 'T/ Training', 'training', 'dimension', 'hlamt:T', 'Learning and skill development', 'public'),
    (p_convergence_id, 'Announcements', 'announcements', 'meta', NULL, 'Official updates', 'public'),
    (p_convergence_id, 'Feedback', 'feedback', 'meta', NULL, 'Suggestions and feedback', 'public');
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default channels for new convergences
CREATE OR REPLACE FUNCTION trigger_create_default_channels()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_channels(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER convergence_create_channels
  AFTER INSERT ON convergences
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_default_channels();
```

## API Functions

```sql
-- Get channel list
CREATE OR REPLACE FUNCTION get_channels(p_convergence text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  description text,
  type text,
  message_count int,
  participant_count int,
  last_message_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.slug,
    c.description,
    c.type,
    c.message_count,
    c.participant_count,
    c.last_message_at
  FROM channels c
  JOIN convergences conv ON c.convergence_id = conv.id
  WHERE conv.slug = p_convergence
  AND c.archived_at IS NULL
  AND c.visibility = 'public'
  ORDER BY 
    CASE c.type
      WHEN 'meta' THEN 0
      WHEN 'general' THEN 1
      WHEN 'dimension' THEN 2
      WHEN 'session' THEN 3
      WHEN 'topic' THEN 4
    END,
    c.name;
END;
$$ LANGUAGE plpgsql;

-- Get channel detail
CREATE OR REPLACE FUNCTION get_channel_detail(p_channel_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  description text,
  type text,
  dimension_key text,
  session jsonb,
  thread_count bigint,
  message_count int,
  participant_count int,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.slug,
    c.description,
    c.type,
    c.dimension_key,
    CASE WHEN c.session_id IS NOT NULL THEN
      jsonb_build_object(
        'id', s.id,
        'title', s.title,
        'track', s.track
      )
    ELSE NULL END as session,
    COUNT(DISTINCT t.id) as thread_count,
    c.message_count,
    c.participant_count,
    c.created_at
  FROM channels c
  LEFT JOIN sessions s ON c.session_id = s.id
  LEFT JOIN threads t ON t.channel_id = c.id AND t.status != 'archived'
  WHERE c.id = p_channel_id
  GROUP BY c.id, c.name, c.slug, c.description, c.type, c.dimension_key, c.message_count, c.participant_count, c.created_at, s.id, s.title, s.track;
END;
$$ LANGUAGE plpgsql;
```

## Integration with Existing System

**Relationship to current contribution flow:**

1. **Current:** Contribution form → AI extraction → artifacts
2. **With channels:** Message in channel thread → same AI extraction → artifacts + relationship to thread

**Backward compatibility:**
- Existing contributions table stays as-is
- Messages (Sprint 59) will reference contributions (or vice versa)
- A contribution can optionally be linked to a thread/channel

## UI Implications (Future Sprints)

**Channel list:**
```
Channels
├─ 📢 Announcements
├─ 💬 General
├─ 🌍 e/ Environment
├─ 👥 H/ Human
├─ 📝 L/ Language
├─ 🔧 A/ Artifacts
├─ ⚙️  M/ Methodology
└─ 🎓 T/ Training
```

**Channel detail:**
```
#human · 42 threads · 250 messages

People, relationships, and social dynamics

[Start New Thread]

Recent Threads
└─ Building trust in distributed teams (12 messages, 3h ago)
└─ Role-based vs skill-based organization (8 messages, 5h ago)
└─ Conflict resolution practices (24 messages, 1d ago)
```

## Acceptance Criteria (Deferred)

- [x] Channel data model plan documented
- [ ] Migration 025_channels.sql applied
- [ ] RLS policies enforce visibility rules
- [ ] Default channels created on convergence creation
- [ ] get_channels() and get_channel_detail() RPC functions working
- [ ] Channel types validated by CHECK constraint

**Target completion:** Post-ETHBoulder (Feb 17+), as part of Communication Layer implementation

## Priority

**Medium-High (but deferred).** Communication layer is critical for long-term vision but not for initial event capture. The priority becomes high after:
- ETHBoulder proves convergence capture works
- Platform transitions from event tool to ongoing commons
- Discord replacement becomes active goal

## Notes

This sprint is the foundation of Cycle 7 (Communication Foundation). The channel model provides the container structure for threads (Sprint 58) and messages (Sprint 59).

The key insight: **channels are just another identity layer**, like participants and artifacts. They follow the same Seven Progressive Design Patterns, starting with Identity (Layer 1).

Mapping channels to dimensions creates natural organization: every dimension gets a discussion space, and messages in that channel are automatically tagged with that dimension.

The communication layer doesn't replace contributions — it extends them. A message in a thread is just a contribution with conversational context.
