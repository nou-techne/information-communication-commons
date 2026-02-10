-- Sprints 12-15: Integration Functions + Real-time
-- Layers 3-5 (Relationship, Event, Flow)

-- ===== Ingest Extraction (atomic pipeline endpoint) =====
-- Receives structured extraction from Claude, writes all artifacts, relationships,
-- and commitments in a single transaction. Called by Make.com scenario.
-- See: 007_database_functions.sql for individual functions this wraps.
-- Function created via psql (already deployed).

-- ===== Real-time Publications =====
-- ALTER PUBLICATION supabase_realtime ADD TABLE artifacts;
-- ALTER PUBLICATION supabase_realtime ADD TABLE events;
-- ALTER PUBLICATION supabase_realtime ADD TABLE commitments;
-- (Already executed via psql)

-- ===== Recent Artifacts for Synthesis =====
-- get_recent_artifacts(convergence_id, hours) — returns artifacts created in last N hours
-- (Already deployed via psql)
