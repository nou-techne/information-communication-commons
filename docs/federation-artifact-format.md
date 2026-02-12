# Cross-Instance Artifact Format

**Sprint 90** | Schema Architect | Layer: Identity (1), Relationship (3)

## Overview

The Cross-Instance Artifact Format enables artifacts to be shared across federated commons.id instances while maintaining provenance, integrity, and authenticity. Built on JSON-LD, it provides a canonical representation that any instance can parse, verify, and incorporate into its local knowledge graph.

## Design Principles

1. **Verifiable Provenance** — Every artifact carries cryptographic proof of its origin
2. **Content Integrity** — Tampering is detectable via content hashing
3. **Schema Extensibility** — JSON-LD allows flexible vocabulary extensions
4. **Offline Capable** — Self-contained format can be stored and transmitted without live instance connectivity

## Format Specification

### Core Structure

```json
{
  "@context": "https://commons.id/schema/artifact/v1",
  "@type": "Artifact",
  "id": "https://commons.id/a/550e8400-e29b-41d4-a716-446655440000",
  "instanceId": "550e8400-e29b-41d4-a716-446655440001",
  "instanceDomain": "commons.id",
  "type": "concept",
  "title": "Federation Protocol Design",
  "description": "Distributed knowledge sharing across convergence event instances",
  "content": "...",
  "contentHash": "sha256:a3b5c6d7e8f9...",
  "contentFormat": "text/markdown",
  "dimensions": [
    {
      "dimension": "artifact",
      "weight": 0.95,
      "tags": ["protocol", "federation", "distributed-systems"]
    },
    {
      "dimension": "methodology",
      "weight": 0.75,
      "tags": ["json-ld", "content-addressing"]
    }
  ],
  "relationships": [
    {
      "type": "implements",
      "targetId": "https://commons.id/a/123e4567-e89b-12d3-a456-426614174000",
      "targetInstance": "commons.id"
    },
    {
      "type": "extends",
      "targetId": "https://ethboulder.commons.id/a/987f6543-e21c-34d5-b678-536625285111",
      "targetInstance": "ethboulder.commons.id"
    }
  ],
  "sourceContribution": {
    "id": "https://commons.id/c/contribution-uuid",
    "participantName": "Alex Chen",
    "convergenceName": "ETHBoulder 2026"
  },
  "metadata": {
    "license": "CC-BY-4.0",
    "language": "en",
    "visibility": "public"
  },
  "created": "2026-02-12T04:00:00Z",
  "modified": "2026-02-12T04:15:00Z",
  "signature": {
    "algorithm": "ed25519",
    "publicKey": "base64-encoded-public-key",
    "signature": "base64-encoded-signature",
    "signedAt": "2026-02-12T04:15:00Z"
  }
}
```

### Field Descriptions

#### Identity Fields

- **@context**: JSON-LD context URL defining the vocabulary
- **@type**: Always "Artifact" for this format
- **id**: Canonical URL for this artifact (instance domain + UUID)
- **instanceId**: UUID of the originating instance
- **instanceDomain**: Human-readable domain of origin

#### Content Fields

- **type**: Artifact type (`concept`, `question`, `resource`, `method`, `insight`)
- **title**: Brief title (≤200 chars)
- **description**: One-sentence summary (≤500 chars)
- **content**: Full artifact content
- **contentHash**: SHA-256 hash of `content` for integrity verification
- **contentFormat**: MIME type (default: `text/markdown`)

#### Dimensions

Each artifact maps to e/H-LAM/T dimensions with weights:

- **dimension**: One of `environment`, `human`, `language`, `artifact`, `methodology`, `training`
- **weight**: Relevance score 0.0-1.0
- **tags**: Keywords extracted from content

#### Relationships

Links to other artifacts across instances:

- **type**: Relationship type (`supports`, `contradicts`, `extends`, `implements`)
- **targetId**: Full URL of related artifact
- **targetInstance**: Domain of instance hosting the target

#### Source & Metadata

- **sourceContribution**: Reference to the original contribution that produced this artifact
- **metadata**: Additional key-value properties (license, language, visibility)
- **created**: ISO 8601 timestamp
- **modified**: ISO 8601 timestamp (when artifact was last updated)

#### Signature

Ed25519 signature over the canonical JSON representation:

