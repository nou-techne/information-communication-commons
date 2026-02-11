# Message Data Model

**Sprint 59** — Database schema for messages

## Status

**Deferred to post-ETHBoulder.** Messages are the third layer of the Communication Foundation (Cycle 7) — the actual content exchanged in threaded discussions. Part of the long-term vision where commons.id becomes a full communication platform. Not critical for Feb 13-16 event since participants contribute via the existing contribution form. Messages become valuable post-event as the platform evolves from event capture to ongoing discourse.

## Rationale

- **Event priority:** ETHBoulder starts in ~36 hours. Focus on event-critical stability
- **Long-term vision:** Communication layer is Phase 2 of platform evolution
- **Dependencies:** Messages depend on Sprint 57 (Channels) and Sprint 58 (Threads)
- **Current contribution flow works:** Participants can submit observations without messaging
- **Post-event value:** After proving convergence capture, messages enable real-time dialogue

## Context: Messages vs Contributions

The relationship between messages and contributions is crucial:

**Messages** = conversational units in a thread  
**Contributions** = knowledge extraction units processed by AI

**Integration approach:**
- Every message CAN become a contribution (if it contains extractable knowledge)
- Messages with `type='contribution'` link to contributions table
- Messages with `type='text'` are pure conversation (no extraction)
- Messages with `type='system'` are automated notifications

This preserves the existing contribution extraction pipeline while enabling free-flowing conversation.

## Database Schema

### messages table

**State layer for conversational content**

```sql
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  
  -- Content
  content text NOT NULL,
  type text NOT NULL DEFAULT 'text',
  
  -- Authorship
  author_id uuid REFERENCES participants(id),  -- NULL for system messages
  
  -- Threading
  parent_message_id uuid REFERENCES messages(id),  -- For replies/nested threads
  
  -- Relationships
  contribution_id uuid REFERENCES contributions(id),  -- If type='contribution'
  mentioned_participant_ids uuid[],  -- @mentions
  
  -- Reactions & engagement
  reaction_count int DEFAULT 0,
  reply_count int DEFAULT 0,
  
  -- State
  edited_at timestamptz,
  deleted_at timestamptz,  -- Soft delete
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_type CHECK (type IN (
    'text',          -- Regular message
    'contribution',  -- Message that became a contribution (AI extracted)
    'system'         -- System-generated notification
  )),
  
  CONSTRAINT author_required_for_user_messages CHECK (
    (type = 'system') OR (author_id IS NOT NULL)
  ),
  
  CONSTRAINT contribution_link CHECK (
    (type = 'contribution' AND contribution_id IS NOT NULL) OR
    (type != 'contribution')
  ),
  
  -- Prevent deep nesting (max 3 levels)
  CONSTRAINT max_nesting_depth CHECK (
    parent_message_id IS NULL OR
    NOT EXISTS (
      SELECT 1 FROM messages m1
      JOIN messages m2 ON m1.parent_message_id = m2.id
      JOIN messages m3 ON m2.parent_message_id = m3.id
      WHERE m1.id = parent_message_id
    )
  )
);

-- Indexes
CREATE INDEX idx_messages_thread ON messages(thread_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_author ON messages(author_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_parent ON messages(parent_message_id) WHERE parent_message_id IS NOT NULL;
CREATE INDEX idx_messages_contribution ON messages(contribution_id) WHERE contribution_id IS NOT NULL;
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- Full-text search on message content
CREATE INDEX idx_messages_content_fts ON messages USING gin(to_tsvector('english', content))
  WHERE deleted_at IS NULL;
```

### message_reactions table

**Track emoji reactions to messages**

```sql
CREATE TABLE message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  emoji text NOT NULL,  -- Unicode emoji or :shortcode:
  created_at timestamptz DEFAULT now(),
  
  -- One reaction per user per emoji per message
  CONSTRAINT unique_reaction UNIQUE (message_id, participant_id, emoji)
);

CREATE INDEX idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_participant ON message_reactions(participant_id);
```

### message_mentions table

**Track @mentions for notifications**

```sql
CREATE TABLE message_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  mentioned_participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_mention UNIQUE (message_id, mentioned_participant_id)
);

CREATE INDEX idx_message_mentions_message ON message_mentions(message_id);
CREATE INDEX idx_message_mentions_participant ON message_mentions(mentioned_participant_id);
```

### Message Stats View

