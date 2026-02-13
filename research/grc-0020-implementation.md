# GRC-20 Implementation Report — commons.id/app

**Date:** 2026-02-13  
**Author:** Nou, Collective Intelligence Agent at Techne Studio  
**Spec:** [GRC-20: Knowledge Graph](https://github.com/geobrowser/grcs/blob/main/grcs/grc-0020.md)  
**Authors:** Yaniv Tal, Byron Guina, Preston Mantel, Nik Graf  
**Stage:** Final (2026-02-12)  
**Status:** Research only. No implementation performed.

---

## What is GRC-20?

GRC-20 is a **binary property graph format for decentralized knowledge networks**. It defines how to represent, modify, and synchronize graph data across trust boundaries. Think of it as a universal wire format for knowledge graphs — like how ERC-20 standardized fungible tokens, GRC-20 standardizes knowledge graph operations.

### Core Design Principles

1. **Property graph model** — Entities (nodes) connected by Relations (directed edges). Relations are first-class and can hold attributes.
2. **Event-sourced** — All state changes expressed as atomic operations (ops). History is append-only.
3. **Total ordering** — Onchain publishing provides provenance and global consensus over state.
4. **Pluralistic** — Multiple "spaces" can hold conflicting views of the same entity. Consumers choose which to trust.
5. **Binary encoding** — Optimized for compressed wire size and decode speed.

### Key Concepts

| GRC-20 Concept | Description |
|---------------|-------------|
| **Entity** | A node in the graph (person, idea, artifact) |
| **Relation** | A directed edge between entities, itself a first-class node |
| **Property** | A named attribute (Name, Description, etc.) — itself an entity |
| **Value** | A property instance on an entity (typed: TEXT, INTEGER, DATETIME, POINT, EMBEDDING, etc.) |
| **Op** | An atomic mutation (CreateEntity, UpdateEntity, DeleteEntity, CreateRelation, etc.) |
| **Edit** | A batch of ops with author IDs, timestamp, and metadata |
| **Space** | A governance container — determines who can publish edits and how conflicts resolve |

---

## Why This Matters for commons.id

commons.id and GRC-20 share deep structural alignment:

| commons.id | GRC-20 | Alignment |
|-----------|--------|-----------|
| Artifacts (ideas, commitments, proposals) | Entities with typed properties | Direct mapping |
| Artifact relationships | Relations (first-class, directed, typed) | Direct mapping |
| Contributions | Edits (batched ops with author + timestamp) | Direct mapping |
| Convergence chain (append-only hash chain) | Onchain edit log (append-only, totally ordered) | Structural equivalent |
| e/H-LAM/T/S dimension tags | Type relations (entity → type entity) | Direct mapping |
| Participants | Entities with Person type | Direct mapping |
| Coordination signals | Relations (participant → artifact, type: "signals") | Natural fit |

**The convergence is striking.** commons.id already operates as an event-sourced knowledge graph with append-only history. GRC-20 formalizes the wire format and adds decentralized synchronization. Adopting GRC-20 would give commons.id interoperability with any GRC-20-compatible knowledge graph — including Geo Browser's network.

---

## Proposed Implementation: GRC-20 Export Layer

The most intuitive integration is an **export layer** that translates commons.id's existing knowledge graph into GRC-20 edits. This preserves the current Supabase-backed architecture while making the graph available to the decentralized knowledge network.

### Architecture

```
commons.id (Supabase)                    GRC-20 Network
┌───────────────────┐                   ┌──────────────────┐
│ Contributions     │                   │                  │
│ → Extraction      │                   │ GRC-20 Space:    │
│ → Artifacts       │──── Export ──────▶│ commons.id       │
│ → Relationships   │    (Edge Fn)      │                  │
│ → Chain           │                   │ Edits on IPFS    │
│                   │                   │ Hashes onchain   │
└───────────────────┘                   └──────────────────┘
```

### Phase 1: Schema Mapping

Map commons.id entities to GRC-20 property graph format.

**Entity Types (as GRC-20 Type entities):**

| commons.id Type | GRC-20 Entity Type | Properties |
|----------------|-------------------|------------|
| Artifact | `commons:Artifact` | Name (TEXT), Summary (TEXT), Type (TEXT), REA Role (TEXT), Created (DATETIME) |
| Participant | `commons:Participant` | Name (TEXT), Bio (TEXT), Affiliation (TEXT), Skills (TEXT), Location (POINT) |
| Convergence | `commons:Convergence` | Name (TEXT), Description (TEXT), Start (DATETIME), End (DATETIME), Location (POINT) |
| Session | `commons:Session` | Title (TEXT), Description (TEXT), Time (DATETIME) |
| Tag | `commons:Tag` | Name (TEXT), Category (TEXT) |

**Relation Types:**

| commons.id Relationship | GRC-20 Relation Type | From → To |
|------------------------|---------------------|-----------|
| artifact_relationships | `commons:relatedTo`, `commons:dependsOn`, etc. | Artifact → Artifact |
| artifact_tags | `commons:taggedWith` | Artifact → Tag |
| artifact_dimensions | `commons:dimension` | Artifact → Dimension Type |
| artifact_participants | `commons:attributedTo` | Artifact → Participant |
| coordination_interests | `commons:signals` | Participant → Artifact |
| contribution → artifacts | `commons:extractedFrom` | Artifact → Contribution |

**Dimension Types as Entities:**

The e/H-LAM/T/S dimensions become GRC-20 Type entities:

```
commons:dim:e  → ecology       (POINT data welcome — bioregional context)
commons:dim:H  → human         
commons:dim:L  → language      
commons:dim:A  → artifacts     
commons:dim:M  → methodology   
commons:dim:T  → training      
commons:dim:S  → sessions      
```

### Phase 2: Convergence Chain → GRC-20 Edit Log

This is the deepest alignment. commons.id's convergence chain is already an append-only sequence of contributions. Each contribution maps naturally to a GRC-20 Edit:

```
Contribution #5 in commons.id chain:
  seq: 5
  chain_hash: "abc123..."
  content: "The regenerative economics panel proposed..."
  extraction: { artifacts: [...], relationships: [...] }

→ GRC-20 Edit:
  authors: [participant_uuid]
  timestamp: contribution.created_at
  ops: [
    CreateEntity { id: artifact_1_uuid, values: [Name, Summary, Type] },
    CreateRelation { type: commons:dimension, from: artifact_1, to: dim:M },
    CreateRelation { type: commons:taggedWith, from: artifact_1, to: tag_regen },
    CreateRelation { type: commons:extractedFrom, from: artifact_1, to: contribution_5 },
    ...
  ]
```

The chain_hash provides additional verification: consumers can validate that the GRC-20 edit log matches the commons.id convergence chain.

### Phase 3: GRC-20 API Endpoint

Add a `/grc20` endpoint to the commons.id Agent API:

| Endpoint | Description |
|----------|-------------|
| `GET /grc20/space` | Space metadata (commons.id space ID, governance info) |
| `GET /grc20/edits` | List edits (GRC-20 format), mapped from contributions |
| `GET /grc20/edits/:seq` | Single edit by chain sequence number |
| `GET /grc20/entities/:id` | Resolved entity state |
| `GET /grc20/types` | List entity types (dimensions, artifact types) |
| `GET /grc20/export` | Full graph export as GRC-20 binary or JSON |

### Phase 4: Onchain Publishing

Publish GRC-20 edit hashes onchain (Base), linking the convergence chain to the decentralized knowledge network:

1. Each contribution processed → GRC-20 Edit serialized → IPFS pin → hash recorded onchain
2. The convergence chain hash AND the GRC-20 edit hash are both recorded, providing dual verification
3. Any GRC-20 indexer can discover and replay the commons.id knowledge graph

---

## Notable GRC-20 Features That Enhance commons.id

### 1. POINT Data Type for Ecological Grounding

GRC-20 natively supports WGS84 coordinates (`POINT { latitude, longitude, altitude }`). This directly serves the ecology (e/) dimension — convergences, sessions, and even artifacts can carry precise geographic context. Boulder, Colorado is not just a string; it's `POINT { 40.0150, -105.2705, 1655 }`.

### 2. EMBEDDING Data Type for Semantic Search

GRC-20 supports dense vector embeddings natively. commons.id could store artifact embeddings directly in the knowledge graph, enabling semantic similarity search across the decentralized network — not just within a single Supabase instance.

### 3. SCHEDULE Data Type for Sessions

The Sessions (S/) dimension maps perfectly to GRC-20's SCHEDULE type (RFC 5545 iCalendar). Unconference sessions can carry structured temporal data that any calendar application can consume.

### 4. Value Refs for Provenance

GRC-20's Value Ref system enables statements about statements: "The source for this artifact's summary is contribution #5." This is exactly the provenance chain that commons.id's convergence chain provides, now expressible in a standard format.

### 5. Pluralistic Spaces

Multiple GRC-20 spaces can hold different views of the same entity. This maps to commons.id's multi-convergence model — ETHBoulder 2026 and ETHDenver 2026 might both reference the same person or idea, each with their own context and perspective. Consumers choose which space(s) to trust.

---

## Implementation Effort Estimate

| Phase | Effort | Dependencies |
|-------|--------|-------------|
| **Phase 1:** Schema mapping document | 1 day | None |
| **Phase 2:** Edit serialization (contribution → GRC-20 ops) | 3-5 days | GRC-20 binary encoder (TypeScript/Deno) |
| **Phase 3:** API endpoints | 2-3 days | Phase 2 |
| **Phase 4:** Onchain publishing | 3-5 days | IPFS pinning service, Base contract |

**Total:** ~2-3 weeks of focused work post-ETHBoulder.

**Key dependency:** A GRC-20 TypeScript/Deno encoder library. The spec references binary encoding (`grc-0020-encoding.md`). If Geo Browser provides an SDK, effort drops significantly.

---

## Risks and Considerations

1. **Spec freshness.** GRC-20 was published 2026-02-12 (yesterday). The spec is marked "Final" but the ecosystem is nascent. Early adoption carries integration risk but also positioning advantage.

2. **Binary encoding complexity.** GRC-20 uses a compact binary format with varint encoding, ZigZag integers, and dictionary-compressed IDs. Implementing a correct encoder requires careful attention to the encoding spec.

3. **Onchain cost.** Publishing edit hashes onchain has gas costs. For a high-throughput event like ETHBoulder (potentially hundreds of contributions), batching edits or using an L2 rollup is advisable.

4. **Governance model.** GRC-20 Spaces have governance rules (who can publish edits). commons.id would need to define its governance — initially single-steward (Todd), potentially expanding to cooperative governance via RegenHub, LCA membership.

5. **Read-only first.** The export layer is strictly one-directional (commons.id → GRC-20). Bidirectional sync (GRC-20 edits → commons.id) is significantly more complex and should be deferred.

---

## Strategic Value

**For commons.id:** Adopting GRC-20 transforms the knowledge graph from a single-instance Supabase database into a participant in a decentralized knowledge network. Artifacts become discoverable and verifiable beyond commons.id itself. The convergence chain gains onchain finality.

**For the GRC-20 ecosystem:** commons.id provides a live, event-driven knowledge graph with real content from ETHBoulder 2026. Most knowledge graph specs launch with synthetic data. commons.id would contribute genuine human knowledge from day one.

**For Techne's thesis:** GRC-20 is a Layer 3 (Relationship) and Layer 4 (Event) pattern in the Seven-Layer Pattern Stack. Implementing it validates the composability thesis — the same knowledge, expressed in a standard format, becomes available to any tool that speaks the protocol. Transparency enables coordination.

---

## Recommendation

1. **Immediate:** Share this report with the Geo Browser team at ETHBoulder. Identify whether a TypeScript encoder exists or is planned.
2. **During ETHBoulder:** Capture knowledge in commons.id as planned. The data is the asset; the export format can be applied retroactively.
3. **Post-ETHBoulder (Week 1):** Implement Phase 1-2 (schema mapping + edit serialization). Produce GRC-20 JSON exports of ETHBoulder data.
4. **Post-ETHBoulder (Week 2-3):** Implement Phase 3 (API endpoint) and begin Phase 4 (onchain publishing) if SDK is available.

The convergence chain already provides the event-sourced foundation. GRC-20 gives it a lingua franca.

---

## References

- [GRC-20 Specification](https://github.com/geobrowser/grcs/blob/main/grcs/grc-0020.md)
- [Geo Browser](https://geobrowser.io) — The team behind GRC-20
- [commons.id Agent API](https://hvbdpgkdcdskhpbdeeim.supabase.co/functions/v1/api/) — Current API
- [commons.id Agent Guidelines](https://hvbdpgkdcdskhpbdeeim.supabase.co/functions/v1/api/guidelines) — Bot norms
- [Convergence Chain](https://hvbdpgkdcdskhpbdeeim.supabase.co/functions/v1/api/chain) — Append-only verification

---

*Research conducted by Nou for Techne Studio / RegenHub, LCA. No implementation performed.*
