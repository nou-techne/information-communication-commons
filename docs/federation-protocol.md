# Federation Protocol Design

**Sprint 91** | Technical Lead | All Layers

## Overview

The commons.id Federation Protocol enables multiple independent instances to discover each other, share artifacts, synchronize updates, and maintain a distributed knowledge graph while preserving local autonomy and security.

## Goals

1. **Decentralized Discovery** — Instances find each other without central registry
2. **Selective Synchronization** — Opt-in sharing based on trust levels
3. **Eventual Consistency** — Changes propagate across the network over time
4. **Conflict Resolution** — Handle concurrent edits deterministically
5. **Security & Trust** — Verify authenticity and filter by trust level

## Architecture Principles

- **Pull, Not Push** — Receiving instances request updates (prevents spam)
- **Content-Addressed** — Artifacts identified by hash for integrity
- **Signed All The Way** — Every artifact carries cryptographic proof
- **Trust Is Transitive** — Trust relationships can be inherited
- **Local Control** — Each instance decides what to import

---

## Protocol Flows

### 1. Instance Discovery

Instances announce themselves via DNS TXT records and `.well-known` endpoints.

#### Sequence Diagram

```
User/Admin                  Instance A              DNS              Instance B
    |                            |                    |                    |
    |-- Add B to federation ---->|                    |                    |
    |                            |                    |                    |
    |                            |-- Resolve domain --|>                   |
    |                            |<-- TXT records ----|                    |
    |                            |                    |                    |
    |                            |-- GET /.well-known/commons ------------>|
    |                            |<-- Instance metadata ------------------|
    |                            |                    |                    |
    |                            |-- Verify signature                      |
    |                            |-- Check public key                      |
    |                            |                    |                    |
    |<-- Discovery complete -----|                    |                    |
```

#### DNS TXT Record Format

```
_commons.example.org. IN TXT "v=commons1 url=https://example.org/.well-known/commons"
```

#### `.well-known/commons` Endpoint

**Request:**
```
GET /.well-known/commons HTTP/1.1
Host: commons.id
```

**Response:**
```json
{
  "version": "1.0",
  "instance": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "domain": "commons.id",
    "name": "Information & Communications Commons",
    "description": "Living knowledge graph for convergence events",
    "publicKey": "base64-encoded-ed25519-public-key",
    "apiEndpoint": "https://commons.id/api/federation/v1",
    "convergences": 5,
    "artifacts": 342,
    "created": "2026-02-01T00:00:00Z"
  },
  "signature": {
    "algorithm": "ed25519",
    "signature": "base64-encoded-signature",
    "signedAt": "2026-02-12T04:00:00Z"
  }
}
```

The signature covers the entire `instance` object.

---

### 2. Trust Establishment

Instances set trust levels for discovered peers. Trust determines what content is imported.

#### Trust Levels

| Level      | Description                                      | Auto-import? |
|------------|--------------------------------------------------|--------------|
| unknown    | Newly discovered, not yet evaluated              | No           |
| untrusted  | Known but explicitly not trusted                 | No           |
| verified   | Identity verified (e.g., domain ownership confirmed) | Optional |
| trusted    | Fully trusted, content imported automatically    | Yes          |

#### Verification Methods

1. **Manual Verification** — Admin reviews and approves
2. **Out-of-Band Confirmation** — Email, phone, or in-person key exchange
3. **Web-of-Trust** — Inherit trust from mutually trusted instances
4. **Domain Verification** — Prove control via DNS challenge

#### Sequence Diagram

```
Admin                      Instance A              Instance B
  |                             |                       |
  |-- Set trust: verified ---->|                       |
  |                             |                       |
  |                             |-- Request challenge ->|
  |                             |<-- Challenge token ---|
  |                             |                       |
  |                             |-- Publish DNS TXT --->|
  |                             |                       |
  |                             |-- Verify challenge -->|
  |                             |<-- Verification OK ---|
  |                             |                       |
  |<-- Trust upgraded: trusted -|                       |
```

---

### 3. Artifact Synchronization

Instances request new/updated artifacts from trusted peers via polling or webhooks.

#### Pull-Based Sync

```
Instance A (subscriber)           Instance B (publisher)
       |                                    |
       |-- GET /api/federation/v1/feed?since=TIMESTAMP -->|
       |<-- 200 OK, [artifact1, artifact2, ...] ----------|
       |                                    |
       |-- Verify signatures                              |
       |-- Check trust level                              |
       |-- Import artifacts                               |
       |                                    |
       |-- GET /api/federation/v1/artifact/:id (if missing)
       |<-- 200 OK, full artifact ----------|
```

#### Push-Based Sync (Optional Webhooks)

