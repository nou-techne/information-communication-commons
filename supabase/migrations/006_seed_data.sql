-- Sprint 6: Seed Data — ETHBoulder 2026
-- Layer 2 (State) — Backend Engineer (02)
-- Initial convergence, bioregion, tents, tags

-- ===== Bioregion: Colorado Front Range =====
INSERT INTO bioregions (id, name, watershed, elevation_ft, latitude, longitude, description)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Colorado Front Range',
  'South Boulder Creek → Boulder Creek → St. Vrain Creek → South Platte → Missouri → Mississippi → Gulf of Mexico',
  5430,
  40.0150,
  -105.2705,
  'Southern Rocky Mountain Steppe. Where the Great Plains meet the Rocky Mountains. The Flatirons (Fountain Formation sandstone, ~290 million years old) rise directly west. Alluvial plain where mountain meets prairie.'
);

-- ===== Tents =====
INSERT INTO tents (id, name, description) VALUES
  ('00000000-0000-0000-0000-000000000010', 'ETHBoulder', 'Ethereum community, public goods, open source technology'),
  ('00000000-0000-0000-0000-000000000011', 'Cosmolocal Convergence', 'Technology + society, local-first communities, agent orchestration, cosmological patterns'),
  ('00000000-0000-0000-0000-000000000012', 'Civic Finance Forum', 'Civics, governance, cooperative economics, democratic finance');

-- ===== Convergence: ETHBoulder 2026 =====
INSERT INTO convergences (id, name, description, location, bioregion_id, state, date_start, date_end)
VALUES (
  '00000000-0000-0000-0000-000000000100',
  'ETHBoulder 2026',
  'Annual Ethereum and public goods convergence in Boulder, Colorado. Third year. Features hackathon, unconference sessions, and the General Forum on Ethereum Localism (GFEL).',
  'Boulder, Colorado',
  '00000000-0000-0000-0000-000000000001',
  'pre',
  '2026-02-13',
  '2026-02-16'
);

-- ===== Tags (initial taxonomy) =====
INSERT INTO tags (name, category) VALUES
  -- Domains
  ('ethereum', 'domain'),
  ('cooperatives', 'domain'),
  ('public goods', 'domain'),
  ('civic infrastructure', 'domain'),
  ('bioregional', 'domain'),
  ('governance', 'domain'),
  ('AI', 'domain'),
  ('agent orchestration', 'domain'),
  ('knowledge graphs', 'domain'),
  ('decentralized systems', 'domain'),
  -- Themes
  ('cosmolocal', 'theme'),
  ('amplifying aliveness', 'theme'),
  ('information commons', 'theme'),
  ('collective intelligence', 'theme'),
  ('scenius', 'theme'),
  ('local-first', 'theme'),
  ('intelligence amplification', 'theme'),
  ('regenerative economics', 'theme'),
  -- Methods
  ('unconference', 'method'),
  ('hackathon', 'method'),
  ('bonfire AI', 'method'),
  ('swarm intelligence', 'method'),
  ('event sourcing', 'method');

-- ===== Initial Participants =====
INSERT INTO participants (id, name, affiliation, interests) VALUES
  ('00000000-0000-0000-0000-000000001001', 'Todd Youngblood', 'Techne Studio / RegenHub', ARRAY['information commons', 'cooperative economics', 'civic finance', 'agent orchestration', 'scenius']),
  ('00000000-0000-0000-0000-000000001002', 'Aaron Gabriel', 'Clawsmos', ARRAY['agent orchestration', 'cosmolocal', 'swarm intelligence', 'amplifying aliveness', 'knowledge graphs']);

-- ===== Initial Agent =====
INSERT INTO agents (id, name, type, participant_id, capabilities) VALUES
  ('00000000-0000-0000-0000-000000002001', 'Nou', 'collective', NULL, ARRAY['synthesis', 'extraction', 'coordination', 'observation', 'stewardship']);

-- ===== Register participants for ETHBoulder =====
INSERT INTO convergence_participants (convergence_id, participant_id, state) VALUES
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000001001', 'stewarding'),
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000001002', 'contributing');

-- ===== Seed Artifact: The founding conversation =====
INSERT INTO artifacts (id, title, summary, type, state, origin_convergence_id, created_by, steward_id)
VALUES (
  '00000000-0000-0000-0000-000000003001',
  'Information & Communications Commons',
  'A knowledge-graph-backed living archive that carries ideas, relationships, and commitments across convergence events. Three temporal states (pre, during, post). e/H-LAM/T as design framework. Agent API + human platform.',
  'proposal',
  'active',
  '00000000-0000-0000-0000-000000000100',
  '00000000-0000-0000-0000-000000001001',
  '00000000-0000-0000-0000-000000001001'
);

-- Tag the founding artifact
INSERT INTO artifact_tags (artifact_id, tag_id)
SELECT '00000000-0000-0000-0000-000000003001', id
FROM tags WHERE name IN ('information commons', 'knowledge graphs', 'agent orchestration', 'collective intelligence');

-- Link to all three tents
INSERT INTO artifact_tents (artifact_id, tent_id) VALUES
  ('00000000-0000-0000-0000-000000003001', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000003001', '00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000003001', '00000000-0000-0000-0000-000000000012');

-- Add dimensions to founding artifact
INSERT INTO artifact_dimensions (artifact_id, dimension, key, value) VALUES
  ('00000000-0000-0000-0000-000000003001', 'spatial', 'location', 'Boulder, Colorado'),
  ('00000000-0000-0000-0000-000000003001', 'spatial', 'bioregion', 'Colorado Front Range'),
  ('00000000-0000-0000-0000-000000003001', 'energetic', 'energy', 'high'),
  ('00000000-0000-0000-0000-000000003001', 'energetic', 'maturity', 'developing'),
  ('00000000-0000-0000-0000-000000003001', 'temporal', 'convergence_state', 'pre');

-- Log the creation event
INSERT INTO events (type, entity_type, entity_id, actor_type, actor_id, convergence_id, data)
VALUES (
  'artifact.created',
  'artifact',
  '00000000-0000-0000-0000-000000003001',
  'human',
  '00000000-0000-0000-0000-000000001001',
  '00000000-0000-0000-0000-000000000100',
  '{"source": "Todd + Aaron Gabriel conversation, Feb 10, 2026", "note": "Founding artifact of the Information & Communications Commons"}'::jsonb
);
