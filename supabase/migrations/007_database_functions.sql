-- Sprint 7: Database Functions
-- Layer 2 (State) — Backend Engineer (02)
-- Atomic operations for common knowledge graph mutations

-- ===== Create Artifact (with tags, dimensions, event log) =====
CREATE OR REPLACE FUNCTION create_artifact(
  p_title TEXT,
  p_summary TEXT,
  p_type artifact_type,
  p_convergence_id UUID,
  p_session_id UUID DEFAULT NULL,
  p_created_by UUID DEFAULT NULL,
  p_created_by_agent UUID DEFAULT NULL,
  p_steward_id UUID DEFAULT NULL,
  p_tags TEXT[] DEFAULT '{}',
  p_dimensions JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_artifact_id UUID;
  v_tag_id UUID;
  v_tag TEXT;
  v_dim JSONB;
BEGIN
  -- Create the artifact
  INSERT INTO artifacts (title, summary, type, state, origin_convergence_id, origin_session_id, created_by, created_by_agent, steward_id)
  VALUES (p_title, p_summary, p_type, 'seed', p_convergence_id, p_session_id, p_created_by, p_created_by_agent, COALESCE(p_steward_id, p_created_by))
  RETURNING id INTO v_artifact_id;

  -- Add tags (create if they don't exist)
  FOREACH v_tag IN ARRAY p_tags LOOP
    INSERT INTO tags (name) VALUES (v_tag)
    ON CONFLICT (name) DO NOTHING;
    
    SELECT id INTO v_tag_id FROM tags WHERE name = v_tag;
    
    INSERT INTO artifact_tags (artifact_id, tag_id) VALUES (v_artifact_id, v_tag_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Add dimensions
  FOR v_dim IN SELECT * FROM jsonb_array_elements(p_dimensions) LOOP
    INSERT INTO artifact_dimensions (artifact_id, dimension, key, value)
    VALUES (
      v_artifact_id,
      (v_dim->>'dimension')::dimension_type,
      v_dim->>'key',
      v_dim->>'value'
    );
  END LOOP;

  -- Log event
  INSERT INTO events (type, entity_type, entity_id, actor_type, actor_id, convergence_id, data)
  VALUES (
    'artifact.created',
    'artifact',
    v_artifact_id,
    CASE WHEN p_created_by IS NOT NULL THEN 'human' ELSE 'agent' END,
    COALESCE(p_created_by, p_created_by_agent),
    p_convergence_id,
    jsonb_build_object('title', p_title, 'type', p_type::text, 'tags', to_jsonb(p_tags))
  );

  RETURN v_artifact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== Evolve Artifact State =====
CREATE OR REPLACE FUNCTION evolve_artifact(
  p_artifact_id UUID,
  p_new_state artifact_state,
  p_actor_id UUID,
  p_actor_type TEXT DEFAULT 'human',
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_old_state artifact_state;
  v_convergence_id UUID;
BEGIN
  SELECT state, origin_convergence_id INTO v_old_state, v_convergence_id
  FROM artifacts WHERE id = p_artifact_id;

  UPDATE artifacts SET state = p_new_state, updated_at = NOW()
  WHERE id = p_artifact_id;

  INSERT INTO events (type, entity_type, entity_id, actor_type, actor_id, convergence_id, data)
  VALUES (
    'artifact.evolved',
    'artifact',
    p_artifact_id,
    p_actor_type,
    p_actor_id,
    v_convergence_id,
    jsonb_build_object('from_state', v_old_state::text, 'to_state', p_new_state::text, 'notes', p_notes)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== Link Artifacts =====
CREATE OR REPLACE FUNCTION link_artifacts(
  p_from_id UUID,
  p_to_id UUID,
  p_type relationship_type,
  p_actor_id UUID,
  p_actor_type TEXT DEFAULT 'human',
  p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_rel_id UUID;
  v_convergence_id UUID;
BEGIN
  SELECT origin_convergence_id INTO v_convergence_id FROM artifacts WHERE id = p_from_id;

  INSERT INTO artifact_relationships (from_artifact_id, to_artifact_id, type, description, created_by)
  VALUES (p_from_id, p_to_id, p_type, p_description,
    CASE WHEN p_actor_type = 'human' THEN p_actor_id ELSE NULL END)
  RETURNING id INTO v_rel_id;

  INSERT INTO events (type, entity_type, entity_id, actor_type, actor_id, convergence_id, data)
  VALUES (
    'artifact.linked',
    'artifact',
    p_from_id,
    p_actor_type,
    p_actor_id,
    v_convergence_id,
    jsonb_build_object('to_artifact_id', p_to_id, 'relationship', p_type::text, 'description', p_description)
  );

  RETURN v_rel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== Record Commitment =====
CREATE OR REPLACE FUNCTION record_commitment(
  p_artifact_id UUID,
  p_participant_id UUID,
  p_description TEXT,
  p_due_date DATE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_commitment_id UUID;
  v_convergence_id UUID;
BEGIN
  SELECT origin_convergence_id INTO v_convergence_id FROM artifacts WHERE id = p_artifact_id;

  INSERT INTO commitments (artifact_id, participant_id, description, due_date)
  VALUES (p_artifact_id, p_participant_id, p_description, p_due_date)
  RETURNING id INTO v_commitment_id;

  INSERT INTO events (type, entity_type, entity_id, actor_type, actor_id, convergence_id, data)
  VALUES (
    'commitment.made',
    'commitment',
    v_commitment_id,
    'human',
    p_participant_id,
    v_convergence_id,
    jsonb_build_object('description', p_description, 'artifact_id', p_artifact_id, 'due_date', p_due_date)
  );

  RETURN v_commitment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== Submit Observation (agent or human) =====
CREATE OR REPLACE FUNCTION submit_observation(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_actor_type TEXT,
  p_actor_id UUID,
  p_data JSONB,
  p_convergence_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO events (type, entity_type, entity_id, actor_type, actor_id, convergence_id, data)
  VALUES ('observation.submitted', p_entity_type, p_entity_id, p_actor_type, p_actor_id, p_convergence_id, p_data)
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== Full-Text Search =====
CREATE OR REPLACE FUNCTION search_artifacts(
  p_query TEXT,
  p_convergence_id UUID DEFAULT NULL,
  p_type artifact_type DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  summary TEXT,
  type artifact_type,
  state artifact_state,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.title, a.summary, a.type, a.state,
    ts_rank(a.search_vector, websearch_to_tsquery('english', p_query)) AS rank
  FROM artifacts a
  WHERE a.search_vector @@ websearch_to_tsquery('english', p_query)
    AND (p_convergence_id IS NULL OR a.origin_convergence_id = p_convergence_id)
    AND (p_type IS NULL OR a.type = p_type)
  ORDER BY rank DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;