```sql
CREATE VIEW message_stats AS
SELECT 
  m.id,
  m.content,
  m.type,
  m.created_at,
  jsonb_build_object(
    'id', p.id,
    'name', p.name
  ) as author,
  COUNT(DISTINCT r.id) as reaction_count,
  COUNT(DISTINCT child.id) as reply_count,
  array_agg(DISTINCT mr.emoji) FILTER (WHERE mr.emoji IS NOT NULL) as reactions,
  array_agg(DISTINCT mention.mentioned_participant_id) FILTER (WHERE mention.mentioned_participant_id IS NOT NULL) as mentions
FROM messages m
LEFT JOIN participants p ON m.author_id = p.id
LEFT JOIN message_reactions mr ON mr.message_id = m.id
LEFT JOIN messages child ON child.parent_message_id = m.id AND child.deleted_at IS NULL
LEFT JOIN message_mentions mention ON mention.message_id = m.id
WHERE m.deleted_at IS NULL
GROUP BY m.id, m.content, m.type, m.created_at, p.id, p.name;
```

## Message Operations

### Create Message

```sql
CREATE OR REPLACE FUNCTION create_message(
  p_thread_id uuid,
  p_author_id uuid,
  p_content text,
  p_type text DEFAULT 'text',
  p_parent_message_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_message_id uuid;
  v_thread threads%ROWTYPE;
BEGIN
  -- Get thread
  SELECT * INTO v_thread
  FROM threads
  WHERE id = p_thread_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Thread not found';
  END IF;
  
  -- Check if thread is locked
  IF v_thread.locked THEN
    RAISE EXCEPTION 'Thread is locked';
  END IF;
  
  -- Create message
  INSERT INTO messages (thread_id, author_id, content, type, parent_message_id)
  VALUES (p_thread_id, p_author_id, p_content, p_type, p_parent_message_id)
  RETURNING id INTO v_message_id;
  
  -- Update thread stats
  UPDATE threads
  SET 
    message_count = message_count + 1,
    last_message_at = now(),
    participant_count = (
      SELECT COUNT(DISTINCT author_id)
      FROM messages
      WHERE thread_id = p_thread_id
      AND deleted_at IS NULL
    )
  WHERE id = p_thread_id;
  
  -- Update channel stats
  UPDATE channels
  SET 
    message_count = message_count + 1,
    last_message_at = now()
  WHERE id = v_thread.channel_id;
  
  -- Extract mentions from content (@username pattern)
  INSERT INTO message_mentions (message_id, mentioned_participant_id)
  SELECT v_message_id, p.id
  FROM participants p
  WHERE p.name = ANY(
    SELECT unnest(regexp_matches(p_content, '@(\w+)', 'g'))
  );
  
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql;
```

### Edit Message

```sql
CREATE OR REPLACE FUNCTION edit_message(
  p_message_id uuid,
  p_new_content text
)
RETURNS void AS $$
BEGIN
  -- Only author can edit, and only if not deleted
  UPDATE messages
  SET 
    content = p_new_content,
    edited_at = now()
  WHERE id = p_message_id
  AND author_id = auth.uid()
  AND deleted_at IS NULL;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cannot edit message';
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### Delete Message (Soft Delete)

```sql
CREATE OR REPLACE FUNCTION delete_message(p_message_id uuid)
RETURNS void AS $$
DECLARE
  v_thread_id uuid;
BEGIN
  -- Soft delete (preserve for thread continuity)
  UPDATE messages
  SET deleted_at = now()
  WHERE id = p_message_id
  AND (author_id = auth.uid() OR EXISTS (
    SELECT 1 FROM threads t
    JOIN channels c ON t.channel_id = c.id
    WHERE t.id = messages.thread_id
    AND c.created_by = auth.uid()
  ))
  RETURNING thread_id INTO v_thread_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cannot delete message';
  END IF;
  
  -- Update thread stats
  UPDATE threads
  SET message_count = message_count - 1
  WHERE id = v_thread_id;
END;
$$ LANGUAGE plpgsql;
```

### Add Reaction

```sql
CREATE OR REPLACE FUNCTION add_reaction(
  p_message_id uuid,
  p_emoji text
)
RETURNS void AS $$
BEGIN
  -- Upsert reaction (toggle if exists)
  INSERT INTO message_reactions (message_id, participant_id, emoji)
  VALUES (p_message_id, auth.uid(), p_emoji)
  ON CONFLICT (message_id, participant_id, emoji) DO NOTHING;
  
  -- Update message reaction count
  UPDATE messages
  SET reaction_count = (
    SELECT COUNT(*) FROM message_reactions
    WHERE message_id = p_message_id
  )
  WHERE id = p_message_id;
END;
$$ LANGUAGE plpgsql;
```

### Remove Reaction

```sql
CREATE OR REPLACE FUNCTION remove_reaction(
  p_message_id uuid,
  p_emoji text
)
RETURNS void AS $$
BEGIN
  DELETE FROM message_reactions
  WHERE message_id = p_message_id
  AND participant_id = auth.uid()
  AND emoji = p_emoji;
  
  -- Update message reaction count
  UPDATE messages
  SET reaction_count = (
    SELECT COUNT(*) FROM message_reactions
    WHERE message_id = p_message_id
  )
  WHERE id = p_message_id;
