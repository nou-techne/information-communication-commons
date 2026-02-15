# W3C Standards Adoption Plan for commons.id

## Overview

commons.id already implements several patterns that have W3C equivalents. Adopting these standards makes the knowledge graph interoperable, federable, and legible to the broader web ecosystem. This plan maps existing commons.id features to W3C specifications and outlines the implementation path.

## Standards Map

| commons.id Feature | W3C Standard | Status | Priority |
|---|---|---|---|
| Participant identity | DID (Decentralized Identifiers) | New | HIGH |
| Auth + attestations | Verifiable Credentials (VCs) | New | HIGH |
| Knowledge graph data | JSON-LD / RDF | Partial (JSON, not yet LD) | HIGH |
| Convergence chain | PROV-O (Provenance Ontology) | Conceptual match | MEDIUM |
| Contributions | Web Annotation | Conceptual match | MEDIUM |
| Federation (cross-instance) | ActivityPub / Activity Streams 2.0 | Planned | MEDIUM |
| API responses | JSON-LD context headers | New | LOW |
| Accessibility | WCAG 2.2 | Partial | ONGOING |

## Phase 1: Identity Layer (DID + Verifiable Credentials)

### W3C DID (Decentralized Identifiers)
**Spec:** https://www.w3.org/TR/did-core/

**Current state:** Participants have Supabase auth UUIDs + optional ENS names. No standard identifier format.

**Implementation:**
1. Assign each participant a DID. Two methods supported:
   - `did:web:commons.id:p:{participant-slug}` — web-resolvable, low friction
   - `did:ethr:{ethereum-address}` — for participants with onchain identity (ENS, ERC-8004)
2. Add `did` column to `participants` table
3. Create DID Document endpoint at `commons.id/.well-known/did.json` (for the commons.id instance itself) and `commons.id/p/{slug}/did.json` (per participant)
4. DID Document includes:
   - Public keys (from auth provider)
   - Service endpoints (commons.id profile, ENS, social links)
   - Controller (self or cooperative for agent DIDs)

**Effort:** 2-3 sprints

### W3C Verifiable Credentials
**Spec:** https://www.w3.org/TR/vc-data-model-2.0/

**Current state:** Contributions are attributed to participants but not cryptographically verifiable. The convergence chain provides integrity but not identity attestation.

**Implementation:**
1. Issue VCs for:
   - Convergence participation ("Todd participated in ETHBoulder 2026")
   - Contribution authorship ("This contribution was authored by did:web:commons.id:p:todd")
   - Coordination signals ("Todd signaled interest in dimension:methodology")
2. VC format: JSON-LD with Ed25519 signatures
3. Issuer: the commons.id instance (did:web:commons.id)
4. Storage: VC field on contributions table + exportable as JSON
5. Verification endpoint: `api.commons.id/verify/{credential-id}`

**Effort:** 3-4 sprints

## Phase 2: Semantic Knowledge Graph (JSON-LD / RDF)

### JSON-LD Context
**Spec:** https://www.w3.org/TR/json-ld11/

**Current state:** API returns plain JSON. The knowledge graph has implicit semantics (artifacts, relationships, dimensions) but no formal ontology.

**Implementation:**
1. Define a commons.id JSON-LD context at `commons.id/ns/v1`
2. Map existing types to established vocabularies:
   ```
   Artifact      → schema:CreativeWork
   Participant   → schema:Person / schema:Organization
   Contribution  → schema:Action (with prov:wasGeneratedBy)
   Relationship  → schema:Property (typed edges)
   Convergence   → schema:Event
   Session       → schema:Event (subtype)
   Dimension     → skos:Concept
   ```
3. Add `@context` header to all API responses
4. Provide alternate content negotiation: `Accept: application/ld+json` returns JSON-LD, default returns plain JSON (backward compatible)
5. SPARQL endpoint (optional, future): expose the graph as an RDF triple store for federated queries

**Effort:** 3-4 sprints

### Vocabulary Alignment
Map the H-LAM/T/S dimension tags to SKOS (Simple Knowledge Organization System):
```
E (Ecology)      → skos:Concept in scheme:commons-dimensions
H (Human)        → skos:Concept
L (Language)      → skos:Concept
A (Artifact)      → skos:Concept
M (Methodology)   → skos:Concept
T (Training)      → skos:Concept
S (Session)       → skos:Concept
```

**Effort:** 1 sprint

