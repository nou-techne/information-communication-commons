-- Migration 036: Merkle Chain for Knowledge Graph Replay
-- Adds append-only hash chain to contributions for verifiable, replayable graph history

-- Schema (M1)
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS seq BIGINT;
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS chain_hash TEXT;
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS parent_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_contributions_seq ON contributions(seq) WHERE seq IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contributions_chain_hash ON contributions(chain_hash) WHERE chain_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contributions_parent_hash ON contributions(parent_hash) WHERE parent_hash IS NOT NULL;
CREATE SEQUENCE IF NOT EXISTS contributions_seq_counter START 1;

-- Chain hash trigger (M2)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION compute_chain_hash()
RETURNS TRIGGER AS $$
DECLARE
  prev_hash TEXT;
  content_hash TEXT;
  new_seq BIGINT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('merkle_chain'));
  new_seq := nextval('contributions_seq_counter');
  SELECT chain_hash INTO prev_hash FROM contributions WHERE seq IS NOT NULL ORDER BY seq DESC LIMIT 1;
  IF prev_hash IS NULL THEN
    prev_hash := encode(digest('commons.id:genesis', 'sha256'), 'hex');
  END IF;
  content_hash := encode(digest(COALESCE(NEW.content, ''), 'sha256'), 'hex');
  NEW.seq := new_seq;
  NEW.parent_hash := prev_hash;
  NEW.chain_hash := encode(digest(new_seq::text || '|' || NEW.id::text || '|' || content_hash || '|' || prev_hash, 'sha256'), 'hex');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compute_chain_hash ON contributions;
CREATE TRIGGER trg_compute_chain_hash BEFORE INSERT ON contributions FOR EACH ROW EXECUTE FUNCTION compute_chain_hash();

-- Immutability (M7)
CREATE OR REPLACE FUNCTION prevent_chain_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.seq IS NOT NULL AND (NEW.seq IS DISTINCT FROM OLD.seq OR NEW.chain_hash IS DISTINCT FROM OLD.chain_hash OR NEW.parent_hash IS DISTINCT FROM OLD.parent_hash) THEN
    RAISE EXCEPTION 'Merkle chain columns are immutable after INSERT';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_chain_mutation ON contributions;
CREATE TRIGGER trg_prevent_chain_mutation BEFORE UPDATE ON contributions FOR EACH ROW EXECUTE FUNCTION prevent_chain_mutation();

CREATE OR REPLACE FUNCTION prevent_chain_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.seq IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot delete chained contribution seq %', OLD.seq;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_chain_deletion ON contributions;
CREATE TRIGGER trg_prevent_chain_deletion BEFORE DELETE ON contributions FOR EACH ROW EXECUTE FUNCTION prevent_chain_deletion();

-- Verification (M5)
CREATE OR REPLACE FUNCTION verify_merkle_chain()
RETURNS TABLE(total_links BIGINT, valid_links BIGINT, broken_at_seq BIGINT, chain_intact BOOLEAN, head_seq BIGINT, head_hash TEXT, genesis_hash TEXT) AS $$
DECLARE
  rec RECORD; prev_hash TEXT; expected_hash TEXT; content_hash TEXT;
  v_total BIGINT := 0; v_valid BIGINT := 0; v_broken_at BIGINT := NULL; v_head_seq BIGINT := 0; v_head_hash TEXT := '';
BEGIN
  prev_hash := encode(digest('commons.id:genesis', 'sha256'), 'hex');
  genesis_hash := prev_hash;
  FOR rec IN SELECT c.seq, c.id, c.content, c.chain_hash, c.parent_hash FROM contributions c WHERE c.seq IS NOT NULL ORDER BY c.seq ASC LOOP
    v_total := v_total + 1;
    content_hash := encode(digest(COALESCE(rec.content, ''), 'sha256'), 'hex');
    expected_hash := encode(digest(rec.seq::text || '|' || rec.id::text || '|' || content_hash || '|' || prev_hash, 'sha256'), 'hex');
    IF rec.chain_hash = expected_hash AND rec.parent_hash = prev_hash THEN v_valid := v_valid + 1;
    ELSIF v_broken_at IS NULL THEN v_broken_at := rec.seq; END IF;
    prev_hash := rec.chain_hash; v_head_seq := rec.seq; v_head_hash := rec.chain_hash;
  END LOOP;
  RETURN QUERY SELECT v_total, v_valid, v_broken_at, (v_total = v_valid), v_head_seq, v_head_hash, genesis_hash;
END;
$$ LANGUAGE plpgsql STABLE;

-- Replay (M6)
CREATE OR REPLACE FUNCTION replay_chain(p_from_seq BIGINT DEFAULT 1, p_to_seq BIGINT DEFAULT NULL)
RETURNS TABLE(seq BIGINT, contribution_id UUID, content TEXT, chain_hash TEXT, parent_hash TEXT, status TEXT, created_at TIMESTAMPTZ, processed_at TIMESTAMPTZ, artifact_count BIGINT, artifacts JSONB) AS $$
BEGIN
  RETURN QUERY SELECT c.seq, c.id, c.content, c.chain_hash, c.parent_hash, c.status::TEXT, c.created_at, c.processed_at,
    COALESCE(jsonb_array_length(c.extraction->'artifacts'), 0)::BIGINT, COALESCE(c.extraction->'artifacts', '[]'::jsonb)
  FROM contributions c WHERE c.seq >= p_from_seq AND (p_to_seq IS NULL OR c.seq <= p_to_seq) AND c.seq IS NOT NULL ORDER BY c.seq ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Chain HEAD (M6)
CREATE OR REPLACE FUNCTION chain_head()
RETURNS TABLE(head_seq BIGINT, head_hash TEXT, total_contributions BIGINT, total_artifacts BIGINT, chain_intact BOOLEAN, last_contribution_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY SELECT MAX(c.seq), (SELECT c2.chain_hash FROM contributions c2 WHERE c2.seq = MAX(c.seq)),
    COUNT(DISTINCT c.id), (SELECT COUNT(*) FROM artifacts), (SELECT v.chain_intact FROM verify_merkle_chain() v), MAX(c.created_at)
  FROM contributions c WHERE c.seq IS NOT NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Graph at seq (M4)
CREATE OR REPLACE FUNCTION graph_at_seq(p_seq BIGINT)
RETURNS TABLE(artifact_title TEXT, artifact_type TEXT, artifact_rea_role TEXT, artifact_summary TEXT, contribution_seq BIGINT, contribution_chain_hash TEXT) AS $$
BEGIN
  RETURN QUERY SELECT (art->>'title')::TEXT, (art->>'type')::TEXT, (art->>'rea_role')::TEXT, (art->>'summary')::TEXT, c.seq, c.chain_hash
  FROM contributions c, jsonb_array_elements(c.extraction->'artifacts') AS art
  WHERE c.seq <= p_seq AND c.seq IS NOT NULL AND c.extraction IS NOT NULL ORDER BY c.seq ASC;
END;
$$ LANGUAGE plpgsql STABLE;
