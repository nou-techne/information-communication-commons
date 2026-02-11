# Thread Data Model

**Sprint 58** — Database schema for threads

## Status

**Deferred to post-ETHBoulder.** Threads are the second layer of the Communication Foundation (Cycle 7) — focused discussions within channels. Part of the long-term vision where commons.id becomes a full communication platform. Not critical for Feb 13-16 event since participants contribute via the existing contribution form. Threads become valuable post-event as the platform evolves from event capture to ongoing discourse.

## Rationale

- **Event priority:** ETHBoulder starts in ~36 hours. Focus on event-critical stability
- **Long-term vision:** Communication layer is Phase 2 of platform evolution
- **Dependency:** Threads depend on Sprint 57 (Channel Data Model)
- **Current contribution flow works:** Participants can submit observations without threaded discussion
- **Post-event value:** After proving convergence capture, threads enable focused ongoing dialogue

## Context: Thread Lifecycle

Threads have a defined lifecycle that mirrors knowledge work maturation:

1. **open** — Active discussion, collecting messages
2. **tagged** — Categorized with artifact tags, still accepting messages
3. **resolved** — Conclusion reached, optionally consolidated into artifact
4. **consolidated** — Thread content extracted into one or more artifacts
5. **archived** — Closed to new messages, preserved for reference

This lifecycle supports the transformation from **conversation → artifact** that is central to the commons model.

## Database Schema

### threads table

**Identity + relationship layer for focused discussions**

```sql
CREATE TABLE threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  
  -- Content
  title text NOT NULL,
  description text,  -- Optional thread summary/question
  
  -- Lifecycle
  status text NOT NULL DEFAULT 'open',
  resolution_summary text,  -- Summary when resolved
  
  -- Relationships
  artifact_id uuid REFERENCES artifacts(id),  -- If consolidated to artifact
  parent_thread_id uuid REFERENCES threads(id),  -- For sub-threads
  
  -- Stats
  message_count int DEFAULT 0,
  participant_count int DEFAULT 0,
  last_message_at timestamptz,
  
  -- Metadata
  tags text[],  -- Topic tags
  pinned boolean DEFAULT false,
  locked boolean DEFAULT false,  -- Prevents new messages
  
  -- Ownership & timestamps
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN (
    'open',          -- Active discussion
    'tagged',        -- Categorized but still open
    'resolved',      -- Conclusion reached
    'consolidated',  -- Converted to artifact(s)
    'archived'       -- Closed, read-only
  )),
  
  CONSTRAINT resolved_at_consistency CHECK (
    (status IN ('resolved', 'consolidated', 'archived') AND resolved_at IS NOT NULL)
    OR (status NOT IN ('resolved', 'consolidated', 'archived') AND resolved_at IS NULL)
  ),
  
  CONSTRAINT consolidated_artifact CHECK (
    (status = 'consolidated' AND artifact_id IS NOT NULL)
    OR (status != 'consolidated')
  )
);

-- Indexes
CREATE INDEX idx_threads_channel ON threads(channel_id) WHERE status != 'archived';
CREATE INDEX idx_threads_status ON threads(status);
CREATE INDEX idx_threads_artifact ON threads(artifact_id) WHERE artifact_id IS NOT NULL;
CREATE INDEX idx_threads_activity ON threads(last_message_at DESC);
CREATE INDEX idx_threads_pinned ON threads(pinned) WHERE pinned = true;
CREATE INDEX idx_threads_tags ON threads USING gin(tags);
```

### Thread Participants (Derived)

**Track who has participated in a thread:**

```sql
CREATE VIEW thread_participants AS
SELECT 
  t.id as thread_id,
  m.author_id as participant_id,
  COUNT(m.id) as message_count,
  MIN(m.created_at) as first_message_at,
  MAX(m.created_at) as last_message_at
FROM threads t
JOIN messages m ON m.thread_id = t.id
WHERE m.author_id IS NOT NULL
GROUP BY t.id, m.author_id;
```

### Thread Tags

**Many-to-many relationship with artifact tags:**

```sql
-- Optional: Normalize tags into separate table
CREATE TABLE thread_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid REFERENCES threads(id) ON DELETE CASCADE,
  tag text NOT NULL,
  added_by uuid REFERENCES auth.users(id),
  added_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_thread_tag UNIQUE (thread_id, tag)
);

CREATE INDEX idx_thread_tags_tag ON thread_tags(tag);
CREATE INDEX idx_thread_tags_thread ON thread_tags(thread_id);
```

### Thread Stats View