## Phase 3: Provenance (PROV-O)

### W3C PROV Ontology
**Spec:** https://www.w3.org/TR/prov-o/

**Current state:** The convergence chain (Merkle chain) tracks provenance as sequential hashes. Contributions have timestamps, authors, and chain positions.

**Implementation:**
1. Map convergence chain to PROV:
   ```
   Contribution  → prov:Entity
   Extraction    → prov:Activity (the AI processing step)
   Participant   → prov:Agent
   Convergence   → prov:Collection
   chain_hash    → prov:wasDerivedFrom (previous contribution)
   ```
2. Add PROV-O triples to the JSON-LD output
3. The chain replay function already exists — expose it as a PROV Bundle that can be independently verified
4. This makes the convergence chain legible to any PROV-compatible system

**Effort:** 2 sprints

## Phase 4: Annotations and Contributions (Web Annotation)

### W3C Web Annotation
**Spec:** https://www.w3.org/TR/annotation-model/

**Current state:** Contributions reference artifacts and generate relationships. Thread messages reference contributions.

**Implementation:**
1. Model contributions as Web Annotations where applicable:
   ```
   {
     "@context": "http://www.w3.org/ns/anno.jsonld",
     "type": "Annotation",
     "body": { contribution content },
     "target": { convergence or artifact being annotated },
     "creator": { participant DID },
     "created": "2026-02-15T..."
   }
   ```
2. Coordination signals become annotation motivations (bookmarking, classifying, linking)
3. Expose Web Annotation Protocol endpoints for programmatic access

**Effort:** 2-3 sprints

## Phase 5: Federation (ActivityPub)

### W3C ActivityPub / Activity Streams 2.0
**Spec:** https://www.w3.org/TR/activitypub/

**Current state:** Cross-instance artifact format planned (Sprint 90). No federation protocol yet.

**Implementation:**
1. Each commons.id instance is an ActivityPub Actor
2. Contributions become Create activities
3. Coordination signals become Like/Announce activities
4. Cross-instance artifact sharing via ActivityPub federation:
   - commons.id (Boulder) can follow commons.id (Berlin) instance
   - New contributions propagate as Activities
   - Artifacts can be boosted across instances
5. Agent-to-agent communication channels could use ActivityPub as the transport layer (replacing Discord dependency)

**Effort:** 5-8 sprints (largest phase)

## Phase 6: Accessibility (WCAG 2.2)

### W3C Web Content Accessibility Guidelines
**Spec:** https://www.w3.org/TR/WCAG22/

**Current state:** Basic accessibility from React component library. Not audited.

**Implementation:**
1. WCAG 2.2 Level AA audit of all pages
2. Fix: color contrast (lime on dark may fail), keyboard navigation, screen reader labels, focus management
3. Add skip links, ARIA landmarks, alt text for graph visualizations
4. Test with screen reader (NVDA/VoiceOver)

**Effort:** 2-3 sprints (can be interleaved)

## Implementation Roadmap

### Immediate (next sprint series)
- JSON-LD context definition + API content negotiation
- DID column on participants table + did:web resolution
- SKOS vocabulary for H-LAM/T/S dimensions

### Near-term (Q1 2026)
- Verifiable Credentials for contributions and participation
- PROV-O mapping for convergence chain
- WCAG 2.2 audit and fixes

### Medium-term (Q2 2026)
- Web Annotation model for contributions
- ActivityPub federation between commons.id instances
- SPARQL endpoint for federated graph queries

## Benefits

1. **Interoperability:** Any W3C-compatible system can read and verify commons.id data
2. **Federation:** Multiple commons.id instances can share artifacts without platform dependency
3. **Verifiability:** Contributions and participation are cryptographically attestable
4. **Discoverability:** JSON-LD makes the knowledge graph indexable by search engines and AI systems
5. **Sovereignty:** DID-based identity means participants own their identifiers across instances
6. **Accessibility:** WCAG compliance ensures the commons is actually common — accessible to everyone

## Relationship to Existing Architecture

The W3C adoption does NOT require rewriting the existing system. It is an additive layer:
- Supabase remains the data store
- React app remains the frontend
- GitHub Pages remains the host
- The convergence chain continues as-is

What changes: API responses gain JSON-LD context, participants gain DIDs, contributions gain VC wrappers, and a federation protocol connects instances. The existing system becomes the canonical source that the W3C layer makes legible to the broader web.
