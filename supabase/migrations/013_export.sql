-- Sprint 27: Data Export (JSON-LD)
-- Function to export convergence data as JSON-LD

CREATE OR REPLACE FUNCTION export_convergence_jsonld(p_convergence_id uuid DEFAULT NULL)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_artifacts jsonb;
  v_relationships jsonb;
  v_participants jsonb;
  v_convergence record;
BEGIN
  -- Get convergence info
  IF p_convergence_id IS NOT NULL THEN
    SELECT * INTO v_convergence FROM convergences WHERE id = p_convergence_id;
  ELSE
    SELECT * INTO v_convergence FROM convergences WHERE is_active = true LIMIT 1;
  END IF;

  -- Export artifacts as schema.org CreativeWork
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    '@type', CASE 
      WHEN a.rea_role = 'agent' THEN 'Person'
      WHEN a.rea_role = 'event' THEN 'Event'
      ELSE 'CreativeWork'
    END,
    '@id', 'https://commons.id/app/artifact/' || a.id,
    'name', a.title,
    'description', COALESCE(a.summary, ''),
    'dateCreated', a.created_at,
    'additionalType', a.type,
    'keywords', (
      SELECT COALESCE(jsonb_agg(t.name), '[]'::jsonb)
      FROM artifact_tags at2
      JOIN tags t ON t.id = at2.tag_id
      WHERE at2.artifact_id = a.id
    )
  )), '[]'::jsonb)
  INTO v_artifacts
  FROM artifacts a
  WHERE (p_convergence_id IS NULL OR a.origin_convergence_id = p_convergence_id);

  -- Export relationships
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    '@type', 'Action',
    'name', r.type,
    'agent', jsonb_build_object('@id', 'https://commons.id/app/artifact/' || r.from_artifact_id),
    'object', jsonb_build_object('@id', 'https://commons.id/app/artifact/' || r.to_artifact_id)
  )), '[]'::jsonb)
  INTO v_relationships
  FROM artifact_relationships r
  JOIN artifacts a1 ON a1.id = r.from_artifact_id
  WHERE (p_convergence_id IS NULL OR a1.origin_convergence_id = p_convergence_id);

  -- Export participants
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    '@type', 'Person',
    '@id', 'https://commons.id/app/p/' || p.id,
    'name', p.name,
    'affiliation', COALESCE(p.affiliation, ''),
    'description', COALESCE(p.bio, '')
  )), '[]'::jsonb)
  INTO v_participants
  FROM participants p;

  -- Build JSON-LD document
  v_result := jsonb_build_object(
    '@context', 'https://schema.org',
    '@type', 'Dataset',
    '@id', 'https://commons.id/app/',
    'name', COALESCE(v_convergence.name, 'commons.id'),
    'description', COALESCE(v_convergence.description, 'Knowledge graph export'),
    'dateModified', NOW(),
    'hasPart', v_artifacts,
    'mentions', v_participants,
    'potentialAction', v_relationships
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
