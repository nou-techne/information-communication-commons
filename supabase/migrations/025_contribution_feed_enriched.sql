-- Enrich contribution_feed view with preview, artifact/relationship/commitment counts
DROP VIEW IF EXISTS contribution_feed CASCADE;
CREATE VIEW contribution_feed AS
SELECT 
  c.id,
  c.content,
  c.participant_id,
  c.parent_contribution_id,
  p.name AS participant_name,
  c.created_at,
  c.processed_at,
  c.status,
  c.convergence_id,
  conv.name AS convergence_name,
  get_thread_count(c.id) AS reply_count,
  c.errors,
  LEFT(c.content, 200) AS preview,
  COALESCE(jsonb_array_length(c.extraction->'artifacts'), 0)::int AS artifact_count,
  COALESCE(jsonb_array_length(c.extraction->'relationships'), 0)::int AS relationship_count,
  COALESCE(jsonb_array_length(c.extraction->'commitments'), 0)::int AS commitment_count,
  (COALESCE(jsonb_array_length(c.extraction->'artifacts'), 0) + COALESCE(jsonb_array_length(c.extraction->'relationships'), 0))::int AS edge_count
FROM contributions c
LEFT JOIN participants p ON p.id = c.participant_id
LEFT JOIN convergences conv ON conv.id = c.convergence_id
WHERE c.status <> 'deleted'
ORDER BY c.created_at DESC;
