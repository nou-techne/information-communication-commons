-- Sprint 77: Agent API Authentication
-- API key auth for agent accounts with rate limiting

-- Add account_type to participants
DO $$ BEGIN
  CREATE TYPE account_type AS ENUM ('human', 'agent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE participants ADD COLUMN IF NOT EXISTS account_type account_type NOT NULL DEFAULT 'human';

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL, -- First 8 chars for identification: cid_live_xxxxxxxx
  name TEXT, -- User-friendly name for the key
  scopes TEXT[] NOT NULL DEFAULT ARRAY['read', 'write'], -- permissions
  rate_limit_per_hour INTEGER NOT NULL DEFAULT 1000,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  CONSTRAINT valid_key_prefix CHECK (key_prefix ~ '^cid_(live|test)_[a-zA-Z0-9]{8}$')
);

CREATE INDEX idx_api_keys_participant ON api_keys(participant_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

-- Rate limiting tracking
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (api_key_id, window_start)
);

CREATE INDEX idx_rate_limits_key_window ON api_rate_limits(api_key_id, window_start);

-- Function: Validate API key and check rate limit
CREATE OR REPLACE FUNCTION validate_api_key(p_key_hash TEXT)
RETURNS TABLE (
  valid BOOLEAN,
  participant_id UUID,
  account_type account_type,
  remaining_requests INTEGER,
  reset_at TIMESTAMPTZ
) AS $$
DECLARE
  v_key RECORD;
  v_window_start TIMESTAMPTZ;
  v_current_count INTEGER;
BEGIN
  -- Find the key
  SELECT * INTO v_key
  FROM api_keys
  WHERE key_hash = p_key_hash
    AND revoked_at IS NULL
    AND (expires_at IS NULL OR expires_at > NOW());

  -- Key not found or invalid
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::account_type, 0, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  -- Update last used
  UPDATE api_keys SET last_used_at = NOW() WHERE id = v_key.id;

  -- Check rate limit
  v_window_start := DATE_TRUNC('hour', NOW());
  
  INSERT INTO api_rate_limits (api_key_id, window_start, request_count)
  VALUES (v_key.id, v_window_start, 1)
  ON CONFLICT (api_key_id, window_start) 
  DO UPDATE SET request_count = api_rate_limits.request_count + 1
  RETURNING request_count INTO v_current_count;

  -- Return validation result
  IF v_current_count > v_key.rate_limit_per_hour THEN
    -- Rate limit exceeded
    RETURN QUERY SELECT 
      FALSE,
      v_key.participant_id,
      (SELECT account_type FROM participants WHERE id = v_key.participant_id),
      0,
      v_window_start + INTERVAL '1 hour';
  ELSE
    -- Valid and within limit
    RETURN QUERY SELECT 
      TRUE,
      v_key.participant_id,
      (SELECT account_type FROM participants WHERE id = v_key.participant_id),
      v_key.rate_limit_per_hour - v_current_count,
      v_window_start + INTERVAL '1 hour';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Create API key (returns unhashed key - show once!)
CREATE OR REPLACE FUNCTION create_api_key(
  p_participant_id UUID,
  p_name TEXT DEFAULT NULL,
  p_scopes TEXT[] DEFAULT ARRAY['read', 'write'],
  p_rate_limit INTEGER DEFAULT 1000,
  p_environment TEXT DEFAULT 'live'
)
RETURNS TABLE (
  api_key TEXT,
  key_prefix TEXT,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_random TEXT;
  v_key TEXT;
  v_hash TEXT;
  v_prefix TEXT;
BEGIN
  -- Generate random key: cid_{env}_{32-char-random}
  v_random := encode(gen_random_bytes(24), 'base64');
  v_random := REPLACE(REPLACE(REPLACE(v_random, '+', ''), '/', ''), '=', '');
  v_key := 'cid_' || p_environment || '_' || v_random;
  
  -- Hash for storage
  v_hash := encode(digest(v_key, 'sha256'), 'hex');
  
  -- Prefix for display (first 8 chars after cid_live_)
  v_prefix := 'cid_' || p_environment || '_' || SUBSTRING(v_random, 1, 8);

  -- Store hashed key
  INSERT INTO api_keys (participant_id, key_hash, key_prefix, name, scopes, rate_limit_per_hour)
  VALUES (p_participant_id, v_hash, v_prefix, p_name, p_scopes, p_rate_limit);

  -- Return the plain key (only time it's visible!)
  RETURN QUERY SELECT v_key, v_prefix, NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Revoke API key
CREATE OR REPLACE FUNCTION revoke_api_key(p_key_prefix TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE api_keys SET revoked_at = NOW() WHERE key_prefix = p_key_prefix;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can see their own keys
CREATE POLICY api_keys_select ON api_keys
  FOR SELECT TO authenticated
  USING (participant_id IN (SELECT id FROM participants WHERE auth_id = auth.uid()));

-- Users can create their own keys (via function)
CREATE POLICY api_keys_insert ON api_keys
  FOR INSERT TO authenticated
  WITH CHECK (participant_id IN (SELECT id FROM participants WHERE auth_id = auth.uid()));

-- Rate limits readable by key owner
CREATE POLICY rate_limits_select ON api_rate_limits
  FOR SELECT TO authenticated
  USING (api_key_id IN (
    SELECT id FROM api_keys WHERE participant_id IN (
      SELECT id FROM participants WHERE auth_id = auth.uid()
    )
  ));

COMMENT ON TABLE api_keys IS 'API keys for agent authentication. Keys are hashed (SHA-256). Plain key shown only on creation.';
COMMENT ON FUNCTION validate_api_key IS 'Validate API key and enforce rate limits. Returns validation status, participant info, and rate limit state.';
COMMENT ON FUNCTION create_api_key IS 'Generate new API key. Returns plain key (show once!) and prefix for identification.';
