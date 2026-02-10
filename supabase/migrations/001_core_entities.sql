-- Sprint 1: Core Entity Schema
-- Layer 1 (Identity) — Schema Architect (01)
-- The foundational entities of the knowledge graph

-- ===== Bioregions =====
CREATE TABLE bioregions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  watershed TEXT,
  elevation_ft INTEGER,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== Tents (thematic framings) =====
CREATE TABLE tents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== Convergences (events) =====
CREATE TYPE convergence_state AS ENUM (
  'announced', 'pre', 'live', 'post', 'archived'
);

CREATE TABLE convergences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  bioregion_id UUID REFERENCES bioregions(id),
  state convergence_state NOT NULL DEFAULT 'announced',
  date_start DATE,
  date_end DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== Participants (humans) =====
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  affiliation TEXT,
  bio TEXT,
  interests TEXT[] DEFAULT '{}',
  email TEXT,
  consent_recording BOOLEAN DEFAULT FALSE,
  notification_prefs JSONB DEFAULT '{"digest": true, "immediate": false}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_participants_auth ON participants(auth_user_id);

-- ===== Agents (AI agents) =====
CREATE TYPE agent_type AS ENUM ('personal', 'collective', 'service');

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type agent_type NOT NULL DEFAULT 'personal',
  capabilities TEXT[] DEFAULT '{}',
  participant_id UUID REFERENCES participants(id),
  api_key_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agents_participant ON agents(participant_id);

-- ===== Sessions (conversation containers) =====
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convergence_id UUID NOT NULL REFERENCES convergences(id),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  time_start TIMESTAMPTZ,
  time_end TIMESTAMPTZ,
  recording_url TEXT,
  transcript_url TEXT,
  chatham_house BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_convergence ON sessions(convergence_id);

-- ===== Artifacts (knowledge objects) =====
CREATE TYPE artifact_type AS ENUM (
  'idea', 'proposal', 'commitment', 'pattern', 'synthesis', 'question', 'reflection'
);

CREATE TYPE artifact_state AS ENUM (
  'seed', 'discussed', 'proposed', 'committed', 'active', 'completed', 'archived', 'superseded'
);

CREATE TABLE artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  body TEXT,
  type artifact_type NOT NULL,
  state artifact_state NOT NULL DEFAULT 'seed',
  
  -- Origin context (e/H-LAM/T: where did this emerge?)
  origin_convergence_id UUID REFERENCES convergences(id),
  origin_session_id UUID REFERENCES sessions(id),
  
  -- Stewardship
  created_by UUID REFERENCES participants(id),
  created_by_agent UUID REFERENCES agents(id),
  steward_id UUID REFERENCES participants(id),
  
  -- Search
  search_vector TSVECTOR,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_artifacts_convergence ON artifacts(origin_convergence_id);
CREATE INDEX idx_artifacts_session ON artifacts(origin_session_id);
CREATE INDEX idx_artifacts_type ON artifacts(type);
CREATE INDEX idx_artifacts_state ON artifacts(state);
CREATE INDEX idx_artifacts_steward ON artifacts(steward_id);
CREATE INDEX idx_artifacts_search ON artifacts USING GIN(search_vector);

-- Auto-update search vector
CREATE OR REPLACE FUNCTION update_artifact_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.body, '')), 'C');
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_artifact_search_vector
  BEFORE INSERT OR UPDATE ON artifacts
  FOR EACH ROW
  EXECUTE FUNCTION update_artifact_search_vector();
