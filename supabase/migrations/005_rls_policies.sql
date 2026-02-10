-- Sprint 5: Row Level Security Policies
-- Layer 2 (State) — Backend Engineer (02)
-- Public read, authenticated write, append-only events

-- ===== Helper: get current participant from auth =====
CREATE OR REPLACE FUNCTION current_participant_id()
RETURNS UUID AS $$
  SELECT id FROM participants WHERE auth_user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ===== Bioregions: public read, admin write =====
ALTER TABLE bioregions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bioregions_read" ON bioregions FOR SELECT USING (true);
CREATE POLICY "bioregions_write" ON bioregions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ===== Tents: public read, admin write =====
ALTER TABLE tents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tents_read" ON tents FOR SELECT USING (true);
CREATE POLICY "tents_write" ON tents FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ===== Convergences: public read, authenticated write =====
ALTER TABLE convergences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "convergences_read" ON convergences FOR SELECT USING (true);
CREATE POLICY "convergences_write" ON convergences FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "convergences_update" ON convergences FOR UPDATE USING (auth.role() = 'authenticated');

-- ===== Participants: public read, self write =====
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants_read" ON participants FOR SELECT USING (true);
CREATE POLICY "participants_insert" ON participants FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "participants_update" ON participants FOR UPDATE USING (auth_user_id = auth.uid());

-- ===== Agents: public read, authenticated write =====
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agents_read" ON agents FOR SELECT USING (true);
CREATE POLICY "agents_write" ON agents FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ===== Sessions: public read, authenticated write =====
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_read" ON sessions FOR SELECT USING (true);
CREATE POLICY "sessions_write" ON sessions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "sessions_update" ON sessions FOR UPDATE USING (auth.role() = 'authenticated');

-- ===== Artifacts: public read, authenticated create, steward/author update =====
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artifacts_read" ON artifacts FOR SELECT USING (true);
CREATE POLICY "artifacts_insert" ON artifacts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "artifacts_update" ON artifacts FOR UPDATE USING (
  steward_id = current_participant_id() OR
  created_by = current_participant_id()
);
-- Soft delete only (state → archived), never hard delete
-- No DELETE policy = no deletes allowed

-- ===== Tags: public read, authenticated write =====
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tags_read" ON tags FOR SELECT USING (true);
CREATE POLICY "tags_write" ON tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ===== Junction tables: public read, authenticated write =====
ALTER TABLE artifact_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artifact_tags_read" ON artifact_tags FOR SELECT USING (true);
CREATE POLICY "artifact_tags_write" ON artifact_tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE artifact_tents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artifact_tents_read" ON artifact_tents FOR SELECT USING (true);
CREATE POLICY "artifact_tents_write" ON artifact_tents FOR INSERT WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE artifact_dimensions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dimensions_read" ON artifact_dimensions FOR SELECT USING (true);
CREATE POLICY "dimensions_write" ON artifact_dimensions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE convergence_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cp_read" ON convergence_participants FOR SELECT USING (true);
CREATE POLICY "cp_write" ON convergence_participants FOR INSERT WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sp_read" ON session_participants FOR SELECT USING (true);
CREATE POLICY "sp_write" ON session_participants FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ===== Relationships: public read, authenticated write =====
ALTER TABLE artifact_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rel_read" ON artifact_relationships FOR SELECT USING (true);
CREATE POLICY "rel_write" ON artifact_relationships FOR INSERT WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE participant_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conn_read" ON participant_connections FOR SELECT USING (true);
CREATE POLICY "conn_write" ON participant_connections FOR INSERT WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE artifact_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ap_read" ON artifact_participants FOR SELECT USING (true);
CREATE POLICY "ap_write" ON artifact_participants FOR INSERT WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE artifact_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "as_read" ON artifact_sessions FOR SELECT USING (true);
CREATE POLICY "as_write" ON artifact_sessions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ===== Events: public read, authenticated insert, NO update/delete (append-only) =====
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_read" ON events FOR SELECT USING (true);
CREATE POLICY "events_insert" ON events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- No UPDATE or DELETE policies = append-only enforced

-- ===== Commitments: public read, authenticated create, owner update =====
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "commitments_read" ON commitments FOR SELECT USING (true);
CREATE POLICY "commitments_insert" ON commitments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "commitments_update" ON commitments FOR UPDATE USING (
  participant_id = current_participant_id()
);