```sql
CREATE VIEW thread_stats AS
SELECT 
  t.id,
  t.title,
  t.status,
  t.channel_id,
  c.name as channel_name,
  COUNT(DISTINCT m.id) as message_count,
  COUNT(DISTINCT m.author_id) as participant_count,
  MAX(m.created_at) as last_message_at,
  t.created_at,
  t.resolved_at,
  CASE 
    WHEN t.artifact_id IS NOT NULL THEN jsonb_build_object(
      'id', a.id,
      'title', a.title,
      'type', a.type
    )
    ELSE NULL
  END as artifact
FROM threads t
JOIN channels c ON t.channel_id = c.id
LEFT JOIN messages m ON m.thread_id = t.id
LEFT JOIN artifacts a ON t.artifact_id = a.id
GROUP BY t.id, t.title, t.status, t.channel_id, c.name, t.created_at, t.resolved_at, t.artifact_id, a.id, a.title, a.type;
```

## Thread Lifecycle Management

### State Transitions

```sql
-- Function to transition thread to new status
CREATE OR REPLACE FUNCTION transition_thread_status(
  p_thread_id uuid,
  p_new_status text,
  p_resolution_summary text DEFAULT NULL,
  p_artifact_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  current_status text;
BEGIN
  -- Get current status
  SELECT status INTO current_status
  FROM threads
  WHERE id = p_thread_id;
  
  -- Validate transition
  IF current_status = 'archived' THEN
    RAISE EXCEPTION 'Cannot transition archived thread';
  END IF;
  
  -- Update thread
  UPDATE threads
  SET 
    status = p_new_status,
    updated_at = now(),
    resolved_at = CASE 
      WHEN p_new_status IN ('resolved', 'consolidated', 'archived') 
      THEN COALESCE(resolved_at, now())
      ELSE NULL
    END,
    resolved_by = CASE
      WHEN p_new_status IN ('resolved', 'consolidated', 'archived')
      THEN COALESCE(resolved_by, auth.uid())
      ELSE NULL
    END,
    resolution_summary = COALESCE(p_resolution_summary, resolution_summary),
    artifact_id = COALESCE(p_artifact_id, artifact_id)
  WHERE id = p_thread_id;
END;
$$ LANGUAGE plpgsql;
```

### Auto-tagging from Messages

```sql
-- Function to extract tags from thread messages
CREATE OR REPLACE FUNCTION auto_tag_thread(p_thread_id uuid)
RETURNS void AS $$
DECLARE
  extracted_tags text[];
BEGIN
  -- Extract common keywords from thread messages
  SELECT array_agg(DISTINCT word)
  INTO extracted_tags
  FROM (
    SELECT unnest(regexp_split_to_array(lower(content), '\s+')) as word
    FROM messages
    WHERE thread_id = p_thread_id
    AND content IS NOT NULL
  ) words
  WHERE length(word) > 4  -- Meaningful words only
  AND word NOT IN ('about', 'their', 'would', 'could', 'should')  -- Stop words
  GROUP BY word
  HAVING count(*) > 2  -- Appears multiple times
  LIMIT 10;
  
  -- Update thread tags
  UPDATE threads
  SET tags = extracted_tags
  WHERE id = p_thread_id;
END;
$$ LANGUAGE plpgsql;
```

### Consolidation to Artifact

```sql
-- Function to consolidate thread into artifact
CREATE OR REPLACE FUNCTION consolidate_thread(
  p_thread_id uuid,
  p_artifact_type text DEFAULT 'synthesis'
)
RETURNS uuid AS $$
DECLARE
  v_thread threads%ROWTYPE;
  v_artifact_id uuid;
  v_consolidated_content text;
BEGIN
  -- Get thread
  SELECT * INTO v_thread
  FROM threads
  WHERE id = p_thread_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Thread not found';
  END IF;
  
  -- Build consolidated content from thread messages
  SELECT string_agg(
    format('[%s] %s: %s', 
      to_char(created_at, 'YYYY-MM-DD HH24:MI'),
      p.name,
      content
    ),
    E'\n\n'
    ORDER BY created_at
  )
  INTO v_consolidated_content
  FROM messages m
  JOIN participants p ON m.author_id = p.id
  WHERE m.thread_id = p_thread_id;
  
  -- Create artifact
  INSERT INTO artifacts (
    convergence_id,
    title,
    body,
    summary,
    type,
    state,
    rea_role,
    steward_id,
    created_at
  )
  SELECT
    c.convergence_id,
    v_thread.title,
    v_consolidated_content,
    v_thread.resolution_summary,
    p_artifact_type,
    'active',
    'event',  -- Thread consolidation is an event
    v_thread.created_by,
    now()
  FROM channels c
  WHERE c.id = v_thread.channel_id
  RETURNING id INTO v_artifact_id;
  
  -- Link thread to artifact and mark consolidated
  UPDATE threads
  SET 
    status = 'consolidated',
    artifact_id = v_artifact_id,
    resolved_at = now(),
    resolved_by = auth.uid()
  WHERE id = p_thread_id;
  
  RETURN v_artifact_id;
END;
$$ LANGUAGE plpgsql;
```