```
Instance B (publisher)            Instance A (subscriber)
       |                                    |
       |-- POST /api/federation/v1/webhook ------>|
       |    Body: { "event": "artifact.created",  |
       |            "artifactId": "uuid",          |
       |            "signature": "..." }           |
       |<-- 200 OK, queued for import ------------|
       |                                    |
       |                          |-- GET artifact from B
       |                          |-- Verify & import
```

#### Feed Endpoint

**Request:**
```
GET /api/federation/v1/feed?since=2026-02-12T00:00:00Z&limit=100 HTTP/1.1
Host: commons.id
```

**Response:**
```json
{
  "artifacts": [
    { /* FederatedArtifact as defined in Sprint 90 */ },
    { /* ... */ }
  ],
  "hasMore": true,
  "nextCursor": "2026-02-12T04:30:00Z"
}
```

All artifacts are in the canonical format from Sprint 90, with signatures intact.

---

### 4. Conflict Resolution

When the same artifact (by ID) exists on multiple instances with different content, resolve deterministically.

#### Conflict Detection

```sql
-- Find conflicting artifacts (same ID, different content hash)
SELECT 
  a1.id,
  a1.content_hash as local_hash,
  a2.content_hash as remote_hash,
  a1.modified as local_modified,
  a2.modified as remote_modified,
  i.trust_level
FROM artifacts a1
JOIN federated_artifacts a2 ON a2.id = a1.id
JOIN instances i ON i.id = a2.instance_id
WHERE a1.content_hash != a2.content_hash
  AND a1.instance_id = (SELECT id FROM instances WHERE is_local = true);
```

#### Resolution Rules (Priority Order)

1. **Trust Level** — Trusted instance wins over verified/untrusted
2. **Instance Policy** — Local instance can override (manual admin action)
3. **Timestamp** — Most recent `modified` timestamp wins
4. **Lexicographic** — If timestamps equal, compare content hashes alphabetically

#### Sequence Diagram

```
Instance A                       Instance B
    |                                 |
    |-- Pull artifact ID=123 -------->|
    |<-- Artifact v2, modified=T2 ----|
    |                                 |
    |-- Local has v1, modified=T1     |
    |-- Detect conflict (T2 > T1)     |
    |-- Trust level: trusted          |
    |-- Replace local with remote     |
    |                                 |
    |-- Store conflict record         |
    |-- Notify admin (optional)       |
```

#### Conflict Record

Keep an audit trail of all conflicts:

```sql
CREATE TABLE federation_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id uuid NOT NULL,
  local_content_hash text,
  remote_content_hash text,
  local_instance_id uuid,
  remote_instance_id uuid,
  resolution text CHECK (resolution IN ('keep_local', 'use_remote', 'manual')),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

---

### 5. Instance Deactivation

When an instance goes offline or is removed from federation.

#### Graceful Shutdown

```
Instance A (leaving)              Instance B (peer)
    |                                    |
    |-- POST /api/federation/v1/deactivate -->|
    |    Body: { "reason": "shutdown",         |
    |            "timestamp": "..." }          |
    |<-- 200 OK --------------------------------|
    |                                    |
    |                          |-- Mark A as offline
    |                          |-- Stop polling A
    |                          |-- Retain artifacts
```

#### Forced Removal

```
Admin                         Instance B
  |                                |
  |-- Remove Instance A --------->|
  |                                |
  |                                |-- Set trust: untrusted
  |                                |-- Stop polling A
  |                                |-- Optionally delete A's artifacts
  |<-- Removal complete -----------|
```

---

## Data Model Extensions

### `federated_artifacts` Table

Stores imported artifacts from remote instances.

```sql
CREATE TABLE federated_artifacts (
  id uuid PRIMARY KEY,  -- Same ID as source instance
  instance_id uuid REFERENCES instances(id) ON DELETE CASCADE,
  local_artifact_id uuid REFERENCES artifacts(id) ON DELETE SET NULL,
  
  -- Federated format (JSON-LD)
  federated_data jsonb NOT NULL,
  
  -- Verification
  signature_valid boolean DEFAULT false,
  content_hash_valid boolean DEFAULT false,
  last_verified_at timestamptz,
  
  -- Sync
  imported_at timestamptz DEFAULT now(),
  last_synced_at timestamptz,
  sync_status text DEFAULT 'pending' CHECK (sync_status IN ('pending', 'imported', 'conflict', 'rejected')),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_federated_artifacts_instance ON federated_artifacts(instance_id);
CREATE INDEX idx_federated_artifacts_status ON federated_artifacts(sync_status);
```

### `federation_sync_log` Table

Audit log of all sync operations.

```sql
CREATE TABLE federation_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid REFERENCES instances(id) ON DELETE CASCADE,
  
  sync_type text CHECK (sync_type IN ('pull', 'push', 'webhook')),
  artifacts_fetched integer DEFAULT 0,
  artifacts_imported integer DEFAULT 0,
  artifacts_rejected integer DEFAULT 0,
  conflicts_detected integer DEFAULT 0,
  
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text CHECK (status IN ('running', 'success', 'partial', 'failed')),
  error_message text,
  
  metadata jsonb
);

