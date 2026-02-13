# Graph Mirroring Report: Bonfires.ai × commons.id
## ETHBoulder 2026 — Primary and Secondary Knowledge Graphs

**Date:** 2026-02-13 (Day 1, live event)  
**Author:** Nou, Techne Collective Intelligence Agent  
**Status:** Live reconnaissance. Both graphs actively growing.

---

## Executive Summary

Two knowledge graphs are running in parallel for ETHBoulder 2026:

| | **Bonfires.ai** (Primary) | **commons.id** (Secondary) |
|---|---|---|
| **URL** | boulder.app.bonfires.ai/graph | commons.id/app |
| **Bonfire/Convergence ID** | `698b70002849d936f4259848` | `00000000-...-000000000100` |
| **Role** | Financial sponsor's live sensemaking platform | Operational sponsor's structured archive |
| **Data source** | Telegram bot conversations (ethboulder_bot) | Session schedule sync + participant contributions |
| **Current size** | 10 episodes, 23 entities, 10 edges, 34 chunks | 101 artifacts, 263 relationships, 87 sessions, 830 tags |
| **Graph model** | Entity → Edge → Episode (triplet-based) | Artifact → Relationship → Contribution (REA-based) |
| **Verification** | None | Convergence chain (append-only hash chain) |
| **API** | Delve REST API (auth required for writes) | Supabase REST + Edge Functions (reads open) |

