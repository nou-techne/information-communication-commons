# Cross-Instance Artifact Format Design

**Sprint:** 90 (Cycle 11, Ebb Phase)  
**Role:** Schema Architect  
**Layer:** Identity (1), Relationship (3)  
**Status:** Specification complete — Implementation deferred to post-event

---

## Overview

For federation to work, artifacts need a canonical serialization format that carries:
- **Origin**: which instance created it
- **Integrity**: content hash for verification
- **Provenance**: signatures proving authenticity
- **Semantics**: JSON-LD context for interoperability

This spec defines the wire format for cross-instance artifact exchange.

---

## Format: JSON-LD with Embedded Signatures

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://commons.id/context/v1"
  ],
  "id": "https://commons.id/a/550e8400-e29b-41d4-a716-446655440000",
  "type": "Artifact",
  "origin": {
    "instance": "https://commons.id",
    "instanceId": "550e8400-0000-0000-0000-000000000001"
  },
  "content": {
    "title": "REA Ontology Primer",
    "type": "concept",
    "description": "Resource-Event-Agent framework for economic ontology",
    "reaRole": "resource",
    "dimensions": ["hlamt:L", "hlamt:M"],
    "tents": [],
    "tags": ["ontology", "rea", "economics"],
    "convergenceId": "00000000-0000-0000-0000-000000000100",
    "createdAt": "2026-02-13T17:00:00Z",
    "createdBy": "https://commons.id/p/participant-uuid"
  },
  "relationships": [
    {
      "type": "references",
      "target": "https://ethberlin.commons.id/a/another-artifact-uuid",
      "metadata": {
        "context": "Builds on Berlin discussion of economic coordination patterns"
      }
    }
  ],
  "integrity": {
    "contentHash": "sha256:a3b2c1d4e5f6...",
    "algorithm": "SHA-256",
    "canonicalization": "JCS"
  },
  "proof": {
    "type": "Ed25519Signature2020",
    "created": "2026-02-13T17:00:01Z",
    "verificationMethod": "https://commons.id/.well-known/instance-key",
    "proofPurpose": "assertionMethod",
    "proofValue": "z3MvGX7F..."
  }
}
```

---

## Field Specifications

### `@context`
Standard JSON-LD context. Uses:
- ActivityStreams vocabulary for social semantics
- commons.id custom context for e/H-LAM/T/S dimensions, REA roles, convergence model

**Context URL:** `https://commons.id/context/v1` (to be published)

### `id`
Globally unique artifact URI. Format: `https://{instance-domain}/a/{uuid}`

### `type`
Always `"Artifact"` for this format. Extensible for other resource types (Participant, Convergence, etc.).

### `origin`
Instance that created this artifact.
- `instance`: Human-readable domain
- `instanceId`: UUID from `instances` table

### `content`
The artifact payload. Maps to existing `artifacts` table schema:
- `title`, `type`, `description`, `reaRole` (resource/event/agent)
- `dimensions`: array of `hlamt:*` tags
- `tents`: array of tent IDs (convergence-specific spaces)
- `tags`: freeform tags
- `convergenceId`: which convergence this artifact belongs to
- `createdAt`, `createdBy`: provenance

### `relationships`
Array of outbound relationships to other artifacts (local or remote).
- `type`: relationship semantics (references, derives-from, implements, questions, etc.)
- `target`: full URI of target artifact (may be on different instance)
- `metadata`: optional context/reasoning

### `integrity`
Content hash for tamper detection.
- `contentHash`: SHA-256 hash of canonicalized `content` object
- `algorithm`: hashing algorithm used
- `canonicalization`: JSON Canonicalization Scheme (RFC 8785)

### `proof`
Cryptographic signature proving the origin instance created this artifact.
- `type`: Ed25519 signature (from instance keypair)
- `created`: when signature was generated
- `verificationMethod`: URL to instance's public key (`.well-known/instance-key`)
- `proofPurpose`: `assertionMethod` (artifact creation)
- `proofValue`: base58-encoded signature

---

## Canonicalization (JCS - RFC 8785)

Before hashing or signing, the `content` object is canonicalized using JSON Canonicalization Scheme:
1. Remove whitespace
2. Sort object keys alphabetically
3. Escape unicode
4. No trailing commas