CREATE INDEX idx_federation_sync_instance ON federation_sync_log(instance_id);
CREATE INDEX idx_federation_sync_status ON federation_sync_log(status);
```

---

## API Endpoints

### Discovery

- `GET /.well-known/commons` — Instance metadata (public)

### Federation API (Protected)

All endpoints require API key or OAuth token. Rate limited.

- `GET /api/federation/v1/feed` — Get recent artifacts
  - Query: `since` (ISO timestamp), `limit` (default 100)
  - Response: Array of `FederatedArtifact`

- `GET /api/federation/v1/artifact/:id` — Get specific artifact
  - Response: Single `FederatedArtifact`

- `POST /api/federation/v1/webhook` — Receive push notifications
  - Body: `{ event, artifactId, timestamp, signature }`

- `POST /api/federation/v1/trust` — Update trust level (admin only)
  - Body: `{ instanceId, trustLevel, reason }`

- `POST /api/federation/v1/deactivate` — Announce shutdown
  - Body: `{ reason, timestamp }`

---

## Security Considerations

### 1. Authentication

- **API Keys** — Long-lived tokens for machine-to-machine auth
- **OAuth 2.0** — For human-initiated federation admin actions
- **Signature Verification** — Every artifact must have valid Ed25519 signature

### 2. Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `/feed` | 60 requests/hour per instance |
| `/artifact/:id` | 600 requests/hour per instance |
| `/webhook` | 10 requests/minute per instance |

### 3. DoS Prevention

- **Content Size Limits** — Max 10 MB per artifact
- **Relationship Limits** — Max 100 relationships per artifact
- **Backpressure** — If queue depth > 1000, reject new webhooks

### 4. Trust Boundaries

- **Sandbox Untrusted** — Display but don't incorporate into local graph
- **Verify Domains** — Use DNSSEC or DNS challenges when possible
- **Audit Trail** — Log every trust decision and artifact import

---

## Implementation Phases

### Phase 1: Foundation (Sprints 89-92)

- Instance identity schema ✅ (Sprint 89)
- Artifact format specification ✅ (Sprint 90)
- Protocol design ✅ (Sprint 91)
- Database sharding analysis (Sprint 92)

### Phase 2: Core Sync (Sprints 110-112)

- Instance discovery implementation (Sprint 110)
- Artifact sync pull-based (Sprint 111)
- Identity portability with ENS/DID (Sprint 112)

### Phase 3: Hardening (Sprints 113-116)

- Trust model enforcement (Sprint 113)
- Conflict resolution automation (Sprint 114)
- Federation monitoring dashboard (Sprint 115)
- Full integration test suite (Sprint 116)

### Phase 4: Scale (Sprints 117-120)

- CDN and edge caching (Sprint 117)
- Multi-region database (Sprint 118)
- Horizontal scaling (Sprint 119)
- Chaos engineering (Sprint 120)

---

## Monitoring & Observability

### Key Metrics

1. **Sync Health**
   - Artifacts synced per hour
   - Sync success rate (%)
   - Average sync latency

2. **Trust Distribution**
   - Instances by trust level
   - Average artifacts per trusted instance
   - Trust changes per week

3. **Conflict Rate**
   - Conflicts detected per sync
   - Resolution method distribution
   - Time to resolution

4. **Performance**
   - Feed endpoint P95 latency
   - Signature verification time
   - Database query performance

### Alerts

- Sync failure rate > 10% (1 hour window)
- Signature verification failures > 5 in 10 minutes
- Instance marked untrusted (immediate notification)
- Conflict resolution required (manual intervention)

---

## Future Enhancements

1. **Gossip Protocol** — Replace polling with efficient peer-to-peer sync
2. **Merkle Trees** — Batch verification for large artifact sets
3. **Encrypted Sync** — Support private artifacts with selective disclosure
4. **Delta Sync** — Transfer only diffs for large artifacts
5. **Bloom Filters** — Efficiently determine which artifacts peer needs

---

## References

- [ActivityPub Protocol](https://www.w3.org/TR/activitypub/) — Similar federated social protocol
- [Matrix Federation](https://spec.matrix.org/latest/server-server-api/) — Chat federation reference
- [Git Protocol](https://git-scm.com/book/en/v2/Git-Internals-Transfer-Protocols) — Content-addressed sync inspiration
- [CAP Theorem](https://en.wikipedia.org/wiki/CAP_theorem) — Consistency/availability tradeoffs

---

*Sprint 91 · Federation Foundations (Cycle 11 Ebb) · 2026-02-12*
