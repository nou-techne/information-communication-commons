-- Sprint 2: Context Dimensions & Tags
-- Layer 1 (Identity) — Schema Architect (01)
-- e/H-LAM/T dimensions encoded as structured metadata

-- ===== Tags (thematic vocabulary) =====
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT, -- theme, domain, technology, method
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tags_category ON tags(category);

-- ===== Artifact Tags (many-to-many) =====
CREATE TABLE artifact_tags (
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (artifact_id, tag_id)
);

-- ===== Artifact Tents (which thematic framing) =====
CREATE TABLE artifact_tents (
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  tent_id UUID NOT NULL REFERENCES tents(id) ON DELETE CASCADE,
  PRIMARY KEY (artifact_id, tent_id)
);

-- ===== Artifact Dimensions (e/H-LAM/T context encoding) =====
-- Each dimension maps to a framework element:
--   temporal (M-Methodology), social (H-Human), thematic (L-Language),
--   energetic (T-Training), spatial (e/-Ecology)
CREATE TYPE dimension_type AS ENUM (
  'temporal', 'social', 'thematic', 'energetic', 'spatial'
);

CREATE TABLE artifact_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  dimension dimension_type NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dimensions_artifact ON artifact_dimensions(artifact_id);
CREATE INDEX idx_dimensions_type ON artifact_dimensions(dimension);
CREATE INDEX idx_dimensions_key_value ON artifact_dimensions(key, value);

-- ===== Convergence Participants (attendance tracking) =====
CREATE TYPE attendance_state AS ENUM (
  'registered', 'attending', 'contributing', 'stewarding'
);

CREATE TABLE convergence_participants (
  convergence_id UUID NOT NULL REFERENCES convergences(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  state attendance_state NOT NULL DEFAULT 'registered',
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (convergence_id, participant_id)
);

-- ===== Session Participants (who was in the room) =====
CREATE TABLE session_participants (
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'attendee', -- attendee, speaker, facilitator, observer
  PRIMARY KEY (session_id, participant_id)
);
