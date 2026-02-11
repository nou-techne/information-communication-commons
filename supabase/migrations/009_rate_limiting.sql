-- Sprint 10: Rate Limiting & Abuse Prevention
-- Role: Compliance & Security Engineer | Layer: Constraint (6)
-- Acceptance: Spam blocked; legitimate use unaffected

-- 1. Add content length constraint to contributions table
ALTER TABLE contributions
ADD CONSTRAINT contributions_content_length_check 
CHECK (length(content) >= 20 AND length(content) <= 10000);

-- 2. Create rate limiting function (10 contributions per participant per hour)
CREATE OR REPLACE FUNCTION check_contribution_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  -- Only apply rate limiting if participant_id is set (authenticated users)
  IF NEW.participant_id IS NOT NULL THEN
    -- Count contributions from this participant in the last hour
    SELECT COUNT(*) INTO recent_count
    FROM contributions
    WHERE participant_id = NEW.participant_id
      AND created_at > NOW() - INTERVAL '1 hour';
    
    -- Block if >= 10 contributions in last hour
    IF recent_count >= 10 THEN
      RAISE EXCEPTION 'Rate limit exceeded: maximum 10 contributions per hour per user';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger to enforce rate limiting
DROP TRIGGER IF EXISTS contributions_rate_limit_trigger ON contributions;
CREATE TRIGGER contributions_rate_limit_trigger
  BEFORE INSERT ON contributions
  FOR EACH ROW
  EXECUTE FUNCTION check_contribution_rate_limit();

-- 4. Add index for participant rate limiting performance
CREATE INDEX IF NOT EXISTS idx_contributions_participant_created 
ON contributions (participant_id, created_at DESC) WHERE participant_id IS NOT NULL;

COMMENT ON FUNCTION check_contribution_rate_limit() IS 'Sprint 10: Rate limit - max 10 contributions/hour per authenticated user';