## Row-Level Security (RLS)

```sql
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;

-- Read: Can read threads in channels you can read
CREATE POLICY thread_read ON threads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM channels c
      WHERE c.id = threads.channel_id
      AND (
        c.visibility = 'public'
        OR EXISTS (
          SELECT 1 FROM channel_members cm
          WHERE cm.channel_id = c.id
          AND cm.participant_id = auth.uid()
        )
      )
    )
  );

-- Create: Can create threads in channels you're a member of
CREATE POLICY thread_create ON threads
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM channels c
      WHERE c.id = threads.channel_id
      AND (c.visibility = 'public' OR c.created_by = auth.uid())
    )
  );

-- Update: Thread creator or channel moderators
CREATE POLICY thread_update ON threads
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM channel_members cm
      WHERE cm.channel_id = threads.channel_id
      AND cm.participant_id = auth.uid()
      AND cm.role IN ('owner', 'moderator')
    )
  );

-- Delete: Only thread creator or channel owner
CREATE POLICY thread_delete ON threads
  FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM channel_members cm
      JOIN channels c ON c.id = cm.channel_id
      WHERE c.id = threads.channel_id
      AND cm.participant_id = auth.uid()
      AND cm.role = 'owner'
    )
  );
```

## Migration

```sql
-- migrations/026_threads.sql

CREATE TABLE threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open',
  resolution_summary text,
  artifact_id uuid REFERENCES artifacts(id),
  parent_thread_id uuid REFERENCES threads(id),
  message_count int DEFAULT 0,
  participant_count int DEFAULT 0,
  last_message_at timestamptz,
  tags text[],
  pinned boolean DEFAULT false,
  locked boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  
  CONSTRAINT valid_status CHECK (status IN ('open', 'tagged', 'resolved', 'consolidated', 'archived')),
  CONSTRAINT resolved_at_consistency CHECK (
    (status IN ('resolved', 'consolidated', 'archived') AND resolved_at IS NOT NULL)
    OR (status NOT IN ('resolved', 'consolidated', 'archived') AND resolved_at IS NULL)
  ),
  CONSTRAINT consolidated_artifact CHECK (
    (status = 'consolidated' AND artifact_id IS NOT NULL) OR (status != 'consolidated')
  )
);

-- Indexes
CREATE INDEX idx_threads_channel ON threads(channel_id) WHERE status != 'archived';
CREATE INDEX idx_threads_status ON threads(status);
CREATE INDEX idx_threads_artifact ON threads(artifact_id) WHERE artifact_id IS NOT NULL;
CREATE INDEX idx_threads_activity ON threads(last_message_at DESC);
CREATE INDEX idx_threads_pinned ON threads(pinned) WHERE pinned = true;
CREATE INDEX idx_threads_tags ON threads USING gin(tags);

-- RLS
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY thread_read ON threads FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM channels c
    WHERE c.id = threads.channel_id AND c.visibility = 'public'
  )
);

CREATE POLICY thread_create ON threads FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

CREATE POLICY thread_update ON threads FOR UPDATE USING (
  created_by = auth.uid()
);

-- Views
CREATE VIEW thread_stats AS
SELECT 
  t.id,
  t.title,
  t.status,
  t.message_count,
  t.participant_count,
  t.last_message_at,
  t.created_at
FROM threads t;

-- Functions
CREATE OR REPLACE FUNCTION transition_thread_status(
  p_thread_id uuid,
  p_new_status text,
  p_resolution_summary text DEFAULT NULL,
  p_artifact_id uuid DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE threads
  SET 
    status = p_new_status,
    updated_at = now(),
    resolved_at = CASE WHEN p_new_status IN ('resolved', 'consolidated', 'archived') THEN COALESCE(resolved_at, now()) ELSE NULL END,
    resolved_by = CASE WHEN p_new_status IN ('resolved', 'consolidated', 'archived') THEN COALESCE(resolved_by, auth.uid()) ELSE NULL END,
    resolution_summary = COALESCE(p_resolution_summary, resolution_summary),
    artifact_id = COALESCE(p_artifact_id, artifact_id)
  WHERE id = p_thread_id;
END;
$$ LANGUAGE plpgsql;
```