**Example (Node.js):**
```typescript
import canonicalize from 'canonicalize'

const canonical = canonicalize(artifact.content)
const hash = createHash('sha256').update(canonical).digest('hex')
```

---

## Signature Generation

1. Canonicalize the entire artifact object (minus `proof` field)
2. Hash with SHA-256
3. Sign hash with instance's Ed25519 private key
4. Base58-encode signature
5. Embed in `proof.proofValue`

**Example (Node.js):**
```typescript
import { createSign } from 'crypto'
import canonicalize from 'canonicalize'
import bs58 from 'bs58'

function signArtifact(artifact: object, privateKey: string): string {
  const { proof, ...unsigned } = artifact
  const canonical = canonicalize(unsigned)
  const sign = createSign('SHA256')
  sign.update(canonical)
  sign.end()
  const signatureBuffer = sign.sign(privateKey)
  return bs58.encode(signatureBuffer)
}
```

---

## Signature Verification

1. Fetch remote instance's public key from `https://{instance}/.well-known/instance-key`
2. Extract `proof.proofValue`, decode from base58
3. Reconstruct canonical form (artifact minus `proof`)
4. Verify signature against public key

**Example (Node.js):**
```typescript
import { createVerify } from 'crypto'
import canonicalize from 'canonicalize'
import bs58 from 'bs58'

async function verifyArtifact(artifact: object): Promise<boolean> {
  const { proof, origin, ...unsigned } = artifact
  
  // Fetch public key
  const keyUrl = `https://${origin.instance}/.well-known/instance-key`
  const res = await fetch(keyUrl)
  const { publicKey } = await res.json()
  
  // Verify
  const canonical = canonicalize({ origin, ...unsigned })
  const signatureBuffer = bs58.decode(proof.proofValue)
  const verify = createVerify('SHA256')
  verify.update(canonical)
  verify.end()
  return verify.verify(publicKey, signatureBuffer)
}
```

---

## Trust Model

Not all instances are trusted equally. When receiving a federated artifact:

1. **Check instance trust level** (from `instance_trust` table)
   - `trusted`: Accept and display
   - `observed`: Accept but flag as unverified
   - `blocked`: Reject

2. **Verify signature** against instance public key

3. **Check content hash** for tamper detection

4. **Store with provenance** — never modify federated artifacts, keep origin metadata intact

---

## API Endpoints (Future)

### Publish Artifact
```http
POST /api/federation/artifacts
Authorization: Bearer {instance-api-key}
Content-Type: application/ld+json

{artifact JSON-LD}
```

### Fetch Artifact
```http
GET /api/federation/artifacts/{uuid}
Accept: application/ld+json
```

### Discover Instance
```http
GET /.well-known/instance
```
Returns:
```json
{
  "instance": "https://commons.id",
  "instanceId": "550e8400-0000-0000-0000-000000000001",
  "publicKey": "-----BEGIN PUBLIC KEY-----...",
  "name": "commons.id",
  "description": "Knowledge graph for convergence events",
  "adminContact": "hello@commons.id",
  "federationEndpoint": "https://commons.id/api/federation"
}
```

---

## Serialization / Deserialization Library

**File:** `app-src/src/lib/federation.ts`

```typescript
import canonicalize from 'canonicalize'
import { createHash, createSign, createVerify } from 'crypto'
import bs58 from 'bs58'

export interface FederatedArtifact {
  '@context': string[]
  id: string
  type: 'Artifact'
  origin: {
    instance: string
    instanceId: string
  }
  content: {
    title: string
    type: string
    description?: string
    reaRole?: 'resource' | 'event' | 'agent'
    dimensions: string[]
    tents: string[]
    tags: string[]
    convergenceId: string
    createdAt: string
    createdBy: string
  }
  relationships: Array<{
    type: string
    target: string
    metadata?: object
  }>
  integrity: {
    contentHash: string
    algorithm: 'SHA-256'
    canonicalization: 'JCS'
  }
  proof: {
    type: 'Ed25519Signature2020'
    created: string
    verificationMethod: string
    proofPurpose: 'assertionMethod'
    proofValue: string
  }
}

