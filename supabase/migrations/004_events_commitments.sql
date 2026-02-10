-- Sprint 4: Event Log & Commitments
-- Layer 1 (Identity) — Schema Architect (01)
-- Append-only event log for auditability + commitment tracking

-- ===== Event Log (append-only — the commons memory) =====
CREATE TYPE event_type AS ENUM (
  'artifact.created',
  'artifact.evolved',
  'artifact.linked',
  'session.recorded',
  'session.synthesized',
  'commitment.made',
  'commitment.updated',
  'observation.submitted',
  'convergence.state_changed',
  'participant.joined',
  'extraction.completed',
  'extraction.failed'
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type event_type NOT NULL,
  
  -- What entity was affected
  entity_type TEXT NOT NULL, -- artifact, session, convergence, commitment, participant
  entity_id UUID NOT NULL,
  
  -- Who did it
  actor_type TEXT NOT NULL CHECK (actor_type IN ('human', 'agent', 'system')),
  actor_id UUID, -- participant_id or agent_id
  
  -- What happened (flexible payload)
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Context
  convergence_id UUID REFERENCES convergences(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Append-only: no UPDATE or DELETE
-- (Enforced via RLS policies in Sprint 5)

CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_entity ON events(entity_type, entity_id);
CREATE INDEX idx_events_convergence ON events(convergence_id);
CREATE INDEX idx_events_created ON events(created_at);
CREATE INDEX idx_events_actor ON events(actor_type, actor_id);

-- ===== Commitments =====
CREATE TYPE commitment_status AS ENUM (
  'made', 'in_progress', 'completed', 'abandoned'
);

CREATE TABLE commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID REFERENCES artifacts(id),
  participant_id UUID NOT NULL REFERENCES participants(id),
  description TEXT NOT NULL,
  status commitment_status NOT NULL DEFAULT 'made',
  due_date DATE,
  progress_notes JSONB[] DEFAULT '{}',
  
  -- Tracking
  reminder_count INTEGER DEFAULT 0,
  last_reminded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commitments_participant ON commitments(participant_id);
CREATE INDEX idx_commitments_status ON commitments(status);
CREATE INDEX idx_commitments_artifact ON commitments(artifact_id);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_commitment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_commitment_timestamp
  BEFORE UPDATE ON commitments
  FOR EACH ROW
  EXECUTE FUNCTION update_commitment_timestamp();

-- ===== Useful Views =====

-- Artifact with relationship counts (for The Garden)
CREATE OR REPLACE VIEW artifact_graph AS
SELECT 
  a.*,
  COUNT(DISTINCT ar1.id) + COUNT(DISTINCT ar2.id) AS connection_count,
  COUNT(DISTINCT ap.participant_id) AS participant_count,
  ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tag_names,
  ARRAY_AGG(DISTINCT te.name) FILTER (WHERE te.name IS NOT NULL) AS tent_names
FROM artifacts a
LEFT JOIN artifact_relationships ar1 ON a.id = ar1.from_artifact_id
LEFT JOIN artifact_relationships ar2 ON a.id = ar2.to_artifact_id
LEFT JOIN artifact_participants ap ON a.id = ap.artifact_id
LEFT JOIN artifact_tags at2 ON a.id = at2.artifact_id
LEFT JOIN tags t ON at2.tag_id = t.id
LEFT JOIN artifact_tents att ON a.id = att.artifact_id
LEFT JOIN tents te ON att.tent_id = te.id
GROUP BY a.id;

-- Participant activity summary (for My Thread)
CREATE OR REPLACE VIEW participant_activity AS
SELECT
  p.*,
  COUNT(DISTINCT ap.artifact_id) FILTER (WHERE ap.role = 'author') AS artifacts_authored,
  COUNT(DISTINCT ap.artifact_id) FILTER (WHERE ap.role = 'steward') AS artifacts_stewarding,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status IN ('made', 'in_progress')) AS open_commitments,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'completed') AS completed_commitments,
  COUNT(DISTINCT pc.id) AS connections_made
FROM participants p
LEFT JOIN artifact_participants ap ON p.id = ap.participant_id
LEFT JOIN commitments c ON p.id = c.participant_id
LEFT JOIN participant_connections pc ON p.id = pc.participant_a_id OR p.id = pc.participant_b_id
GROUP BY p.id;

-- Recent events feed (for Live Pulse)
CREATE OR REPLACE VIEW recent_events AS
SELECT
  e.*,
  CASE 
    WHEN e.actor_type = 'human' THEN (SELECT name FROM participants WHERE id = e.actor_id)
    WHEN e.actor_type = 'agent' THEN (SELECT name FROM agents WHERE id = e.actor_id)
    ELSE 'system'
  END AS actor_name,
  CASE
    WHEN e.entity_type = 'artifact' THEN (SELECT title FROM artifacts WHERE id = e.entity_id)
    WHEN e.entity_type = 'session' THEN (SELECT title FROM sessions WHERE id = e.entity_id)
    WHEN e.entity_type = 'convergence' THEN (SELECT name FROM convergences WHERE id = e.entity_id)
    ELSE NULL
  END AS entity_name
FROM events e
ORDER BY e.created_at DESC;
