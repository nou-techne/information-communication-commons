-- Sprint 71: Multi-Thread Consolidation
-- Merge multiple resolved threads into a single consolidated artifact

CREATE OR REPLACE FUNCTION consolidate_threads(p_thread_ids UUID[])
RETURNS UUID AS $$
DECLARE
  v_artifact_id UUID;
  v_content TEXT;
  v_title TEXT;
  v_convergence_id UUID;
  v_tid UUID;
BEGIN
  -- Validate all threads are resolved
  IF EXISTS (
    SELECT 1 FROM threads WHERE id = ANY(p_thread_ids) AND status != 'resolved'
  ) THEN
    RAISE EXCEPTION 'All threads must be resolved before consolidation';
  END IF;

  -- Get convergence from first thread
  SELECT c.convergence_id INTO v_convergence_id
  FROM threads t JOIN channels c ON c.id = t.channel_id
  WHERE t.id = p_thread_ids[1];

  -- Build title from thread titles
  SELECT string_agg(title, ' + ' ORDER BY created_at)
  INTO v_title
  FROM threads WHERE id = ANY(p_thread_ids);

  -- Aggregate all message content across threads
  SELECT string_agg(
    '## ' || t.title || E'\n\n' || msg_content,
    E'\n\n---\n\n' ORDER BY t.created_at
  )
  INTO v_content
  FROM threads t
  CROSS JOIN LATERAL (
    SELECT string_agg(m.content, E'\n\n' ORDER BY m.created_at) AS msg_content
    FROM messages m WHERE m.thread_id = t.id AND m.type != 'system'
  ) msgs
  WHERE t.id = ANY(p_thread_ids);

  -- Create consolidated artifact
  INSERT INTO artifacts (name, description, convergence_id)
  VALUES (
    'Consolidated: ' || v_title,
    COALESCE(v_content, 'Consolidated from ' || array_length(p_thread_ids, 1) || ' threads'),
    v_convergence_id
  )
  RETURNING id INTO v_artifact_id;

  -- Mark all threads as consolidated
  FOREACH v_tid IN ARRAY p_thread_ids LOOP
    UPDATE threads SET status = 'consolidated' WHERE id = v_tid;
  END LOOP;

  RETURN v_artifact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