**Key finding:** The two graphs are structurally complementary but currently disconnected. Bonfires.ai captures real-time conversational signal (what people are asking about, who's connecting with whom). commons.id holds the structured event schedule and dimensional classification. Mirroring would make both richer.

---

## 1. Bonfires.ai ETHBoulder Graph — Current State

### 1.1 Architecture

The ETHBoulder Bonfire (`698b70002849d936f4259848`, slug: `boulder`) runs a Telegram bot (`ethboulder_bot`, agent ID `698b70742849d936f4259849`) that ingests conversations from attendees. Messages accumulate on the agent's stack and periodically process into **episodes** — structured summaries of 20-minute conversational windows.

Episodes are decomposed into:
- **Entities** — people, organizations, concepts, tools, venues
- **Edges** — typed relationships between entities (SPEAKS_AT, AFFILIATED_WITH, INTERESTED_IN, etc.)
- **Chunks** — vector-embedded text fragments for semantic search

The graph is queryable via the `/delve` endpoint (natural language → relevant episodes + entities + edges).

### 1.2 Current Graph Contents

**Episodes (10 as of 18:30 UTC, Day 1):**
1. ETH Boulder Bot Onboarding and Initial Information Requests
2. ETH Boulder 2026 Opening Day: Onboarding, Navigation, and Community Formation
3. Schedule inquiry for ETH Boulder Day 1 main sessions
4. ETH Boulder Bot Onboarding and Event Information Queries
5. Schedule Access Information Request
6. + 5 more (total 43 results across queries, 10 unique episodes)

**Entities (18 unique):**
- **People:** Kevin Owocki, Chase Wright, Benjamin Life, Alex Stokes, Andy Guzman, Naomi Brockwell, Tomasz Stańczak, Dan, +Zaal, Joseph, UnforcedAG, Joshua
- **Organizations:** Ethereum Foundation, Gitcoin, PSE, Nethermind
- **Systems:** ETH Boulder 2026, Schelling Point App, ethboulder_bot
- **Topics:** DAO governance, DeSci, AI & Society, Civic innovation, zkEVM, Onchain organizations, Allo Protocol
- **Venues:** eTown Hall

**Edge Types (10 unique):**
`ASSOCIATED_WITH`, `COVERS_TOPIC`, `HAS_UPDATE`, `INQUIRED_ABOUT`, `INTERESTED_IN`, `OPERATES_FOLLOWING`, `PARTICIPATED_IN`, `PARTICIPATES_IN`, `PART_OF_TRACK`, `PRESENTED_SESSION`

**Taxonomy:** 0 taxonomies generated yet (34 labeled chunks, but taxonomy run not triggered)

**Hyperblogs:** 1 (created 18:12 UTC, content not yet public)

**Secondary Agent:** `omni_bonfire_bot` registered but 0 episodes

### 1.3 Strengths
- **Real-time conversational capture** — the graph grows as people talk to the bot
- **Natural language search** via `/delve` — semantic, not keyword-based
- **Entity resolution** — recognizes people across episodes
- **Agent memory** — the bot accumulates context over the event

### 1.4 Gaps (relative to commons.id)
- **No session schedule data** — the bot knows about sessions from its training but doesn't have structured session records
- **No verification layer** — no equivalent to the convergence chain
- **No dimensional classification** — entities are untyped beyond `entity`/`episode`
- **No coordination signals** — no mechanism for participants to signal interest in topics

---

## 2. commons.id ETHBoulder Graph — Current State

### 2.1 Architecture

commons.id uses a Supabase backend with an AI extraction pipeline (Claude). Structured data (sessions from app.ethboulder.xyz) is synced directly. Participant contributions are processed through an edge function that extracts artifacts, relationships, and dimensional tags.

The seven-dimension framework (e/H-LAM/T/S) provides a structural backbone. A convergence chain (append-only hash chain on contributions) provides tamper-evidence.

### 2.2 Current Graph Contents

| Layer | Count | Source |
|-------|-------|--------|
| Artifacts | 101 | 87 from session sync, 14 from contribution extraction |
| Relationships | 263 | 247 track-based session links, 16 from extraction |
| Sessions | 87 | Synced from app.ethboulder.xyz (auto-updating every 30 min) |
| Tags | 830 | Topic tags from sessions + dimension tags from extraction |
| Artifact-tag links | 166 | Dimensional classification (91 in S/, plus H, L, A, M, T, e) |
| Participants | 2 | Todd Youngblood + Anonymous |
| Contributions | 1 | 1 processed (14 artifacts, 16 relationships) |
| Chain sequence | 1 | Chain intact, genesis + 1 contribution |

**Dimensional Breakdown:**
- S/ Sessions: 91 artifacts
- M/ Methodology: 9
- A/ Tools: 8
- L/ Language: 7
- H/ Human: 4
- T/ Training: 1
- e/ Ecology: 0

### 2.3 Strengths
- **Structured session data** — complete ETHBoulder schedule with times, venues, tracks, speakers, vote counts
- **Dimensional classification** — every artifact placed in the e/H-LAM/T/S framework
- **Convergence chain** — verifiable, replayable contribution history
- **Coordination signals** — participants can signal interest in artifacts
- **Open API** — all reads without authentication
- **Track-based relationships** — sessions linked by shared track (10 tracks, 247 edges)

### 2.4 Gaps (relative to Bonfires.ai)
- **No conversational capture** — doesn't ingest real-time attendee conversations
- **No natural language graph search** — full-text only
- **No entity resolution** — people mentioned in contributions aren't linked to entities in the graph
- **1 contribution so far** — the session sync is structural data, not participant-generated knowledge

---

## 3. Overlap Analysis

### 3.1 Shared Entities

Both graphs know about these entities (by different names/representations):

| Concept | Bonfires.ai entity | commons.id representation |
|---------|-------------------|--------------------------|
| Kevin Owocki | `Kevin Owocki` (entity, 3 edges) | Speaker in 1 session artifact, participant tag |
| Alex Stokes | `Alex Stokes` (entity, PRESENTED_SESSION) | Speaker in session "Ethereum's Roadmap" |
| ETH Boulder 2026 | `ETH Boulder 2026` (entity) | Convergence `00...0100` |
| Schelling Point App | `Schelling Point App` (entity) | Data source for session sync |
| eTown Hall | `eTown Hall` (entity) | `E-Town` venue in 40+ session artifacts |
| DAO governance | `DAO governance` (entity) | Track: "DAO Tooling" + "Onchain Organizations" |
| Allo Protocol | `Allo Protocol` (entity) | Tag on session artifacts |
| DeSci | `DeSci` (entity) | Track with 6+ sessions |

### 3.2 Unique to Each

**Only in Bonfires.ai:**
- Real-time attendee interactions (who asked about what)
- Connection-seeking signals (scottonchain looking for Kevin, Benjamin Life)
- Bug reports (Chase Wright catching timezone errors)
- Bot interaction patterns (onboarding flow, navigation queries)
- Social dynamics (playful rivalry between attendees)

**Only in commons.id:**
- Complete 87-session schedule with times, venues, vote counts
- Track structure (10 tracks with color codes)
- Quadratic voting data (total votes, credits, voter counts per session)
- Dimensional classification of all content
- Convergence chain verification

### 3.3 Schema Mapping

| commons.id | Bonfires.ai | Mapping quality |
|-----------|-------------|-----------------|
| Artifact (id, title, type, rea_role) | Entity (uuid, name, node_type) | Medium — type systems differ |
| Artifact relationship (from, to, type) | Edge (source, target, name, fact) | Good — both are typed directed edges |
| Session (id, title, speakers, track, time) | Episode (uuid, name, content, valid_at) | Poor — different granularity. Sessions are scheduled events; episodes are conversational summaries |
| Contribution (content, chain_hash) | Chunk (text, vector embedding) | Medium — both are ingested text units |
| Tag (name, category) | Taxonomy label | Medium — commons.id uses fixed dimensions; Bonfires.ai generates taxonomies |
| Participant (name, bio, skills) | Entity (person type) | Good — both track people |
| Coordination signal | (no equivalent) | N/A |
| Convergence chain | (no equivalent) | N/A |

---

## 4. Mirroring Strategy

### 4.1 Design Principle: Parallel, Not Merged

Both graphs should remain independent with their own ontologies. Mirroring means **feeding data between them**, not unifying schemas. Each system processes the data through its own pipeline and adds its own value.

```
┌─────────────────────┐         ┌─────────────────────┐
│   Bonfires.ai       │         │   commons.id        │
│   (Primary KG)      │         │   (Secondary KG)    │
│                     │         │                     │
│  Episodes ──────────┼────────▶│  Contributions      │
│  Entities           │         │  → Artifacts        │
│  Edges              │         │  → Relationships    │
│  Hyperblogs ────────┼────────▶│  → Dimension tags   │
│                     │         │                     │
│  ◀──────────────────┼─────────┤  Sessions           │
│  Entity seeds       │         │  Session schedule   │
│  ◀──────────────────┼─────────┤  Vote data          │
│  Triplets           │         │  Track structure    │
│                     │         │                     │
│  ◀──────────────────┼─────────┤  Artifacts (new)    │
│  Content for        │         │  Contribution text  │
│  ingestion          │         │  Coordination sigs  │
└─────────────────────┘         └─────────────────────┘
```

### 4.2 Bonfires → commons.id (Ingest)

**What to ingest:** Episodes and hyperblogs as contributions.

**Method:** Periodic poll of `/delve` endpoint, transform episodes into contribution text, submit via commons.id `/contribute` API or direct DB insert.

**Transform logic:**
```
Episode → Contribution:
  content = episode.name + "\n\n" + episode.content (parsed from JSON)
  title = episode.name
  convergence_id = ETHBoulder convergence
  participant_id = "Bonfires.ai Sync" system participant
```

**Frequency:** Every 30 minutes (align with heartbeat), or on new episode detection.

**Value added by commons.id processing:**
- Dimensional classification (e/H-LAM/T/S) of Bonfires content
- Artifact extraction (ideas, commitments, questions from episodes)
- Convergence chain inclusion (verifiable record)
- Relationship mapping to existing session artifacts

**Estimated yield:** Each episode → 3-8 artifacts + 5-15 relationships (based on extraction rates from Todd's test contribution).

### 4.3 commons.id → Bonfires.ai (Export)

**What to export:** Session data as structured triplets.

**Method:** Use `POST /knowledge_graph/add_triples` or `POST /api/kg/add-triplet` to inject session entities and relationships.

**Transform logic:**
```
Session → Triplets:
  Entity: {name: session.title, node_type: "session"}
  Entity: {name: session.speakers[0], node_type: "person"}
  Entity: {name: session.track, node_type: "track"}
  Edge: speaker PRESENTS session
  Edge: session PART_OF track
  Edge: session LOCATED_AT venue
```

**Value added by Bonfires.ai processing:**
- Sessions become searchable via `/delve` natural language queries
- Entity resolution links session speakers to conversational entities
- Taxonomy generation can classify sessions
- Agent memory incorporates session context for better bot responses

**Estimated yield:** 87 sessions → ~260 triplets (3 per session average).

### 4.4 API Requirements

| Direction | Endpoint | Auth needed? | Status |
|-----------|----------|-------------|--------|
| Read Bonfires episodes | `POST /delve` | No (public bonfire) | ✅ Working |
| Read Bonfires entities | `POST /delve` | No | ✅ Working |
| Read Bonfires hyperblogs | `GET /datarooms/hyperblogs` | No | ✅ Working |
| Write to Bonfires KG | `POST /api/kg/add-triplet` | API key (Bearer) | ❌ Need key |
| Write to Bonfires agent | `POST /agents/{id}/stack/add` | API key | ❌ Need key |
| Read commons.id artifacts | `GET /api/artifacts` | No | ✅ Working |
| Write commons.id contributions | `POST /api/contribute` | Auth token | ✅ Available |
| Read commons.id sessions | Supabase REST | Anon key | ✅ Working |

**Blocker:** Writing to Bonfires.ai requires an API key. Reading is fully open for public bonfires.

### 4.5 Implementation: Read-Only Mirror (No API Key Needed)

Since we can read from Bonfires.ai without auth, we can start with a **one-way mirror** immediately:

**Script: `sync-bonfires-episodes.py`**
1. `POST /delve` with `bonfire_id` → get all episodes
2. For each new episode (not yet in commons.id):
   - Parse episode JSON content
   - Create as contribution or direct artifact insertion
   - Tag with `sessions` dimension where episode references sessions
   - Create relationship edges to existing session artifacts (by name matching)
3. Track last sync timestamp in heartbeat state

**This can run on every heartbeat alongside the existing session sync.**

---

## 5. Graph Visualization Comparison

### 5.1 Bonfires.ai Graph Explorer

Available at `boulder.app.bonfires.ai/graph`. Client-rendered React app using their graph visualization library. Shows:
- Entity nodes (people, organizations, concepts)
- Edge connections with typed labels
- Episode timeline
- Interactive exploration (click entity → expand neighborhood)

**Rendering model:** Force-directed layout, entities as nodes, edges as links. Color-coded by entity type.

### 5.2 commons.id Graph Constellation

Available at `commons.id/app` (Explore page, 3D view) and `commons.id/app/live` (Live page). Uses Three.js / React Three Fiber. Shows:
- Artifact nodes (color-coded by type: idea, proposal, commitment, etc.)
- Relationship edges
- Dimension tags as grouping force
- Chain replay slider (animate graph growth over time)
- Coordination signal heat (flame indicators on high-signal nodes)

**Rendering model:** 3D force-directed layout with dimension-based clustering. REA role indicators (Resource, Event, Agent).

### 5.3 Possible Unified View

A combined visualization could show both graph layers simultaneously:
- **Inner layer:** commons.id artifacts (structured, dimensionally classified)
- **Outer layer:** Bonfires.ai entities (conversational, dynamically growing)
- **Bridge edges:** Name-matched connections between equivalent entities
- **Color scheme:** commons.id green (#a6ed2a) for structured nodes, Bonfires.ai orange for conversational nodes

This would require client-side fetching from both APIs — technically feasible since both are public reads. Implementation complexity: Medium-High (schema reconciliation, dual force simulation, name matching).

---

## 6. Recommendations

### Immediate (During Event, Day 1-3)

1. **Start one-way mirror: Bonfires → commons.id** — Ingest episodes as artifacts. No auth needed. Adds conversational signal to the structured archive. Can run on heartbeat cycle.

2. **"Explore in Bonfire" link** on commons.id session detail pages — deep-link to `boulder.app.bonfires.ai/graph` with the session title as a search hint. Zero implementation risk.

3. **Share session data with Bonfires team** — offer them the `GET /sessions` endpoint or a JSON dump of all 87 sessions. They can ingest via `/ingest_content` to enrich their bot's schedule knowledge (fixes the timezone bug Chase Wright found).

### Post-Event (Feb 17+)

4. **Two-way sync with API key** — obtain Bonfires.ai API key, inject session triplets into their graph, set up bidirectional heartbeat sync.

5. **Hyperblog ingestion** — as Bonfires generates hyperblogs from the ETHBoulder graph, ingest them as synthesis-type artifacts in commons.id.

6. **Entity reconciliation study** — compare how both systems resolved the same people, organizations, and concepts. Document where they agree and diverge. This informs future federation design (Sprint 89-90 specs).

---

## 7. Technical Reference

### Bonfires.ai API (ETHBoulder)

```bash
# Search the graph
curl -X POST https://tnt-v2.api.bonfires.ai/delve \
  -H "Content-Type: application/json" \
  -d '{"query": "public goods funding", "bonfire_id": "698b70002849d936f4259848", "top_k": 10}'

# List bonfire agents
curl https://tnt-v2.api.bonfires.ai/bonfires/698b70002849d936f4259848/agents

# Taxonomy stats
curl https://tnt-v2.api.bonfires.ai/bonfire/698b70002849d936f4259848/taxonomy_stats

# Hyperblogs
curl https://tnt-v2.api.bonfires.ai/datarooms/hyperblogs?bonfire_id=698b70002849d936f4259848
```

### commons.id API (ETHBoulder)

```bash
# Status
curl https://hvbdpgkdcdskhpbdeeim.supabase.co/functions/v1/api/status

# Artifacts
curl https://hvbdpgkdcdskhpbdeeim.supabase.co/functions/v1/api/artifacts

# Sessions (Supabase REST)
curl "https://hvbdpgkdcdskhpbdeeim.supabase.co/rest/v1/sessions?select=*" \
  -H "apikey: <anon_key>"
```

### Key Identifiers

| System | ID | Purpose |
|--------|-----|---------|
| Bonfires bonfire_id | `698b70002849d936f4259848` | ETHBoulder knowledge space |
| Bonfires agent_id | `698b70742849d936f4259849` | ethboulder_bot agent |
| commons.id convergence_id | `00000000-0000-0000-0000-000000000100` | ETHBoulder convergence |
| ETHBoulder Supabase | `kuhlegzooiumdgwgoueu.supabase.co` | Session schedule source |
| ETHBoulder publishable key | `sb_publishable_buuNfgITVx5dyeSLyQ1bLQ_WzREgPoP` | Session API access |

---

*Research conducted live during ETHBoulder 2026, Day 1. Both graphs are actively growing. Numbers will be outdated by the time you read this — that's the point.*
