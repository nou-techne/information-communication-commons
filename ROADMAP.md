# ICC Roadmap — TIO-Integrated Build

**Venture:** Information & Communications Commons  
**Method:** Technology and Information Office (TIO) — Seven Progressive Design Patterns  
**Stack:** Supabase (database + auth + real-time) · GlideApps (human platform) · Make.com (workflows + ingestion)  
**Target:** MVP/Beta operational for ETHBoulder 2026 post-event synthesis (February 2026)  
**Sprint cadence:** Micro-sprints via heartbeat (~15 min each)

---

## Infrastructure

| Service | Role | Cost | Notes |
|---------|------|------|-------|
| **Supabase** | Database, auth, real-time, storage | $25/mo | Knowledge graph tables, RLS, real-time subscriptions |
| **GlideApps** | Human platform (The Garden, My Thread, Archive) | $60/mo | No-code app builder, mobile-friendly, Supabase integration |
| **Make.com** | Workflow automation (ingestion, extraction, notifications) | $16/mo | Webhooks, API calls, scheduling, Supabase connector |
| **GitHub Pages** | Landing page + docs | Free | Already deployed |
| **Grain** | Conversation recording | Existing | Already in use (Todd + AG recording) |

**Total:** ~$101/month (shared with Habitat infrastructure where possible)

---

## e/H-LAM/T as Build Guidance

Each sprint is evaluated against the framework:

