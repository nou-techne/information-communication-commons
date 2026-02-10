-- Sprint 3: Relationship Schema (Knowledge Graph Edges)
-- Layer 1 (Identity) — Schema Architect (01)
-- The connections that make this a graph, not a list

-- ===== Artifact ↔ Artifact Relationships =====
CREATE TYPE relationship_type AS ENUM (
  'builds_on', 'extends', 'contradicts', 'supersedes', 'related_to', 'synthesizes'
);

CREATE TABLE artifact_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  to_artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  type relationship_type NOT NULL,
  description TEXT,
  created_by UUID REFERENCES participants(id),
  created_by_agent UUID REFERENCES agents(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate relationships
  UNIQUE(from_artifact_id, to_artifact_id, type),
  -- Prevent self-reference
  CHECK (from_artifact_id != to_artifact_id)
);

CREATE INDEX idx_rel_from ON artifact_relationships(from_artifact_id);
CREATE INDEX idx_rel_to ON artifact_relationships(to_artifact_id);
CREATE INDEX idx_rel_type ON artifact_relationships(type);

-- ===== Participant ↔ Participant Connections =====
CREATE TABLE participant_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  participant_b_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  convergence_id UUID REFERENCES convergences(id),
  session_id UUID REFERENCES sessions(id),
  context TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CHECK (participant_a_id != participant_b_id)
);

CREATE INDEX idx_conn_a ON participant_connections(participant_a_id);
CREATE INDEX idx_conn_b ON participant_connections(participant_b_id);

-- ===== Participant ↔ Artifact Roles =====
CREATE TYPE participant_artifact_role AS ENUM (
  'author', 'contributor', 'steward', 'interested'
);

CREATE TABLE artifact_participants (
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  role participant_artifact_role NOT NULL DEFAULT 'interested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (artifact_id, participant_id, role)
);

CREATE INDEX idx_ap_participant ON artifact_participants(participant_id);

-- ===== Artifact ↔ Session Links =====
CREATE TYPE artifact_session_role AS ENUM (
  'discussed_in', 'emerged_from', 'presented_in'
);

CREATE TABLE artifact_sessions (
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role artifact_session_role NOT NULL DEFAULT 'discussed_in',
  PRIMARY KEY (artifact_id, session_id, role)
);