export function serializeArtifact(
  artifact: object,
  instanceDomain: string,
  instanceId: string,
  privateKey: string
): FederatedArtifact {
  const content = {
    title: artifact.title,
    type: artifact.type,
    description: artifact.description,
    reaRole: artifact.rea_role,
    dimensions: artifact.dimensions,
    tents: artifact.tents,
    tags: artifact.tags,
    convergenceId: artifact.convergence_id,
    createdAt: artifact.created_at,
    createdBy: `https://${instanceDomain}/p/${artifact.created_by}`
  }

  const contentHash = createHash('sha256')
    .update(canonicalize(content))
    .digest('hex')

  const unsigned = {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://commons.id/context/v1'
    ],
    id: `https://${instanceDomain}/a/${artifact.id}`,
    type: 'Artifact' as const,
    origin: {
      instance: `https://${instanceDomain}`,
      instanceId
    },
    content,
    relationships: artifact.relationships || [],
    integrity: {
      contentHash: `sha256:${contentHash}`,
      algorithm: 'SHA-256' as const,
      canonicalization: 'JCS' as const
    }
  }

  const canonical = canonicalize(unsigned)
  const sign = createSign('SHA256')
  sign.update(canonical)
  sign.end()
  const signatureBuffer = sign.sign(privateKey)
  const proofValue = bs58.encode(signatureBuffer)

  return {
    ...unsigned,
    proof: {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      verificationMethod: `https://${instanceDomain}/.well-known/instance-key`,
      proofPurpose: 'assertionMethod',
      proofValue
    }
  }
}

export async function verifyArtifact(
  artifact: FederatedArtifact
): Promise<boolean> {
  try {
    const { proof, ...unsigned } = artifact
    const keyUrl = proof.verificationMethod
    const res = await fetch(keyUrl)
    if (!res.ok) return false
    const { publicKey } = await res.json()

    const canonical = canonicalize(unsigned)
    const signatureBuffer = bs58.decode(proof.proofValue)
    const verify = createVerify('SHA256')
    verify.update(canonical)
    verify.end()
    return verify.verify(publicKey, signatureBuffer)
  } catch (err) {
    console.error('Artifact verification failed:', err)
    return false
  }
}

export function deserializeArtifact(
  federated: FederatedArtifact
): object {
  return {
    id: federated.id.split('/').pop(),
    title: federated.content.title,
    type: federated.content.type,
    description: federated.content.description,
    rea_role: federated.content.reaRole,
    dimensions: federated.content.dimensions,
    tents: federated.content.tents,
    tags: federated.content.tags,
    convergence_id: federated.content.convergenceId,
    created_at: federated.content.createdAt,
    created_by: federated.content.createdBy.split('/').pop(),
    origin_instance: federated.origin.instance,
    origin_instance_id: federated.origin.instanceId,
    is_federated: true
  }
}
```

---

## Acceptance Criteria

✅ **Specification complete** — JSON-LD format with integrity and proof fields  
✅ **Canonicalization defined** — JCS (RFC 8785) for deterministic hashing  
✅ **Signature scheme documented** — Ed25519, base58-encoded  
✅ **Trust model specified** — trusted/observed/blocked levels  
✅ **Serializer/deserializer code** — TypeScript implementation ready  
⏳ **Testing** — Deferred to post-event (Sprint 91 will add tests)  
⏳ **Deployment** — No changes to live system, spec only

---

## Dependencies

**npm packages needed (when implementing):**
```json
{
  "canonicalize": "^2.0.0",
  "bs58": "^5.0.0"
}
```

**Node.js `crypto` module** — built-in, no install needed

---

## Next Steps (Post-Event)

1. **Sprint 91**: Federation Protocol Design (discovery, sync, conflict resolution)
2. Add unit tests for serialization/deserialization
3. Publish JSON-LD context at `https://commons.id/context/v1`
4. Implement `.well-known/instance` and `.well-known/instance-key` endpoints
5. Build federation API endpoints (`POST /api/federation/artifacts`, etc.)
6. Add federated artifact import UI

---

**Sprint 90 Status:** Specification complete. Ready for implementation post-ETHBoulder (Feb 17+).