## API Functions

```sql
-- Get threads for channel
CREATE OR REPLACE FUNCTION get_channel_threads(
  p_channel_id uuid,
  p_status text DEFAULT NULL,
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  status text,
  message_count int,
  participant_count int,
  last_message_at timestamptz,
  created_by jsonb,
  created_at timestamptz,
  pinned boolean,
  tags text[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    t.status,
    t.message_count,
    t.participant_count,
    t.last_message_at,
    jsonb_build_object('id', p.id, 'name', p.name) as created_by,
    t.created_at,
    t.pinned,
    t.tags
  FROM threads t
  JOIN participants p ON t.created_by = p.auth_user_id
  WHERE t.channel_id = p_channel_id
  AND (p_status IS NULL OR t.status = p_status)
  AND t.status != 'archived'
  ORDER BY 
    t.pinned DESC,
    t.last_message_at DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get thread detail
CREATE OR REPLACE FUNCTION get_thread_detail(p_thread_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  status text,
  resolution_summary text,
  channel jsonb,
  artifact jsonb,
  message_count int,
  participant_count int,
  created_by jsonb,
  created_at timestamptz,
  resolved_at timestamptz,
  tags text[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    t.status,
    t.resolution_summary,
    jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug) as channel,
    CASE WHEN t.artifact_id IS NOT NULL THEN
      jsonb_build_object('id', a.id, 'title', a.title, 'type', a.type)
    ELSE NULL END as artifact,
    t.message_count,
    t.participant_count,
    jsonb_build_object('id', p.id, 'name', p.name) as created_by,
    t.created_at,
    t.resolved_at,
    t.tags
  FROM threads t
  JOIN channels c ON t.channel_id = c.id
  JOIN participants p ON t.created_by = p.auth_user_id
  LEFT JOIN artifacts a ON t.artifact_id = a.id
  WHERE t.id = p_thread_id;
END;
$$ LANGUAGE plpgsql;
```

## Integration with Existing System

**Relationship to contributions:**

- **Option A:** Messages (Sprint 59) link to contributions
  - Thread message → creates contribution → AI extraction → artifacts
  - Preserves existing contribution flow
  
- **Option B:** Contributions can optionally link to threads
  - Contribution has `thread_id` column (nullable)
  - Backward compatible with existing contributions

**Recommended:** Option A — messages create contributions, maintaining single extraction pipeline.

## UI Implications (Future Sprints)

**Thread list in channel:**
```
#human

[New Thread]

📌 Building trust in distributed teams (12 messages, 3h ago)
   Alice, Bob, Charlie + 2 more

⭐ Role-based vs skill-based organization (8 messages, 5h ago) [tagged]
   Bob, David

✓ Conflict resolution practices (24 messages, 1d ago) [resolved]
   → Consolidated to artifact: "Pattern: Restorative Practices"
```

**Thread detail:**
```
Building trust in distributed teams
#human · open · 12 messages

Alice · 3h ago
Trust emerges from repeated interactions and transparent...

Bob · 2h ago
I've seen this work in practice when teams...

[Reply]
```

## Acceptance Criteria (Deferred)

- [x] Thread data model plan documented
- [ ] Migration 026_threads.sql applied
- [ ] Thread lifecycle states enforced by CHECK constraint
- [ ] RLS policies enforce channel-based access
- [ ] transition_thread_status() function working
- [ ] consolidate_thread() function creates artifacts from threads
- [ ] get_channel_threads() and get_thread_detail() RPC functions working

**Target completion:** Post-ETHBoulder (Feb 17+), after Sprint 57 (Channel Data Model)

## Priority

**Medium-High (but deferred).** Threads are essential for Communication Layer but not for initial event capture. Priority increases when:
- Channels are implemented (Sprint 57)
- Platform transitions from event tool to ongoing commons
- Need for focused, structured discussions becomes clear

## Notes

This sprint demonstrates the **conversation → artifact** transformation that is central to the commons model. Threads provide the container for discussion that eventually consolidates into reusable knowledge artifacts.

The lifecycle states (open → tagged → resolved → consolidated → archived) mirror how knowledge matures in communities: from open question to categorized discussion to synthesized understanding to preserved wisdom.

The `consolidate_thread()` function is the key innovation: it takes a thread's messages and generates an artifact, preserving both the discussion (thread remains) and the distilled knowledge (artifact).

This makes threads more than just conversations — they're knowledge-in-progress, with a clear path to becoming permanent artifacts in the graph.
