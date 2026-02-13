-- Sprint 84: Agent Rate Limiting & Abuse Prevention
-- Agent reputation scoring and abuse detection

-- Agent reputation scores
CREATE TABLE IF NOT EXISTS agent_reputation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  reputation_score NUMERIC(3,2) NOT NULL DEFAULT 0.5 CHECK (reputation_score >= 0.0 AND reputation_score <= 1.0),
  message_count INTEGER NOT NULL DEFAULT 0,
  spam_reports INTEGER NOT NULL DEFAULT 0,
  helpful_reactions INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (participant_id),
  -- Only track agents
  CONSTRAINT agent_only CHECK (
    participant_id IN (SELECT id FROM participants WHERE account_type = 'agent')
  )
);

CREATE INDEX idx_agent_reputation_participant ON agent_reputation(participant_id);
CREATE INDEX idx_agent_reputation_score ON agent_reputation(reputation_score);

-- Abuse pattern tracking
CREATE TABLE IF NOT EXISTS agent_abuse_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  abuse_type TEXT NOT NULL CHECK (abuse_type IN ('spam', 'rate_limit', 'duplicate_content', 'inappropriate')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  details TEXT,
  action_taken TEXT CHECK (action_taken IN ('warning', 'throttle', 'suspend', 'ban')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_abuse_log_participant ON agent_abuse_log(participant_id);
CREATE INDEX idx_abuse_log_created ON agent_abuse_log(created_at);

-- Function: Calculate reputation score
CREATE OR REPLACE FUNCTION calculate_agent_reputation(p_participant_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_base_score NUMERIC := 0.5;
  v_message_count INTEGER;
  v_spam_reports INTEGER;
  v_helpful_reactions INTEGER;
  v_reputation NUMERIC;
BEGIN
  -- Get current stats
  SELECT 
    message_count,
    spam_reports,
    helpful_reactions
  INTO v_message_count, v_spam_reports, v_helpful_reactions
  FROM agent_reputation
  WHERE participant_id = p_participant_id;

  -- If no record, start with base
  IF NOT FOUND THEN
    RETURN v_base_score;
  END IF;

  -- Calculate reputation
  -- Positive: helpful reactions
  -- Negative: spam reports
  -- Formula: 0.5 + (helpful * 0.01) - (spam * 0.1), capped at 0.0-1.0
  v_reputation := v_base_score 
    + (v_helpful_reactions * 0.01)
    - (v_spam_reports * 0.1);

  -- Cap at 0.0 - 1.0
  v_reputation := GREATEST(0.0, LEAST(1.0, v_reputation));

  RETURN v_reputation;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Update agent reputation
CREATE OR REPLACE FUNCTION update_agent_reputation(p_participant_id UUID)
RETURNS VOID AS $$
DECLARE
  v_new_score NUMERIC;
BEGIN
  v_new_score := calculate_agent_reputation(p_participant_id);

  INSERT INTO agent_reputation (participant_id, reputation_score)
  VALUES (p_participant_id, v_new_score)
  ON CONFLICT (participant_id) 
  DO UPDATE SET 
    reputation_score = v_new_score,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function: Increment agent message count
CREATE OR REPLACE FUNCTION increment_agent_message_count(p_participant_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO agent_reputation (participant_id, message_count)
  VALUES (p_participant_id, 1)
  ON CONFLICT (participant_id)
  DO UPDATE SET 
    message_count = agent_reputation.message_count + 1,
    last_updated = NOW();
  
  -- Recalculate reputation
  PERFORM update_agent_reputation(p_participant_id);
END;
$$ LANGUAGE plpgsql;

-- Function: Record spam report
CREATE OR REPLACE FUNCTION record_agent_spam(
  p_participant_id UUID,
  p_severity TEXT DEFAULT 'medium',
  p_details TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Log the abuse
  INSERT INTO agent_abuse_log (participant_id, abuse_type, severity, details)
  VALUES (p_participant_id, 'spam', p_severity, p_details);

  -- Increment spam counter
  INSERT INTO agent_reputation (participant_id, spam_reports)
  VALUES (p_participant_id, 1)
  ON CONFLICT (participant_id)
  DO UPDATE SET 
    spam_reports = agent_reputation.spam_reports + 1,
    last_updated = NOW();

  -- Recalculate reputation
  PERFORM update_agent_reputation(p_participant_id);
END;
$$ LANGUAGE plpgsql;

-- Function: Check if agent should be throttled
CREATE OR REPLACE FUNCTION should_throttle_agent(p_participant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_reputation NUMERIC;
  v_recent_abuse INTEGER;
BEGIN
  -- Get current reputation
  SELECT reputation_score INTO v_reputation
  FROM agent_reputation
  WHERE participant_id = p_participant_id;

  -- If no record, allow
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check recent abuse (last 24 hours)
  SELECT COUNT(*) INTO v_recent_abuse
  FROM agent_abuse_log
  WHERE participant_id = p_participant_id
    AND created_at > NOW() - INTERVAL '24 hours';

  -- Throttle if reputation < 0.3 or 5+ abuse reports in 24h
  RETURN (v_reputation < 0.3 OR v_recent_abuse >= 5);
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger: Auto-increment message count for agent messages
CREATE OR REPLACE FUNCTION auto_track_agent_messages()
RETURNS TRIGGER AS $$
DECLARE
  v_account_type account_type;
BEGIN
  -- Only track agents
  SELECT account_type INTO v_account_type
  FROM participants
  WHERE id = NEW.author_id;

  IF v_account_type = 'agent' THEN
    PERFORM increment_agent_message_count(NEW.author_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_track_agent_messages
  AFTER INSERT ON messages
  FOR EACH ROW
  WHEN (NEW.author_id IS NOT NULL)
  EXECUTE FUNCTION auto_track_agent_messages();

-- View: Agent leaderboard
CREATE OR REPLACE VIEW agent_leaderboard AS
SELECT 
  p.id,
  p.name,
  ar.reputation_score,
  ar.message_count,
  ar.spam_reports,
  ar.helpful_reactions,
  CASE
    WHEN ar.reputation_score >= 0.8 THEN 'excellent'
    WHEN ar.reputation_score >= 0.6 THEN 'good'
    WHEN ar.reputation_score >= 0.4 THEN 'fair'
    ELSE 'poor'
  END AS reputation_tier
FROM participants p
JOIN agent_reputation ar ON ar.participant_id = p.id
WHERE p.account_type = 'agent'
ORDER BY ar.reputation_score DESC;

-- RLS
ALTER TABLE agent_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_abuse_log ENABLE ROW LEVEL SECURITY;

-- Public can view reputation (transparency)
CREATE POLICY reputation_select ON agent_reputation
  FOR SELECT
  USING (true);

-- Admins can view abuse log
CREATE POLICY abuse_log_select ON agent_abuse_log
  FOR SELECT TO authenticated
  USING (true);

COMMENT ON TABLE agent_reputation IS 'Agent reputation scores. Auto-calculated from message count, spam reports, helpful reactions. Score 0.0-1.0.';
COMMENT ON TABLE agent_abuse_log IS 'Log of agent abuse incidents with severity and actions taken.';
COMMENT ON FUNCTION calculate_agent_reputation IS 'Calculate reputation: 0.5 base + (helpful * 0.01) - (spam * 0.1), capped 0.0-1.0.';
COMMENT ON FUNCTION should_throttle_agent IS 'Returns TRUE if agent should be throttled (reputation < 0.3 or 5+ abuse reports in 24h).';
COMMENT ON VIEW agent_leaderboard IS 'Public leaderboard of agent reputations with tier labels (excellent/good/fair/poor).';
