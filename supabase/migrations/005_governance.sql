-- Sprint 21: Governance — Consent + Stewardship

-- Artifacts above 'seed' must have a steward
ALTER TABLE artifacts ADD CONSTRAINT artifacts_steward_required
  CHECK (state = 'seed' OR steward_id IS NOT NULL);

-- Soft delete only — add deleted_at column instead of allowing hard deletes
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create a view that excludes deleted artifacts
CREATE OR REPLACE VIEW active_artifacts AS
  SELECT * FROM artifacts WHERE deleted_at IS NULL;

-- Chatham House view: anonymize speakers for marked sessions
CREATE OR REPLACE VIEW chatham_house_artifacts AS
  SELECT 
    a.id, a.title, a.summary, a.body, a.type, a.state,
    a.origin_convergence_id, a.origin_session_id,
    CASE WHEN s.chatham_house = TRUE THEN NULL ELSE a.created_by END AS created_by,
    a.created_by_agent,
    CASE WHEN s.chatham_house = TRUE THEN NULL ELSE a.steward_id END AS steward_id,
    a.search_vector, a.created_at, a.updated_at,
    CASE WHEN a.created_by_agent IS NOT NULL THEN TRUE ELSE FALSE END AS is_agent_content
  FROM artifacts a
  LEFT JOIN sessions s ON a.origin_session_id = s.id
  WHERE a.deleted_at IS NULL;

-- RLS: prevent hard deletes on artifacts (revoke DELETE, only allow UPDATE of deleted_at)
-- Note: This is enforced at the application level since RLS can't distinguish column updates
