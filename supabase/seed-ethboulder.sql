-- Sprint 16: Pre-Event Data Seeding (Simplified)
-- Seed ETHBoulder 2026 schedule as artifacts
-- Using state='seed' to bypass steward_required constraint

-- Boulder ecology artifact
INSERT INTO artifacts (id, title, summary, body, type, state, rea_role, created_at)
VALUES (
  'd4da9d1a-0000-0000-0000-000000000001',
  'Boulder, Colorado',
  'ETHBoulder physical location and bioregional context',
  'Boulder sits at 5,430 feet elevation where the Great Plains meet the Rocky Mountains. Part of the South Platte River watershed. High desert climate with 300+ days of sunshine.',
  'pattern',
  'seed',
  'resource',
  NOW()
) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- ETHBoulder event sessions as artifacts (using rea_role='event')
INSERT INTO artifacts (title, summary, type, state, rea_role, created_at) VALUES
  ('Opening Ceremony', 'Welcome to ETHBoulder 2026. Overview of the event, hackathon tracks, and community expectations.', 'pattern', 'seed', 'event', NOW()),
  ('Protocol Design Workshop', 'Hands-on workshop exploring emerging Ethereum protocol improvements and EIP proposals.', 'pattern', 'seed', 'event', NOW()),
  ('Decentralized Identity Panel', 'Panel discussion on DIDs, verifiable credentials, and privacy-preserving identity systems.', 'pattern', 'seed', 'event', NOW()),
  ('Zero-Knowledge Proofs Deep Dive', 'Technical session on ZK-SNARKs, ZK-STARKs, and practical applications in Ethereum.', 'pattern', 'seed', 'event', NOW()),
  ('DAO Governance Case Studies', 'Real-world lessons from operating DAOs at scale. What works, what doesn''t, and why.', 'pattern', 'seed', 'event', NOW()),
  ('Public Goods Funding Mechanisms', 'Exploring quadratic funding, retroactive funding, and new models for sustaining open source.', 'pattern', 'seed', 'event', NOW()),
  ('Layer 2 Scaling Solutions', 'Comparing rollups, sidechains, and state channels. Performance, security, and tradeoffs.', 'pattern', 'seed', 'event', NOW()),
  ('Developer Tooling & DX', 'Improving developer experience: better debuggers, testing frameworks, and deployment tools.', 'pattern', 'seed', 'event', NOW()),
  ('Cryptoeconomics & Mechanism Design', 'Incentive structures, game theory, and designing robust decentralized systems.', 'pattern', 'seed', 'event', NOW()),
  ('Privacy & Compliance', 'Balancing user privacy with regulatory requirements. Privacy pools, mixers, and compliance tools.', 'pattern', 'seed', 'event', NOW()),
  ('Hackathon Kickoff', 'Official start of the 48-hour build sprint. Team formation, idea pitching, and track selection.', 'pattern', 'seed', 'event', NOW()),
  ('Mentor Office Hours', 'One-on-one time with protocol developers, security auditors, and ecosystem builders.', 'pattern', 'seed', 'event', NOW()),
  ('Project Demos & Judging', 'Teams present their hackathon builds. Judges evaluate innovation, execution, and impact.', 'pattern', 'seed', 'event', NOW()),
  ('Closing Ceremony & Awards', 'Announcing winners, distributing prizes, and celebrating the community.', 'pattern', 'seed', 'event', NOW());

-- Seed key participants/speakers as agent artifacts
INSERT INTO artifacts (title, summary, type, state, rea_role, agent_type, created_at) VALUES
  ('Vitalik Buterin', 'Ethereum co-founder and protocol researcher', 'pattern', 'seed', 'agent', 'human', NOW()),
  ('Danny Ryan', 'Ethereum Foundation researcher focused on consensus and proof-of-stake', 'pattern', 'seed', 'agent', 'human', NOW()),
  ('Karl Floersch', 'Optimism researcher and rollup protocol designer', 'pattern', 'seed', 'agent', 'human', NOW()),
  ('ETHBoulder Organizing Team', 'Local organizers and volunteer coordinators', 'pattern', 'seed', 'agent', 'human', NOW());

-- Seed hackathon tracks as proposal artifacts (rea_role='resource' = capacity/opportunity)
INSERT INTO artifacts (title, summary, type, state, rea_role, created_at) VALUES
  ('Public Goods Track', 'Build tools and protocols that strengthen the commons. Retroactive funding, impact evaluation, and coordination mechanisms.', 'proposal', 'seed', 'resource', NOW()),
  ('Privacy & Identity Track', 'Privacy-preserving identity systems, zero-knowledge credentials, and decentralized reputation.', 'proposal', 'seed', 'resource', NOW()),
  ('Layer 2 Scaling Track', 'Build on or improve rollups, app-specific chains, and scalability infrastructure.', 'proposal', 'seed', 'resource', NOW()),
  ('Developer Tooling Track', 'Better debugging, testing, deployment, and monitoring tools for Ethereum developers.', 'proposal', 'seed', 'resource', NOW());

-- Report count
SELECT 
  'Seeded ' || COUNT(*) || ' artifacts (' ||
  SUM(CASE WHEN rea_role = 'event' THEN 1 ELSE 0 END) || ' events, ' ||
  SUM(CASE WHEN rea_role = 'agent' THEN 1 ELSE 0 END) || ' agents, ' ||
  SUM(CASE WHEN rea_role = 'resource' AND type = 'proposal' THEN 1 ELSE 0 END) || ' tracks, ' ||
  SUM(CASE WHEN rea_role = 'resource' AND type = 'pattern' THEN 1 ELSE 0 END) || ' places)'
  AS summary
FROM artifacts
WHERE state = 'seed'
AND created_at > NOW() - INTERVAL '1 minute';