| Element | Build Question | Stack Component |
|---------|---------------|-----------------|
| **e/** | Does this artifact carry place? | Supabase: bioregional metadata fields |
| **H** | Does this serve practitioners? | GlideApps: human-friendly interfaces |
| **L** | Is the vocabulary clear? | Supabase: schema naming, GlideApps: labels |
| **A** | Does this produce durable artifacts? | Supabase: append-only event log |
| **M** | Does this fit the three-state methodology? | Make.com: state-transition workflows |
| **T** | Does this help the system learn? | Supabase: analytics views, GlideApps: feedback forms |

---

## Sprint Roadmap

### Block 1: Foundation (Sprints 1–8)
**Layers 1–2: Identity + State**  
**Roles:** Schema Architect (01), Backend Engineer (02)  
**Goal:** Knowledge graph schema in Supabase, seed data, basic CRUD

#### Sprint 1: Entity Schema
- **Role:** Schema Architect (01)
- **Layer:** 1 (Identity)
- **Deliverable:** Supabase tables for core entities
- **Tables:**
  - `convergences` (id, name, location, bioregion, dates, state: announced/pre/live/post/archived)
  - `participants` (id, name, affiliation, bio, interests[], agent_id?, created_at)
  - `agents` (id, name, type: personal/collective, capabilities[], participant_id?, created_at)
  - `sessions` (id, convergence_id, title, description, location, time_start, time_end, recording_url?)
  - `artifacts` (id, title, summary, type: idea/proposal/commitment/pattern/synthesis/question, state: seed/discussed/proposed/committed/active/completed/archived/superseded, origin_convergence_id, origin_session_id?, created_by, steward_id, created_at, updated_at)

#### Sprint 2: Context Dimensions Schema
- **Role:** Schema Architect (01)
- **Layer:** 1 (Identity)
- **Deliverable:** Dimension tables for e/H-LAM/T metadata
- **Tables:**
  - `artifact_dimensions` (artifact_id, dimension_type: temporal/social/thematic/energetic/spatial, key, value, created_at)
  - `tags` (id, name, category: theme/tent/domain)
  - `artifact_tags` (artifact_id, tag_id)
  - `bioregions` (id, name, watershed, elevation, latitude, longitude, description)
  - `tents` (id, name, description) — e.g., ETHBoulder, Cosmolocal Convergence, Civic Finance Forum

#### Sprint 3: Relationship Schema
- **Role:** Schema Architect (01)
- **Layer:** 1 (Identity)
- **Deliverable:** Edge tables for knowledge graph relationships
- **Tables:**
  - `artifact_relationships` (id, from_artifact_id, to_artifact_id, type: builds_on/extends/contradicts/supersedes/related_to, created_by, created_at)
  - `participant_connections` (id, participant_a_id, participant_b_id, convergence_id, session_id?, context, created_at)
  - `artifact_participants` (artifact_id, participant_id, role: author/contributor/steward/interested, created_at)
  - `artifact_sessions` (artifact_id, session_id, role: discussed_in/emerged_from/presented_in)

#### Sprint 4: Event Log Schema
- **Role:** Schema Architect (01)
- **Layer:** 1 (Identity)
- **Deliverable:** Append-only event log for auditability
- **Tables:**
  - `events` (id, type: artifact.created/artifact.evolved/session.recorded/commitment.made/observation.submitted, entity_type, entity_id, actor_type: human/agent, actor_id, data jsonb, created_at)
  - `commitments` (id, artifact_id, participant_id, description, status: made/in_progress/completed/abandoned, due_date?, progress_notes[], created_at, updated_at)

#### Sprint 5: Supabase Setup + RLS
- **Role:** Backend Engineer (02)
- **Layer:** 2 (State)
- **Deliverable:** Live Supabase project with tables, RLS policies, auth
- **Tasks:**
  - Create Supabase project
  - Run migration scripts (Sprints 1-4)
  - Configure Row Level Security (public read, authenticated write)
  - Enable auth (email + magic link)
  - Enable real-time on `artifacts`, `events`, `commitments`

#### Sprint 6: Seed Data — ETHBoulder 2026
- **Role:** Backend Engineer (02)
- **Layer:** 2 (State)
- **Deliverable:** ETHBoulder convergence record, tents, bioregion, initial participants
- **Seed:**
  - Convergence: ETHBoulder 2026 (Feb 13-16, Boulder, CO, state: pre)
  - Bioregion: Colorado Front Range (South Boulder Creek watershed, 5430ft)
  - Tents: ETHBoulder, Cosmolocal Convergence, Civic Finance Forum
  - Participants: Todd, Aaron Gabriel, + known attendees
  - Tags: initial taxonomy (ethereum, cooperatives, civics, AI, bioregional, governance)

#### Sprint 7: Supabase Functions
- **Role:** Backend Engineer (02)
- **Layer:** 2 (State)
- **Deliverable:** Database functions for common operations
- **Functions:**
  - `create_artifact(title, summary, type, convergence_id, session_id?, created_by, tags[], dimensions[])` — creates artifact + tags + dimensions + event log in single transaction
  - `evolve_artifact(artifact_id, new_state, actor_id, notes)` — state transition + event log
  - `link_artifacts(from_id, to_id, relationship_type, actor_id)` — creates relationship + event log
  - `record_commitment(artifact_id, participant_id, description, due_date?)` — creates commitment + event log

#### Sprint 8: API Validation
- **Role:** Backend Engineer (02)
- **Layer:** 2 (State)
- **Deliverable:** API smoke tests, data integrity checks
- **Tasks:**
  - Test all CRUD operations via Supabase client
  - Validate RLS policies (anon read, auth write)
  - Test database functions
  - Verify event log captures all mutations
  - Verify real-time subscriptions fire on artifact/event changes

---

### Block 2: Integration (Sprints 9–16)
**Layers 3–4: Relationship + Event**  
**Roles:** Integration Engineer (03), Event Systems Engineer (04)  
**Goal:** Make.com ingestion pipeline, Grain → Supabase, agent API endpoints

#### Sprint 9: Make.com Webhook Setup
- **Role:** Integration Engineer (03)
- **Layer:** 3 (Relationship)
- **Deliverable:** Make.com scenarios for inbound data
- **Scenarios:**
  - `grain-webhook` — Receives Grain recording completion → stores transcript URL in sessions table
  - `manual-artifact-submit` — Receives form submission → creates artifact via Supabase function
  - `agent-observation` — Receives agent API call → creates event log entry

#### Sprint 10: Transcript Ingestion Pipeline
- **Role:** Integration Engineer (03)
- **Layer:** 3 (Relationship)
- **Deliverable:** Make.com scenario: Grain transcript → structured extraction → Supabase
- **Pipeline:**
  1. Grain webhook fires (recording complete)
  2. Make.com fetches transcript text
  3. Sends transcript to AI extraction (OpenAI API or Claude API via Make HTTP module)
  4. AI returns structured JSON: entities[], relationships[], proposals[], commitments[]
  5. Make.com iterates results → calls Supabase functions to create artifacts, links, commitments
  6. Logs ingestion event

#### Sprint 11: Entity Extraction Prompt
- **Role:** Event Systems Engineer (04)
- **Layer:** 4 (Event)
- **Deliverable:** Extraction prompt template for conversation → knowledge graph
- **Prompt outputs:**
  - Entities: people mentioned, organizations, projects, ideas, technologies
  - Artifacts: proposals (explicit action items), questions (open threads), patterns (recurring themes)
  - Relationships: who proposed what, what connects to what, what builds on what
  - Commitments: explicit statements of intent ("I will...", "we should...", "let's...")
  - Dimensions: energy level (high/medium/low), maturity (nascent/developing/established), themes[]

#### Sprint 12: Agent API via Supabase
- **Role:** Integration Engineer (03)
- **Layer:** 3 (Relationship)
- **Deliverable:** RESTful API endpoints via Supabase PostgREST + Edge Functions
- **Endpoints:**
  - `GET /artifacts?convergence_id=X&type=proposal&state=active` — Query artifacts
  - `GET /artifacts/:id/relationships` — Get artifact connections
  - `GET /participants/:id/artifacts` — Get participant's artifacts
  - `POST /observations` — Agent submits observation (Edge Function → event log)
  - `GET /convergences/:id/summary` — Aggregated convergence stats
  - `GET /search?q=keyword` — Full-text search across artifacts

#### Sprint 13: Real-Time Subscriptions
- **Role:** Event Systems Engineer (04)
- **Layer:** 4 (Event)
- **Deliverable:** Supabase real-time channels for live updates
- **Channels:**
  - `artifacts:convergence_id=eq.{id}` — New artifacts in a convergence
  - `events:convergence_id=eq.{id}` — All events for a convergence
  - `commitments:participant_id=eq.{id}` — Commitment updates for a participant

#### Sprint 14: Scheduled Synthesis
- **Role:** Event Systems Engineer (04)
- **Layer:** 4 (Event)
- **Deliverable:** Make.com scheduled scenario for periodic synthesis
- **Scenario (runs daily during/post event):**
  1. Query all artifacts created/updated in last 24 hours
  2. Send to AI with synthesis prompt ("Summarize themes, connections, and emerging patterns")
  3. Create synthesis artifact (type: synthesis, state: active)
  4. Link synthesis to source artifacts (relationship: synthesizes)
  5. Notify participants via email (Make.com email module)

#### Sprint 15: Commitment Tracker
- **Role:** Event Systems Engineer (04)
- **Layer:** 4 (Event)
- **Deliverable:** Make.com scheduled scenario for commitment follow-up
- **Scenario (runs weekly post-event):**
  1. Query open commitments older than 7 days without progress update
  2. Send reminder email to commitment holder
  3. If no response after 2 reminders, flag for steward review
  4. Log follow-up event

#### Sprint 16: Integration Testing
- **Role:** Integration Engineer (03)
- **Layer:** 3 (Relationship)
- **Deliverable:** End-to-end test: recording → extraction → knowledge graph → API query
- **Test flow:**
  1. Simulate Grain webhook with sample transcript (Todd + AG conversation)
  2. Verify Make.com pipeline extracts entities correctly
  3. Verify artifacts created in Supabase with correct relationships
  4. Query via API and verify structure
  5. Verify real-time subscription fires
  6. Verify event log is complete

---

### Block 3: Platform (Sprints 17–24)
**Layers 5–7: Flow + Constraint + View**  
**Roles:** Workflow Engineer (05), Compliance & Security (06), Frontend & DevOps (07)  
**Goal:** GlideApps human platform, governance rules, live deployment

#### Sprint 17: GlideApps — The Garden
- **Role:** Frontend & DevOps (07)
- **Layer:** 7 (View)
- **Deliverable:** Main artifact explorer view in GlideApps
- **Features:**
  - Card grid of artifacts (filterable by type, state, tent, theme)
  - Search bar (full-text via Supabase)
  - Artifact detail view (summary, lineage, relationships, steward, dimensions)
  - Color-coded by type (idea: sky, proposal: bright, commitment: warm, pattern: mint, synthesis: pale)

#### Sprint 18: GlideApps — My Thread
- **Role:** Frontend & DevOps (07)
- **Layer:** 7 (View)
- **Deliverable:** Personal view for authenticated participants
- **Features:**
  - My artifacts (authored, contributed, stewarding)
  - My commitments (with status and progress)
  - My connections (people I've connected with, at which sessions)
  - Relevant artifacts (based on interests — simple tag matching)
  - Quick contribute button (add reflection, correction, new artifact)

#### Sprint 19: GlideApps — Contribute
- **Role:** Frontend & DevOps (07)
- **Layer:** 7 (View)
- **Deliverable:** Contribution forms
- **Forms:**
  - New artifact (title, summary, type dropdown, tags multi-select, tent, related artifacts)
  - Reflection (on existing artifact — adds annotation via event log)
  - Connection (link two artifacts with relationship type)
  - Commitment update (progress notes on existing commitment)

#### Sprint 20: GlideApps — Live Pulse
- **Role:** Frontend & DevOps (07)
- **Layer:** 7 (View)
- **Deliverable:** Real-time event feed (for use during convergence)
- **Features:**
  - Live feed of recent events (new artifacts, new connections, new commitments)
  - Powered by Supabase real-time subscriptions
  - Filterable by tent/theme
  - "Just now" / "5 min ago" relative timestamps
  - Highlight cross-session connections

#### Sprint 21: Governance Rules
- **Role:** Compliance & Security (06)
- **Layer:** 6 (Constraint)
- **Deliverable:** RLS policies, consent model, stewardship rules
- **Rules:**
  - Artifacts above "seed" state must have a steward (DB constraint)
  - Chatham House sessions: artifacts anonymize speakers (RLS view)
  - Participants must opt-in to have their conversations extracted (consent flag)
  - Agent-generated content labeled (created_by references agent, not human)
  - Artifact deletion = soft delete (state → archived), never hard delete
  - Event log is append-only (no UPDATE/DELETE on events table)

#### Sprint 22: Workflow Orchestration
- **Role:** Workflow Engineer (05)
- **Layer:** 5 (Flow)
- **Deliverable:** Make.com master workflow connecting all scenarios
- **Orchestration:**
  - Pre-event: Daily context package generation for registered participants
  - During event: Real-time ingestion (Grain → extraction → knowledge graph)
  - Post-event: Daily synthesis + weekly commitment follow-up
  - State transitions: Convergence state changes trigger workflow mode switches
  - Error handling: Failed extractions queued for manual review

#### Sprint 23: Notifications
- **Role:** Workflow Engineer (05)
- **Layer:** 5 (Flow)
- **Deliverable:** Make.com notification scenarios
- **Notifications:**
  - New artifact in your interest area (email, daily digest)
  - Commitment reminder (email, weekly)
  - New synthesis available (email, when generated)
  - Someone connected with you (email, immediate)
  - Configurable: participant sets preferences in GlideApps profile

#### Sprint 24: Beta Launch
- **Role:** Frontend & DevOps (07) + Product Engineer (00)
- **Layer:** Cross-cutting
- **Deliverable:** Live deployment, smoke tests, documentation
- **Tasks:**
  - GlideApps published (public link or QR code)
  - Landing page updated with link to platform
  - API documentation for agent developers
  - Beta onboarding guide (how to register, contribute, use My Thread)
  - Smoke test all workflows end-to-end
  - Monitor Supabase metrics (connections, storage, bandwidth)

---

## RACI Matrix

| Sprint Block | R (Responsible) | A (Accountable) | C (Consulted) | I (Informed) |
|-------------|----------------|-----------------|---------------|--------------|
| Foundation (1-8) | Schema Architect, Backend Engineer | Technical Lead | Integration Engineer | Product Engineer |
| Integration (9-16) | Integration Engineer, Event Systems Engineer | Technical Lead | Backend Engineer | Product Engineer |
| Platform (17-24) | Frontend & DevOps, Workflow Engineer | Product Engineer | Compliance, Integration | All participants |

---

## Timeline

| Block | Sprints | Estimated Time | Target |
|-------|---------|---------------|--------|
| Foundation | 1-8 | ~2 hours (8 × 15 min) | Feb 10-11 |
| Integration | 9-16 | ~2 hours | Feb 11-12 |
| Platform | 17-24 | ~2 hours | Feb 12-13 |

**Total:** 24 sprints (~6 hours)  
**Beta ready:** February 13, 2026 (ETHBoulder opening day)

---

## Post-Beta Roadmap

### Phase 2: ETHBoulder Live (Feb 13-16)
- Real-time ingestion of ETHBoulder conversations
- Participants use GlideApps during sessions
- Agents observe and extract in real time
- Live Pulse active throughout event

### Phase 3: Post-ETHBoulder Synthesis (Feb 17-28)
- Daily synthesis generation
- Commitment tracking begins
- Pattern extraction across sessions
- Retrospective: what worked, what didn't

### Phase 4: Platform Evolution (March 2026)
- The Garden visualization (visual knowledge graph — may outgrow GlideApps)
- Multi-convergence support (prepare for 2027)
- Agent API v2 (richer queries, batch operations)
- $CLOUD credit integration (metered API access)

---

## Version Mapping

| Version | Block | Milestone |
|---------|-------|-----------|
| 0.1.0 | Foundation (1-8) | Schema + Supabase live |
| 0.2.0 | Integration (9-16) | Ingestion pipeline + agent API |
| 0.3.0 | Platform (17-24) | GlideApps beta + workflows |
| 0.4.0 | ETHBoulder Live | Real-time capture operational |
| 1.0.0 | Post-ETHBoulder | Full synthesis cycle complete |

---

*Built with the TIO pattern stack. Layer order is build order. Identity → State → Relationship → Event → Flow → Constraint → View.*

*Information & Communications Commons · Techne Studio / RegenHub, LCA · 2026*
