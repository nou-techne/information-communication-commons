# Bonfires.ai Integration Research — commons.id/app

**Date:** 2026-02-13  
**Author:** Nou, Techne Collective Intelligence Agent  
**Status:** Research complete. No implementation performed.  
**Sponsor context:** Bonfires.ai is an ETHBoulder 2026 sponsor.

---

## What is Bonfires.ai?

Bonfires.ai is a **collective sensemaking platform** powered by AI. Each "Bonfire" is a community-driven knowledge space with its own:

- **Knowledge graph** (entities, relationships, episodes)
- **AI agent** with episodic memory
- **Data rooms** (monetizable knowledge packages)
- **Hyperblogs** (AI-generated long-form content from graph data)

Their backend, **Delve**, provides a REST API for knowledge graph search, content ingestion, agent memory, and graph traversal. The system processes raw text into "episodes" (20-minute activity summaries), extracts entities and relationships, and builds a queryable knowledge graph.

**Base URL:** `https://tnt-v2.api.bonfires.ai`  
**Auth:** API key (Bearer token) scoped to bonfire(s)  
**Docs:** [docs.bonfires.ai](https://docs.bonfires.ai)

---

## Architectural Overlap

Both commons.id and Bonfires.ai share a remarkably similar core loop:

| Step | commons.id | Bonfires.ai |
|------|-----------|-------------|
| **Ingest** | Contributions (text) submitted via app or API | Messages, documents, transcripts ingested via API |
| **Extract** | Claude extracts artifacts, relationships, dimension tags | Delve processes into episodes, entities, edges |
| **Structure** | Knowledge graph (artifacts + relationships + tags) | Knowledge graph (entities + relationships + episodes) |
| **Query** | Full-text search, dimension filtering, chain replay | Natural language search (`/delve`), time-windowed queries |
| **Verify** | Convergence chain (append-only hash chain) | No equivalent (no tamper-evidence layer) |
| **Framework** | e/H-LAM/T/S (7 dimensions) | Taxonomy-based labeling |

**Key difference:** commons.id is event-scoped (convergences) with a verification layer. Bonfires.ai is community-scoped with agent memory and incremental graph building.

---

## The Delve API — Key Capabilities

### 1. Knowledge Graph Search (`POST /delve`)
Natural language query against the unified KG. Returns episodes, entities, and edges. Supports:
- Incremental search via `graph_id` (build on previous queries)
- Time-windowed queries (`window_start`, `window_end`)
- Relationship type filtering
- Center-node exploration (`center_node_uuid`)
- MMR diversity tuning (`mmr_lambda`)

### 2. Agent Memory (`/agents/{id}/stack/*`)
Agents can accumulate messages on a "stack," which periodically processes into episodes and writes to the KG. This gives agents persistent, searchable memory across sessions.

### 3. Content Ingestion (`POST /ingest_content`)
Raw text → document → processed into knowledge graph. Async via job system.

### 4. Graph Mutation (`/knowledge_graph/add_triplet`, `/add_triples`)
Direct triplet insertion into the KG — entities and relationships can be added programmatically.

### 5. Hyperblogs
AI-generated long-form content from graph data, scoped by topic. Users provide prompts; the system retrieves relevant graph context and generates blog posts.

---

## Recommended Integration: Dual-Graph Bridge

### The Intuitive Use Case

**commons.id captures what happens at ETHBoulder. Bonfires.ai helps people explore and make sense of it.**

The most natural integration is a **bidirectional bridge** between the two knowledge graphs:

```
commons.id                          Bonfires.ai
┌─────────────┐                    ┌─────────────┐
│ Contribution │───extract────────▶│ Ingest       │
│ submitted    │                   │ to Bonfire   │
│              │                   │              │
│ Artifacts    │◀──delve──────────│ Episodes     │
│ Relationships│                   │ Entities     │
│ Chain        │                   │ Edges        │
└─────────────┘                    └─────────────┘
```

**Flow:**
1. When a contribution is processed in commons.id and artifacts are extracted, the contribution text is also ingested into the ETHBoulder Bonfire via `POST /ingest_content`.
2. Bonfires.ai processes this into its own knowledge graph with its own entity resolution, relationship extraction, and episode formation.
3. Users can then **search the Bonfire** from within commons.id/app using `POST /delve` — getting Bonfires.ai's interpretation of the same knowledge, potentially surfacing connections that commons.id's extraction didn't catch (and vice versa).

### Why This is the Most Intuitive Integration

1. **Zero friction for users.** Participants contribute once (to commons.id). Both knowledge graphs benefit. No duplicate effort.

2. **Complementary extraction.** commons.id uses Claude for structured extraction along the e/H-LAM/T/S framework. Bonfires.ai uses its own pipeline with different entity resolution, episode formation, and taxonomy. Two independent interpretations of the same raw material produce a richer knowledge space.

3. **Bonfires.ai's search is stronger for exploration.** The `/delve` endpoint supports natural language queries with incremental graph building, time windows, and center-node exploration. commons.id's search is full-text against artifact titles/summaries. Integrating `/delve` gives users a more powerful discovery tool.

4. **Bonfires.ai's agent memory serves commons.id's agent API.** The commons.id agent API (`GET /guidelines`) already defines norms for agent interaction. Bonfires.ai's agent stack/process cycle could give the commons.id agent persistent memory across convergences — remembering what happened at ETHBoulder 2025 when preparing for 2026.

5. **Hyperblogs as post-event synthesis.** After ETHBoulder ends, Bonfires.ai can generate Hyperblogs from the accumulated knowledge graph — thematic summaries, pattern analysis, commitment tracking — published at commons.id as living post-event content.

---

## Specific Integration Points

### Phase 1: Read-only bridge (during ETHBoulder)

| Feature | Implementation | Effort |
|---------|---------------|--------|
| **"Explore in Bonfire"** button on artifact detail pages | Link to Bonfires.ai with pre-populated search query matching the artifact title | Trivial (URL construction) |
| **Bonfire search in commons.id** | New search mode that queries `POST /delve` and displays results alongside native search | Medium (new API call + UI) |
| **ETHBoulder Bonfire embed** | Iframe or link to the Bonfires.ai graph viewer for the ETHBoulder bonfire | Trivial |

### Phase 2: Write bridge (post-event)

| Feature | Implementation | Effort |
|---------|---------------|--------|
| **Contribution forwarding** | On successful extraction, POST contribution text to `/ingest_content` with ETHBoulder bonfire_id | Low (webhook/edge function) |
| **Triplet sync** | When commons.id extracts relationships, also add them as triplets via `/knowledge_graph/add_triples` | Medium (mapping schema) |
| **Agent memory** | commons.id's agent API accumulates interaction history on Bonfires.ai agent stack, processes into episodes | Medium |

### Phase 3: Deep integration (post-ETHBoulder)

| Feature | Implementation | Effort |
|---------|---------------|--------|
| **Unified graph view** | Merge commons.id and Bonfires.ai graph data in the 3D graph visualization | High (entity resolution across systems) |
| **Hyperblog generation** | Offer "Generate synthesis" on dimension pages, calling Bonfires.ai hyperblog generation scoped to e/H-LAM/T/S dimensions | Medium |
| **Cross-convergence memory** | Use Bonfires.ai agent memory to persist context across convergences, giving the commons.id agent institutional memory | Medium |

---

## Schema Mapping

| commons.id | Bonfires.ai | Notes |
|-----------|-------------|-------|
| Artifact | Entity | Both are named nodes in a knowledge graph. Artifacts have types (idea, commitment, proposal, etc.); entities have UUIDs. |
| Artifact relationship | Edge | Both connect two nodes with a typed relationship. |
| Contribution | Episode | Both are time-stamped units of ingested content. Contributions are user-submitted; episodes are system-generated from message stacks. |
| Participant | Entity (person type) | commons.id participants map to person-type entities in Bonfires.ai. |
| Dimension tag (hlamt:*) | Taxonomy label | Both classify knowledge. commons.id uses 7 fixed dimensions; Bonfires.ai uses generated taxonomies. |
| Convergence chain | No equivalent | commons.id's tamper-evidence layer has no Bonfires.ai counterpart. |
| Coordination signal | No equivalent | Bonfires.ai doesn't have a signaling/attention mechanism. |

---

## Requirements

- **API key** for the ETHBoulder Bonfire (to be obtained from Bonfires.ai team)
- **Bonfire ID** for the ETHBoulder knowledge space
- **Agent ID** if using agent memory features
- Environment variable: `DELVE_API_KEY`

---

## Risks and Considerations

1. **Data sovereignty.** Contributions ingested into Bonfires.ai leave the commons.id Supabase perimeter. The Peer Production License permits this for non-extractive use. Ensure Bonfires.ai's terms align.

2. **Entity resolution across systems.** The same person or idea may resolve differently in each graph. Phase 3 unification requires a reconciliation strategy.

3. **Latency.** Bonfires.ai's async job system means some operations (summaries, taxonomy, KG ingest) are not instant. The `/delve` search endpoint is synchronous and fast.

4. **Rate limits.** Not documented in the skill file. Clarify with Bonfires.ai team before high-volume ingestion during ETHBoulder.

5. **Dependency.** Adding Bonfires.ai as a search backend creates a runtime dependency. Phase 1 (links only) avoids this; Phase 2+ requires health checks and fallbacks.

---

## Recommendation

**Start with Phase 1 during ETHBoulder.** An "Explore in Bonfire" link on artifact pages is zero-risk, zero-dependency, and immediately demonstrates the partnership. If the ETHBoulder Bonfire is populated (via their own ingestion from the event), the link provides instant value.

**Phase 2 (contribution forwarding) is the highest-value integration.** It's the natural bridge: commons.id captures, both graphs benefit. This can be implemented as an edge function that fires after `process-contribution` completes — a single POST to `/ingest_content` with the contribution text.

**Phase 3 should wait for post-event learnings.** Entity resolution across knowledge graphs is genuinely hard. Let both systems accumulate ETHBoulder data independently, then study where they agree and diverge before attempting unification.

---

## References

- [Bonfires.ai SKILL.md](https://docs.bonfires.ai/bonfires/docs/files/skills/SKILL) — Agent skill for Delve API interaction
- [Bonfires.ai reference.md](https://docs.bonfires.ai/bonfires/docs/files/skills/reference) — Full endpoint catalog
- [commons.id Agent API](https://hvbdpgkdcdskhpbdeeim.supabase.co/functions/v1/api/) — commons.id API root
- [commons.id Agent Guidelines](https://hvbdpgkdcdskhpbdeeim.supabase.co/functions/v1/api/guidelines) — Bot interaction norms

---

*Research conducted by Nou for Techne Studio / RegenHub, LCA. No implementation performed.*
