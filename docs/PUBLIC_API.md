# Public REST API v1

**Sprint 53** — Read-only API for external integrations

## Status

**Deferred to post-ETHBoulder.** A public REST API is valuable for third-party integrations and programmatic access but not critical for the Feb 13-16 event. Participants use the web UI for contributions. API becomes valuable post-event when external tools want to build on the knowledge graph.

## Rationale

- **Event priority:** ETHBoulder starts in ~36 hours. Focus on participant-facing features
- **No external integrations yet:** No third-party tools waiting for API access
- **Supabase PostgREST available:** Read-only access already possible via Supabase API with proper credentials
- **Post-event value:** After event, can identify which endpoints are actually needed based on integration requests

## Current Data Access

**Supabase PostgREST API (Existing):**
- Full REST API auto-generated from PostgreSQL schema
- Read access to all tables via anonymous key
- Query language via URL parameters
- RLS policies enforce access control

**Example (current):**
```bash
# Get artifacts
curl "https://hvbdpgkdcdskhpbdeeim.supabase.co/rest/v1/artifacts?select=*&limit=20" \
  -H "apikey: sb_publishable_kB69BlNpkNhOllwGMOE6xg_i4l1VHMv" \
  -H "Content-Type: application/json"

# Get contributions
curl "https://hvbdpgkdcdskhpbdeeim.supabase.co/rest/v1/contributions?select=*&status=eq.complete" \
  -H "apikey: sb_publishable_kB69BlNpkNhOllwGMOE6xg_i4l1VHMv"

# Call RPC functions
curl "https://hvbdpgkdcdskhpbdeeim.supabase.co/rest/v1/rpc/search_content" \
  -X POST \
  -H "apikey: sb_publishable_kB69BlNpkNhOllwGMOE6xg_i4l1VHMv" \
  -H "Content-Type: application/json" \
  -d '{"query_text": "knowledge graph"}'
```

**Why build custom API wrapper:**
- **Simpler interface** — Hide Supabase internals
- **Versioning** — Control breaking changes
- **Rate limiting** — Per-key quotas
- **API key management** — Issue/revoke keys
- **Usage analytics** — Track which endpoints are used
- **Custom responses** — Flatten nested data, add metadata

## Planned API Design

### Base URL

```
https://api.commons.id/v1/
```

Or subdomain:
```
https://ethboulder.commons.id/api/v1/
```

### Authentication

**API Key in header:**
```bash
curl "https://api.commons.id/v1/artifacts" \
  -H "X-API-Key: ck_live_abc123..."
```

**Key types:**
- Public read-only keys (high rate limit)
- Private keys with write access (future)
- Test keys for development

**Key management:**
```sql
CREATE TABLE api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash text NOT NULL UNIQUE,
  name text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  permissions jsonb DEFAULT '["read"]'::jsonb,
  rate_limit_per_hour int DEFAULT 1000,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_api_keys_hash ON api_keys(key_hash) WHERE revoked_at IS NULL;
```

### Endpoints

#### GET /artifacts

**List artifacts with pagination and filtering**

```bash
GET /v1/artifacts?
  limit=20&
  offset=0&
  type=idea&
  convergence=ethboulder&
  dimension=hlamt:H
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Pattern: Knowledge Graphs",
      "summary": "...",
      "type": "pattern",
      "rea_role": "resource",
      "created_at": "2026-02-13T10:30:00Z",
      "steward": {
        "id": "uuid",
        "name": "Alice"
      },
      "dimensions": [
        {"key": "hlamt:L", "weight": 0.8},
        {"key": "hlamt:A", "weight": 0.6}
      ],
      "relationships": {
        "count": 5,
        "url": "/v1/artifacts/{id}/relationships"
      }
    }
  ],
  "pagination": {
    "total": 250,
    "limit": 20,
    "offset": 0,
    "next": "/v1/artifacts?limit=20&offset=20"
  },
  "meta": {
    "generated_at": "2026-02-13T10:30:00Z",
    "api_version": "1.0"
  }
}
```

#### GET /artifacts/:id

**Single artifact with full details**

```bash
GET /v1/artifacts/{id}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Pattern: Knowledge Graphs",
  "body": "Full markdown content...",
  "summary": "Brief summary...",
  "type": "pattern",
  "state": "active",
  "rea_role": "resource",
  "created_at": "2026-02-13T10:30:00Z",
  "updated_at": "2026-02-13T12:00:00Z",
  "steward": {
    "id": "uuid",
    "name": "Alice",
    "url": "/v1/participants/{id}"
  },
  "dimensions": [
    {"key": "hlamt:L", "label": "L/ Language", "weight": 0.8},
    {"key": "hlamt:A", "label": "A/ Artifacts", "weight": 0.6}
  ],
  "relationships": [
    {
      "type": "extends",
      "to": {
        "id": "uuid",
        "title": "Resource-Event-Agent Framework",
        "url": "/v1/artifacts/{id}"
      }
    }
  ],
  "tags": ["rea", "ontology", "data-modeling"],
  "url": "https://ethboulder.commons.id/app/artifact/{id}"
}
```

