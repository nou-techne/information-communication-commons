-- Sprint 73: Message Moderation
-- Report, hide, ban. Moderation audit log.

-- ===== Moderation Actions =====
CREATE TYPE moderation_action AS ENUM ('report', 'hide', 'unhide', 'ban', 'unban');

CREATE TABLE moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action moderation_action NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('message', 'participant', 'thread')),
  target_id UUID NOT NULL,
  channel_id UUID REFERENCES channels(id),
  reason TEXT,
  moderator_id UUID REFERENCES participants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_moderation_log_target ON moderation_log(target_type, target_id);
CREATE INDEX idx_moderation_log_channel ON moderation_log(channel_id);

-- Hidden flag on messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS hidden_reason TEXT;

-- Channel bans
CREATE TABLE channel_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id),
  reason TEXT,
  banned_by UUID REFERENCES participants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE (channel_id, participant_id)
);

-- Hide a message (moderation action)
CREATE OR REPLACE FUNCTION moderate_hide_message(
  p_message_id UUID,
  p_moderator_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE messages SET hidden = TRUE, hidden_reason = p_reason WHERE id = p_message_id;
  
  INSERT INTO moderation_log (action, target_type, target_id, reason, moderator_id)
  VALUES ('hide', 'message', p_message_id, p_reason, p_moderator_id);
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Report a message
CREATE OR REPLACE FUNCTION report_message(
  p_message_id UUID,
  p_reporter_id UUID,
  p_reason TEXT
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO moderation_log (action, target_type, target_id, reason, moderator_id)
  VALUES ('report', 'message', p_message_id, p_reason, p_reporter_id)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ban user from channel
CREATE OR REPLACE FUNCTION ban_from_channel(
  p_channel_id UUID,
  p_participant_id UUID,
  p_banned_by UUID,
  p_reason TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO channel_bans (channel_id, participant_id, reason, banned_by, expires_at)
  VALUES (p_channel_id, p_participant_id, p_reason, p_banned_by, p_expires_at)
  ON CONFLICT (channel_id, participant_id) DO UPDATE SET reason = p_reason, expires_at = p_expires_at
  RETURNING id INTO v_id;
  
  INSERT INTO moderation_log (action, target_type, target_id, channel_id, reason, moderator_id)
  VALUES ('ban', 'participant', p_participant_id, p_channel_id, p_reason, p_banned_by);
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE moderation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY moderation_log_select ON moderation_log FOR SELECT TO authenticated USING (true);
CREATE POLICY moderation_log_insert ON moderation_log FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY channel_bans_select ON channel_bans FOR SELECT TO authenticated USING (true);