- **algorithm**: Always "ed25519"
- **publicKey**: Base64-encoded public key of signing instance
- **signature**: Base64-encoded Ed25519 signature
- **signedAt**: When the signature was created

### Signature Process

1. **Canonicalize**: Serialize the artifact to JSON without the `signature` field, with keys sorted alphabetically
2. **Hash**: Compute SHA-256 of the canonical JSON
3. **Sign**: Sign the hash with the instance's Ed25519 private key
4. **Attach**: Add the `signature` object to the artifact

### Verification Process

1. **Extract**: Remove the `signature` field
2. **Canonicalize**: Serialize remaining JSON with keys sorted
3. **Hash**: Compute SHA-256
4. **Verify**: Use the public key to verify the signature over the hash
5. **Trust**: Check if the signing instance is trusted
6. **Content**: Verify `contentHash` matches the actual content

## Implementation

### TypeScript Types

```typescript
interface FederatedArtifact {
  '@context': string;
  '@type': 'Artifact';
  id: string; // URL
  instanceId: string; // UUID
  instanceDomain: string;
  type: 'concept' | 'question' | 'resource' | 'method' | 'insight';
  title: string;
  description: string;
  content: string;
  contentHash: string; // "sha256:..."
  contentFormat: string; // MIME type
  dimensions: Array<{
    dimension: 'environment' | 'human' | 'language' | 'artifact' | 'methodology' | 'training';
    weight: number; // 0.0-1.0
    tags: string[];
  }>;
  relationships: Array<{
    type: 'supports' | 'contradicts' | 'extends' | 'implements';
    targetId: string; // URL
    targetInstance: string;
  }>;
  sourceContribution?: {
    id: string; // URL
    participantName: string;
    convergenceName: string;
  };
  metadata: Record<string, any>;
  created: string; // ISO 8601
  modified: string; // ISO 8601
  signature: {
    algorithm: 'ed25519';
    publicKey: string; // base64
    signature: string; // base64
    signedAt: string; // ISO 8601
  };
}
```

### Serializer

```typescript
import { createHash } from 'crypto';
import { sign } from 'tweetnacl';

export function serializeArtifact(
  artifact: Omit<FederatedArtifact, 'signature'>,
  privateKey: Uint8Array
): FederatedArtifact {
  // 1. Compute content hash
  const contentHash = 'sha256:' + createHash('sha256')
    .update(artifact.content)
    .digest('hex');
  
  const artifactWithHash = { ...artifact, contentHash };
  
  // 2. Canonicalize (without signature, keys sorted)
  const canonical = JSON.stringify(artifactWithHash, Object.keys(artifactWithHash).sort());
  
  // 3. Hash canonical JSON
  const messageHash = createHash('sha256').update(canonical).digest();
  
  // 4. Sign
  const signatureBytes = sign.detached(messageHash, privateKey);
  
  // 5. Attach signature
  const publicKey = sign.keyPair.fromSecretKey(privateKey).publicKey;
  
  return {
    ...artifactWithHash,
    signature: {
      algorithm: 'ed25519',
      publicKey: Buffer.from(publicKey).toString('base64'),
      signature: Buffer.from(signatureBytes).toString('base64'),
      signedAt: new Date().toISOString()
    }
  };
}
```

### Deserializer & Verifier