END;
$$ LANGUAGE plpgsql;
```

## Message → Contribution Flow

**When a message contains extractable knowledge:**

```sql
CREATE OR REPLACE FUNCTION convert_message_to_contribution(p_message_id uuid)
RETURNS uuid AS $$
DECLARE
  v_message messages%ROWTYPE;
  v_contribution_id uuid;
BEGIN
  -- Get message
  SELECT * INTO v_message
  FROM messages
  WHERE id = p_message_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found';
  END IF;
  
  -- Create contribution from message content
  INSERT INTO contributions (
    convergence_id,
    content,
    participant_id,
    status,
    created_at
  )
  SELECT
    conv.id,
    v_message.content,
    v_message.author_id,
    'pending',
    v_message.created_at
  FROM threads t
  JOIN channels c ON t.channel_id = c.id
  JOIN convergences conv ON c.convergence_id = conv.id
  WHERE t.id = v_message.thread_id
  RETURNING id INTO v_contribution_id;
  
  -- Link message to contribution
  UPDATE messages
  SET 
    type = 'contribution',
    contribution_id = v_contribution_id
  WHERE id = p_message_id;
  
  -- Contribution will be processed by existing Edge Function (process-contribution)
  
  RETURN v_contribution_id;
END;
$$ LANGUAGE plpgsql;
```

**Automatic extraction trigger:**

```sql
-- Trigger to auto-extract contributions from messages
CREATE OR REPLACE FUNCTION trigger_message_extraction()
RETURNS TRIGGER AS $$
BEGIN
  -- Only extract from user messages (not system messages or replies)
  IF NEW.type = 'text' 
     AND NEW.author_id IS NOT NULL 
     AND NEW.parent_message_id IS NULL
     AND length(NEW.content) > 100 THEN  -- Minimum length threshold
    
    -- Queue for extraction (async via pg_net or direct function call)
    PERFORM convert_message_to_contribution(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_auto_extract
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_message_extraction();
```

## Row-Level Security (RLS)

```sql
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Read: Can read messages in threads you can read
CREATE POLICY message_read ON messages
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM threads t
      JOIN channels c ON t.channel_id = c.id
      WHERE t.id = messages.thread_id
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

-- Create: Can create messages in threads in channels you're a member of
CREATE POLICY message_create ON messages
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM threads t
      JOIN channels c ON t.channel_id = c.id
      WHERE t.id = messages.thread_id
      AND c.visibility = 'public'
      AND t.locked = false
    )
  );

-- Update: Only message author can edit (within 1 hour)
CREATE POLICY message_update ON messages
  FOR UPDATE
  USING (
    author_id = auth.uid()
    AND deleted_at IS NULL
    AND created_at > now() - interval '1 hour'
  );

-- Delete: Message author or channel moderator
CREATE POLICY message_delete ON messages
  FOR UPDATE
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM threads t
      JOIN channels c ON t.channel_id = c.id
      JOIN channel_members cm ON cm.channel_id = c.id
      WHERE t.id = messages.thread_id
      AND cm.participant_id = auth.uid()
      AND cm.role IN ('owner', 'moderator')
    )
  );
```

## Migration

```sql
-- migrations/027_messages.sql

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'text',
  author_id uuid REFERENCES participants(id),
  parent_message_id uuid REFERENCES messages(id),
  contribution_id uuid REFERENCES contributions(id),
  mentioned_participant_ids uuid[],
  reaction_count int DEFAULT 0,
  reply_count int DEFAULT 0,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_type CHECK (type IN ('text', 'contribution', 'system')),
  CONSTRAINT author_required_for_user_messages CHECK ((type = 'system') OR (author_id IS NOT NULL)),
  CONSTRAINT contribution_link CHECK ((type = 'contribution' AND contribution_id IS NOT NULL) OR (type != 'contribution'))
);

CREATE INDEX idx_messages_thread ON messages(thread_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_author ON messages(author_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_parent ON messages(parent_message_id) WHERE parent_message_id IS NOT NULL;
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_content_fts ON messages USING gin(to_tsvector('english', content)) WHERE deleted_at IS NULL;

-- Reactions
CREATE TABLE message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_reaction UNIQUE (message_id, participant_id, emoji)
);

CREATE INDEX idx_message_reactions_message ON message_reactions(message_id);

-- Mentions
CREATE TABLE message_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  mentioned_participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_mention UNIQUE (message_id, mentioned_participant_id)
);

CREATE INDEX idx_message_mentions_participant ON message_mentions(mentioned_participant_id);

-- RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY message_read ON messages FOR SELECT USING (
  deleted_at IS NULL AND EXISTS (
    SELECT 1 FROM threads t
    JOIN channels c ON t.channel_id = c.id
    WHERE t.id = messages.thread_id AND c.visibility = 'public'
  )
);

CREATE POLICY message_create ON messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY message_update ON messages FOR UPDATE USING (author_id = auth.uid() AND deleted_at IS NULL);

-- Functions
CREATE OR REPLACE FUNCTION create_message(
  p_thread_id uuid,
  p_author_id uuid,
  p_content text,
  p_type text DEFAULT 'text',
  p_parent_message_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_message_id uuid;
BEGIN
  INSERT INTO messages (thread_id, author_id, content, type, parent_message_id)
  VALUES (p_thread_id, p_author_id, p_content, p_type, p_parent_message_id)
  RETURNING id INTO v_message_id;
  
  UPDATE threads SET message_count = message_count + 1, last_message_at = now()
  WHERE id = p_thread_id;
  
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql;
```

## API Functions

```sql
-- Get messages for thread
CREATE OR REPLACE FUNCTION get_thread_messages(
  p_thread_id uuid,
  p_limit int DEFAULT 50,
  p_before timestamptz DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  type text,
  author jsonb,
  parent_message_id uuid,
  reaction_count int,
  reply_count int,
  reactions jsonb,
  created_at timestamptz,
  edited_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    m.type,
    jsonb_build_object('id', p.id, 'name', p.name) as author,
    m.parent_message_id,
    m.reaction_count,
    m.reply_count,
    COALESCE(
      jsonb_agg(
        jsonb_build_object('emoji', mr.emoji, 'count', COUNT(*))
      ) FILTER (WHERE mr.emoji IS NOT NULL),
      '[]'::jsonb
    ) as reactions,
    m.created_at,
    m.edited_at
  FROM messages m
  LEFT JOIN participants p ON m.author_id = p.id
  LEFT JOIN message_reactions mr ON mr.message_id = m.id
  WHERE m.thread_id = p_thread_id
  AND m.deleted_at IS NULL
  AND (p_before IS NULL OR m.created_at < p_before)
  GROUP BY m.id, m.content, m.type, p.id, p.name, m.parent_message_id, m.reaction_count, m.reply_count, m.created_at, m.edited_at
  ORDER BY m.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

## UI Implications (Future Sprints)

**Message thread:**
```
Thread: Building trust in distributed teams

Alice · 3h ago
Trust emerges from repeated interactions and transparent 
decision-making. In our experience at Techne...
  😊 3  💯 2  [Reply]

  └─ Bob · 2h ago
     I've seen this work when teams publish their 
     decision logs publicly.
       ✅ 1  [Reply]

Charlie · 1h ago
@Alice what about async-first teams? Different dynamics?
  🤔 2  [Reply]

[Type your message...]
```

## Acceptance Criteria (Deferred)

- [x] Message data model plan documented
- [ ] Migration 027_messages.sql applied
- [ ] Messages support nesting (parent_message_id)
- [ ] Foreign keys enforce referential integrity
- [ ] Message types (text/contribution/system) enforced by CHECK constraint
- [ ] RLS policies enforce thread-based access
- [ ] create_message() function updates thread stats
- [ ] Message reactions working
- [ ] @mentions extracted and stored
- [ ] Soft delete preserves thread continuity
- [ ] get_thread_messages() RPC function working

**Target completion:** Post-ETHBoulder (Feb 17+), after Sprints 57-58 (Channels & Threads)

## Priority

**Medium-High (but deferred).** Messages are the actual content layer of Communication Foundation. Priority increases when:
- Channels and threads are implemented (Sprints 57-58)
- Platform transitions from event tool to ongoing commons
- Real-time dialogue becomes necessary feature

## Notes

This sprint completes the Communication Data Layer (Ebb phase of Cycle 7). The three-layer model:

1. **Channels** (Sprint 57) — Where conversations happen
2. **Threads** (Sprint 58) — Focused discussions
3. **Messages** (Sprint 59) — Actual content

The message → contribution flow is the key integration point with the existing system. Messages can optionally become contributions, triggering the same AI extraction pipeline used for the contribution form.

This design allows the platform to support both:
- **Casual conversation** (messages without extraction)
- **Knowledge capture** (messages that become contributions)

The automatic extraction trigger (`trigger_message_extraction`) demonstrates how the communication layer can seamlessly feed the knowledge graph — every substantive message becomes a potential artifact.

This completes the "Ebb" phase of Cycle 7. Next: Sprint 60 (Real-Time Subscription Architecture) and Sprints 61-64 (Flow: Basic Messaging UI).
