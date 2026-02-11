-- Sprint 31: Artifact Merging
-- Admin function to merge duplicate artifacts while preserving relationships and attribution

CREATE OR REPLACE FUNCTION merge_artifacts(
  p_source_artifact_id uuid,
  p_target_artifact_id uuid,
  p_merged_title text DEFAULT NULL,
  p_merged_summary text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_source_artifact record;
  v_target_artifact record;
  v_result jsonb;
  v_relationships_updated integer := 0;
  v_dimensions_moved integer := 0;
  v_tags_moved integer := 0;
  v_participants_moved integer := 0;
BEGIN
  -- Verify both artifacts exist
  SELECT * INTO v_source_artifact FROM artifacts WHERE id = p_source_artifact_id;
  SELECT * INTO v_target_artifact FROM artifacts WHERE id = p_target_artifact_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'One or both artifacts not found';
  END IF;

  -- Use provided title/summary or keep target's
  UPDATE artifacts SET
    title = COALESCE(p_merged_title, title),
    summary = COALESCE(p_merged_summary, summary),
    updated_at = NOW()
  WHERE id = p_target_artifact_id;

  -- Merge relationships: Update all relationships pointing FROM source to point FROM target
  UPDATE artifact_relationships
  SET from_artifact_id = p_target_artifact_id
  WHERE from_artifact_id = p_source_artifact_id;
  
  GET DIAGNOSTICS v_relationships_updated = ROW_COUNT;

  -- Merge relationships: Update all relationships pointing TO source to point TO target
  UPDATE artifact_relationships
  SET to_artifact_id = p_target_artifact_id
  WHERE to_artifact_id = p_source_artifact_id;
  
  v_relationships_updated := v_relationships_updated + ROW_COUNT;

  -- Remove duplicate self-relationships (source->target becomes target->target)
  DELETE FROM artifact_relationships
  WHERE from_artifact_id = to_artifact_id;

  -- Merge dimensions: Copy dimensions from source to target (skip duplicates)
  INSERT INTO artifact_dimensions (artifact_id, dimension, key, value, weight)
  SELECT 
    p_target_artifact_id,
    dimension,
    key,
    value,
    GREATEST(weight, COALESCE((
      SELECT weight FROM artifact_dimensions 
      WHERE artifact_id = p_target_artifact_id 
        AND dimension = ad.dimension 
        AND key = ad.key 
        AND value = ad.value
    ), 0))
  FROM artifact_dimensions ad
  WHERE artifact_id = p_source_artifact_id
  ON CONFLICT (artifact_id, dimension, key, value) DO UPDATE
    SET weight = GREATEST(artifact_dimensions.weight, EXCLUDED.weight);
  
  GET DIAGNOSTICS v_dimensions_moved = ROW_COUNT;

  -- Merge tags: Copy tags from source to target (skip duplicates)
  INSERT INTO artifact_tags (artifact_id, tag_id)
  SELECT p_target_artifact_id, tag_id
  FROM artifact_tags
  WHERE artifact_id = p_source_artifact_id
  ON CONFLICT (artifact_id, tag_id) DO NOTHING;
  
  GET DIAGNOSTICS v_tags_moved = ROW_COUNT;

  -- Merge participants: Copy participant links from source to target
  INSERT INTO artifact_participants (artifact_id, participant_id, role)
  SELECT p_target_artifact_id, participant_id, role
  FROM artifact_participants
  WHERE artifact_id = p_source_artifact_id
  ON CONFLICT (artifact_id, participant_id) DO NOTHING;
  
  GET DIAGNOSTICS v_participants_moved = ROW_COUNT;

  -- Merge sessions (convergence-specific)
  INSERT INTO artifact_sessions (artifact_id, session_id)
  SELECT p_target_artifact_id, session_id
  FROM artifact_sessions
  WHERE artifact_id = p_source_artifact_id
  ON CONFLICT (artifact_id, session_id) DO NOTHING;

  -- Merge tents
  INSERT INTO artifact_tents (artifact_id, tent_id)
  SELECT p_target_artifact_id, tent_id
  FROM artifact_tents
  WHERE artifact_id = p_source_artifact_id
  ON CONFLICT (artifact_id, tent_id) DO NOTHING;

  -- Mark source artifact as merged (soft delete with reference)
  UPDATE artifacts SET
    state = 'merged',
    summary = 'Merged into: ' || p_target_artifact_id::text,
    updated_at = NOW()
  WHERE id = p_source_artifact_id;

  -- Build result summary
  v_result := jsonb_build_object(
    'success', true,
    'source_artifact_id', p_source_artifact_id,
    'target_artifact_id', p_target_artifact_id,
    'relationships_updated', v_relationships_updated,
    'dimensions_moved', v_dimensions_moved,
    'tags_moved', v_tags_moved,
    'participants_moved', v_participants_moved,
    'merged_at', NOW()
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only authenticated users with admin role can merge
-- (Add admin role check in production)
GRANT EXECUTE ON FUNCTION merge_artifacts(uuid, uuid, text, text) TO authenticated;

-- Add 'merged' state to artifact state enum (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'merged' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'artifact_state')
  ) THEN
    ALTER TYPE artifact_state ADD VALUE 'merged';
  END IF;
END $$;

COMMENT ON FUNCTION merge_artifacts IS 'Sprint 31: Merge duplicate artifacts, preserving all relationships and attribution';