```typescript
import { sign } from 'tweetnacl';

export function verifyArtifact(artifact: FederatedArtifact): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // 1. Extract signature
  const { signature, ...artifactWithoutSig } = artifact;
  
  // 2. Canonicalize
  const canonical = JSON.stringify(artifactWithoutSig, Object.keys(artifactWithoutSig).sort());
  
  // 3. Hash
  const messageHash = createHash('sha256').update(canonical).digest();
  
  // 4. Verify signature
  const publicKey = Buffer.from(signature.publicKey, 'base64');
  const signatureBytes = Buffer.from(signature.signature, 'base64');
  
  const signatureValid = sign.detached.verify(
    messageHash,
    signatureBytes,
    publicKey
  );
  
  if (!signatureValid) {
    errors.push('Signature verification failed');
  }
  
  // 5. Verify content hash
  const computedHash = 'sha256:' + createHash('sha256')
    .update(artifact.content)
    .digest('hex');
  
  if (artifact.contentHash !== computedHash) {
    errors.push(`Content hash mismatch: expected ${artifact.contentHash}, got ${computedHash}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function deserializeArtifact(json: string): {
  artifact: FederatedArtifact | null;
  valid: boolean;
  errors: string[];
} {
  try {
    const artifact = JSON.parse(json) as FederatedArtifact;
    const verification = verifyArtifact(artifact);
    
    return {
      artifact: verification.valid ? artifact : null,
      ...verification
    };
  } catch (e) {
    return {
      artifact: null,
      valid: false,
      errors: [`JSON parse error: ${e.message}`]
    };
  }
}
```

### Database Functions

```sql
-- Supabase function to export artifact in federated format
CREATE OR REPLACE FUNCTION export_artifact_federated(p_artifact_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_artifact jsonb;
  v_instance jsonb;
BEGIN
  -- Get local instance info
  SELECT jsonb_build_object(
    'id', id::text,
    'domain', domain,
    'publicKey', public_key
  ) INTO v_instance
  FROM instances
  WHERE is_local = true
  LIMIT 1;
  
  -- Build artifact export
  SELECT jsonb_build_object(
    '@context', 'https://commons.id/schema/artifact/v1',
    '@type', 'Artifact',
    'id', 'https://' || (v_instance->>'domain') || '/a/' || a.id::text,
    'instanceId', (v_instance->>'id'),
    'instanceDomain', (v_instance->>'domain'),
    'type', a.type,
    'title', a.title,
    'description', a.description,
    'content', a.content,
    'contentFormat', COALESCE(a.content_format, 'text/markdown'),
    'dimensions', (
      SELECT jsonb_agg(jsonb_build_object(
        'dimension', ad.dimension,
        'weight', ad.weight,
        'tags', ad.tags
      ))
      FROM artifact_dimensions ad
      WHERE ad.artifact_id = a.id
    ),
    'relationships', (
      SELECT jsonb_agg(jsonb_build_object(
        'type', r.relationship_type,
        'targetId', 'https://' || (v_instance->>'domain') || '/a/' || r.target_artifact_id::text,
        'targetInstance', (v_instance->>'domain')
      ))
      FROM relationships r
      WHERE r.source_artifact_id = a.id
    ),
    'sourceContribution', jsonb_build_object(
      'id', 'https://' || (v_instance->>'domain') || '/c/' || c.id::text,
      'participantName', p.name,
      'convergenceName', conv.name
    ),
    'metadata', jsonb_build_object(
      'license', 'CC-BY-4.0',
      'language', 'en',
      'visibility', 'public'
    ),
    'created', a.created_at,
    'modified', a.updated_at
  ) INTO v_artifact
  FROM artifacts a
  LEFT JOIN contributions c ON c.id = a.contribution_id
  LEFT JOIN participants p ON p.id = c.participant_id
  LEFT JOIN convergences conv ON conv.id = a.convergence_id
  WHERE a.id = p_artifact_id;
  
  -- Note: Signature must be added by Edge Function with access to private key
  RETURN v_artifact;
END;
$$ LANGUAGE plpgsql;
```

## Security Considerations

1. **Private Key Protection**: Instance private keys must never leave the secure backend
2. **Trust Model**: Implement instance trust levels (unknown, untrusted, verified, trusted)
3. **Content Validation**: Always verify signatures and content hashes before importing
4. **Rate Limiting**: Apply limits to federation endpoints to prevent DoS
5. **Conflict Resolution**: When same artifact ID appears from multiple instances, trust highest-trust instance

## Future Extensions

- **Versioning**: Add `version` field for artifact evolution tracking
- **Attachments**: Support binary attachments with separate content-addressed storage
- **Diff Format**: Efficient updates via JSON Patch for large artifacts
- **Encrypted Content**: Support for private artifacts with selective disclosure

## References

- [JSON-LD 1.1](https://www.w3.org/TR/json-ld11/)
- [Ed25519 Signatures](https://ed25519.cr.yp.to/)
- [Content Addressing](https://en.wikipedia.org/wiki/Content-addressable_storage)
- [Merkle Trees](https://en.wikipedia.org/wiki/Merkle_tree) (for future batch verification)

---

*Sprint 90 · Federation Foundations (Cycle 11 Ebb) · 2026-02-12*