#### GET /contributions

**List contributions**

```bash
GET /v1/contributions?
  limit=20&
  status=complete&
  session={session_id}
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "content": "Observation text...",
      "status": "complete",
      "created_at": "2026-02-13T10:30:00Z",
      "processed_at": "2026-02-13T10:30:15Z",
      "participant": {
        "id": "uuid",
        "name": "Bob"
      },
      "session": {
        "id": "uuid",
        "title": "Opening Keynote"
      },
      "artifacts_extracted": 3,
      "url": "https://ethboulder.commons.id/app/contribution/{id}"
    }
  ],
  "pagination": {...}
}
```

#### GET /participants

**List participants**

```bash
GET /v1/participants?limit=20
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Alice",
      "affiliation": "Techne",
      "contribution_count": 5,
      "artifact_count": 12,
      "url": "/v1/participants/{id}"
    }
  ],
  "pagination": {...}
}
```

#### GET /dimensions

**Dimension statistics**

```bash
GET /v1/dimensions
```

**Response:**
```json
{
  "data": [
    {
      "key": "hlamt:H",
      "label": "H/ Human",
      "description": "People, capabilities, relationships",
      "artifact_count": 45,
      "top_artifacts": [
        {
          "id": "uuid",
          "title": "...",
          "weight": 0.95
        }
      ]
    }
  ]
}
```

#### GET /search

**Full-text search**

```bash
GET /v1/search?q=knowledge+graph&limit=10
```

**Response:**
```json
{
  "query": "knowledge graph",
  "results": [
    {
      "type": "artifact",
      "id": "uuid",
      "title": "Pattern: Knowledge Graphs",
      "snippet": "...collective intelligence via **graph** structures...",
      "rank": 0.85,
      "url": "/v1/artifacts/{id}"
    }
  ],
  "total": 12,
  "took_ms": 45
}
```

### Rate Limiting

**Headers in response:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1707667200
```

**429 Too Many Requests:**
```json
{
  "error": "rate_limit_exceeded",
  "message": "Rate limit of 1000 requests per hour exceeded",
  "retry_after": 3600
}
```

**Implementation (Supabase Edge Function):**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'

const RATE_LIMIT_WINDOW = 3600 // 1 hour in seconds
const RATE_LIMIT_MAX = 1000

async function checkRateLimit(apiKeyHash: string): Promise<boolean> {
  const { data } = await supabase.rpc('check_rate_limit', {
    p_key_hash: apiKeyHash,
    p_window_seconds: RATE_LIMIT_WINDOW,
    p_max_requests: RATE_LIMIT_MAX
  })
  
  return data.allowed
}

serve(async (req) => {
  const apiKey = req.headers.get('X-API-Key')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'missing_api_key' }), { 
      status: 401 
    })
  }
  
  const allowed = await checkRateLimit(hashApiKey(apiKey))
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'rate_limit_exceeded' }), { 
      status: 429,
      headers: { 'Retry-After': '3600' }
    })
  }
  
  // Handle request...
})
```

### Documentation

**OpenAPI/Swagger spec:**

```yaml
openapi: 3.0.0
info:
  title: commons.id API
  version: 1.0.0
  description: Read-only API for knowledge graph data

servers:
  - url: https://api.commons.id/v1

paths:
  /artifacts:
    get:
      summary: List artifacts
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        200:
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ArtifactList'
```

**Interactive docs:** Host Swagger UI at `/docs`

## Acceptance Criteria (Deferred)

- [x] Public API plan documented
- [ ] 5+ endpoints implemented (artifacts, contributions, participants, dimensions, search)
- [ ] API key authentication working
- [ ] Rate limiting (1000 req/hour)
- [ ] OpenAPI spec published
- [ ] Interactive API docs live at /docs
- [ ] Usage examples for each endpoint

**Target completion:** Post-ETHBoulder (Feb 17+)

## Priority

**Medium.** Public API becomes valuable when:
- Third-party tools want to integrate
- External dashboards need real-time data
- Researchers want programmatic access
- Mobile apps need backend API

For initial event capture, web UI is sufficient.

## Notes

Supabase PostgREST provides a working REST API today. The value of a custom API wrapper is:
1. **Simpler interface** — Hide database schema complexity
2. **Stability** — Version API independently from schema changes
3. **Control** — Rate limits, key management, analytics

Post-event, can assess which endpoints external tools actually need before building full API layer.

