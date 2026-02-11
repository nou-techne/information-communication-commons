# API Documentation

**Sprint 36:** Backend Engineer · State Layer (2)

commons.id API reference — Edge Functions and Supabase RPC calls.

---

## Edge Functions

All Edge Functions are deployed on Supabase Edge Runtime (Deno).

**Base URL:** `https://hvbdpgkdcdskhpbdeeim.supabase.co/functions/v1`

### POST /process-contribution

Process a natural language contribution through AI extraction pipeline.

**Authentication:** Service role key (called by database trigger) or anon key (direct calls)

**Request:**
```json
{
  "record": {
    "id": "uuid",
    "content": "string (20-10,000 chars)",
    "participant_id": "uuid | null",
    "convergence_id": "uuid | null"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "result": {
    "artifacts_created": 3,
    "relationships_created": 2,
    "commitments_created": 1,
    "errors": []
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message"
}
```

**Secrets:**
- `ANTHROPIC_API_KEY` — Claude API key for extraction
- `SB_URL` — Supabase project URL
- `SB_SERVICE_KEY` — Supabase service role key

**Extraction Schema:**
- Confidence scoring (0-1) for each artifact
- REA role classification (resource/event/agent)
- Agent type (human/non-human)
- Event temporality (past/present/future)
- Dimension weighting (0-1) for each hlamt: tag
- Structured validation filters invalid types

---

### POST /process-profile

Create or update a participant profile from natural language bio/description.

**Authentication:** Authenticated user (anon key with valid session)

**Request:**
```json
{
  "content": "string",
  "email": "string"
}
```

**Response (Success):**
```json
{
  "success": true,
  "participant_id": "uuid"
}
```

**Response (Error):**
```json
{
  "error": "Error message"
}
```

**Secrets:**
- `ANTHROPIC_API_KEY` — Claude API key
- `SB_URL` — Supabase project URL
- `SB_SERVICE_KEY` — Supabase service role key

---

## Supabase RPC Functions

Access via `supabase.rpc(function_name, params)`

### ingest_extraction

Ingest structured extraction JSON into the database (creates artifacts, relationships, dimensions).

**Signature:**
```sql
ingest_extraction(
  p_convergence_id uuid,
  p_session_title text DEFAULT 'App contribution',
  p_extraction jsonb DEFAULT '{}',
  p_actor_id uuid DEFAULT NULL,
  p_actor_type text DEFAULT 'agent'
) RETURNS jsonb
```

**Parameters:**
- `p_convergence_id` — Convergence UUID
- `p_session_title` — Source session name
- `p_extraction` — Extraction JSON (artifacts, relationships, commitments)
- `p_actor_id` — Participant or agent UUID
- `p_actor_type` — 'human' | 'agent'

**Returns:**
```json
{
  "artifacts_created": 3,
  "relationships_created": 2,
  "commitments_created": 0,
  "errors": []
}
```

---

### word_frequencies

Calculate word frequency distribution for a dimension or convergence.

**Signature:**
```sql
word_frequencies(
  p_convergence_id uuid DEFAULT NULL,
  p_dimension text DEFAULT NULL
) RETURNS TABLE (word text, count bigint)
```

**Example:**
```typescript
const { data } = await supabase.rpc('word_frequencies', { 
  p_convergence_id: convergence_id,
  p_dimension: 'hlamt:L' 
})
```

---

### get_contribution_thread

Get full reply chain for a contribution (recursive).

**Signature:**
```sql
get_contribution_thread(p_contribution_id uuid)
RETURNS TABLE (
  id uuid,
  content text,
  participant_id uuid,
  participant_name text,
  created_at timestamptz,
  status text,
  depth integer
)
```

**Returns:** Ordered list of contributions (root + replies) with depth indentation.

---

### get_weighted_dimension_distribution

Get dimension statistics with weights (total, count, average).

**Signature:**
```sql
get_weighted_dimension_distribution(p_convergence_id uuid DEFAULT NULL)
RETURNS TABLE (
  dimension_key text,
  total_weight numeric,
  artifact_count bigint,
  avg_weight numeric
)
```

**Example:**
```typescript
const { data } = await supabase.rpc('get_weighted_dimension_distribution', {
  p_convergence_id: convergence_id
})
// Returns: [
//   { dimension_key: 'A', total_weight: 12.4, artifact_count: 18, avg_weight: 0.69 },
//   ...
// ]
```

---

### search_content

Full-text search across artifacts and contributions.

**Signature:**
```sql
search_content(p_query text, p_convergence_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  type text, -- 'artifact' | 'contribution'
  title text,
  snippet text,
  rank real
)
```

**Example:**
```typescript
const { data } = await supabase.rpc('search_content', {
  p_query: 'regenerative finance',
  p_convergence_id: convergence_id
})
```

Uses PostgreSQL `websearch_to_tsquery` with `ts_headline` for snippets.

---

### get_active_convergence

Get the currently active convergence configuration.

**Signature:**
```sql
get_active_convergence() RETURNS jsonb
```

**Returns:**
```json
{
  "id": "uuid",
  "name": "ETHBoulder",
  "slug": "ethboulder",
  "start_date": "2026-02-13",
  "end_date": "2026-02-16",
  "theme_primary": "#c3fd50",
  "theme_bg": "#0f0f0f",
  "logo_text": "EthBoulder",
  "logo_accent": "#c3fd50",
  "dimensions": [...]
}
```

---

### export_convergence_jsonld

Export convergence data as schema.org JSON-LD.

**Signature:**
```sql
export_convergence_jsonld(p_convergence_id uuid DEFAULT NULL) RETURNS jsonb
```

**Returns:** JSON-LD document with artifacts as CreativeWork/Person/Event, relationships as Action, participants, metadata.

---

### merge_artifacts

Merge duplicate artifacts (admin only).

**Signature:**
```sql
merge_artifacts(
  p_source_artifact_id uuid,
  p_target_artifact_id uuid,
  p_merged_title text DEFAULT NULL,
  p_merged_summary text DEFAULT NULL
) RETURNS jsonb
```

**Returns:**
```json
{
  "success": true,
  "source_artifact_id": "uuid",
  "target_artifact_id": "uuid",
  "relationships_updated": 5,
  "dimensions_moved": 3,
  "tags_moved": 2,
  "participants_moved": 1,
  "merged_at": "2026-02-11T20:00:00Z"
}
```

Consolidates all relationships, dimensions, tags, participants. Source artifact marked as `state='merged'`.

---

### create_convergence_from_template

Create a new convergence from a template (Sprint 32).

**Signature:**
```sql
create_convergence_from_template(
  p_template_id uuid,
  p_name text,
  p_slug text,
  p_start_date date,
  p_end_date date,
  p_location text DEFAULT NULL
) RETURNS uuid
```

**Returns:** UUID of newly created convergence.

**Templates available:** hackathon, conference, workshop, unconference.

---

### get_graph_data

Get full graph dataset for visualization (Sprint 36 / Graph Enhancement Phase 3).

**Signature:**
```sql
get_graph_data(p_convergence_id uuid) RETURNS jsonb
```

**Returns:**
```json
{
  "nodes": [
    {
      "id": "uuid",
      "title": "Artifact Title",
      "type": "idea",
      "rea_role": "resource",
      "created_at": "2026-02-11T18:00:00Z",
      "dimensions": [
        {"dimension": "hlamt:A", "key": "A", "weight": 0.8},
        {"dimension": "hlamt:H", "key": "H", "weight": 0.4}
      ],
      "participants": [
        {"participant_id": "uuid", "name": "Alice", "role": "steward"}
      ],
      "connection_count": 5
    }
  ],
  "edges": [
    {
      "from_artifact_id": "uuid",
      "to_artifact_id": "uuid",
      "type": "builds_on",
      "created_at": "2026-02-11T18:05:00Z"
    }
  ],
  "dimension_summary": [
    {"dimension_key": "A", "count": 12, "total_weight": 8.4}
  ]
}
```

---

### get_coordination_graph

Get participant↔artifact coordination signals.

**Signature:**
```sql
get_coordination_graph(p_convergence_id uuid) RETURNS jsonb
```

**Returns:**
```json
{
  "coordination_edges": [
    {
      "participant_id": "uuid",
      "participant_name": "Alice",
      "artifact_id": "uuid",
      "artifact_title": "Regenerative Finance Framework"
    }
  ]
}
```

---

### get_graph_timeline

Get temporal data for timeline visualization.

**Signature:**
```sql
get_graph_timeline(p_convergence_id uuid) RETURNS jsonb
```

**Returns:**
```json
{
  "artifacts": [
    {"id": "uuid", "title": "Title", "created_at": "...", "cumulative_count": 1}
  ],
  "relationships": [
    {"from_id": "uuid", "to_id": "uuid", "type": "builds_on", "created_at": "..."}
  ]
}
```

---

## Database Views

### graph_data

Comprehensive artifact data with aggregated dimensions and participants.

**Columns:**
- `id`, `title`, `type`, `state`, `rea_role`, `agent_type`, `event_temporality`, `created_at`, `origin_convergence_id`
- `dimensions` (jsonb array)
- `participants` (jsonb array)
- `connection_count` (integer)

**Access:** `SELECT * FROM graph_data WHERE origin_convergence_id = $1`

---

### contribution_feed

Live contribution stream with metadata.

**Columns:**
- `id`, `content`, `participant_id`, `parent_contribution_id`, `participant_name`, `created_at`, `status`, `convergence_id`, `convergence_name`, `reply_count`, `errors`

**Access:** `SELECT * FROM contribution_feed WHERE convergence_id = $1 ORDER BY created_at DESC`

---

### extraction_health_metrics

Pipeline health indicators.

**Columns:**
- `total_contributions`, `pending`, `processing`, `complete`, `error`
- `success_rate_1h`, `success_rate_24h`
- `avg_processing_time_1h`, `avg_processing_time_24h`

**Access:** `SELECT * FROM extraction_health_metrics`

---

## Authentication

All endpoints respect Supabase Row Level Security (RLS).

**Anon access:**
- Read: artifacts, participants, contributions (status != 'deleted'), convergences
- Write: contributions, coordination_interests (if authenticated)

**Authenticated access:**
- All anon permissions
- Write: artifacts (steward role), participant profiles (own profile)
- RPC: merge_artifacts (admin role)

**Service role:**
- Full access (used by Edge Functions)

---

## Rate Limiting

**Contributions:**
- Max 10 contributions per hour per participant (enforced by `check_contribution_rate_limit()` trigger)
- Content length: 20-10,000 characters

**Search:**
- No explicit rate limit (relies on Supabase connection pooling)

**API Functions:**
- Supabase default rate limits apply (1000 req/min for anon key)

---

## Error Handling

All Edge Functions return structured errors:

```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE" // (optional)
}
```

**Common error codes:**
- `NO_CONTENT` — Missing required content field
- `RATE_LIMIT_EXCEEDED` — Too many contributions
- `EXTRACTION_FAILED` — AI extraction error
- `INGEST_FAILED` — Database ingestion error

Errors are logged to `contributions.errors` JSONB array with timestamps and retry counts.

---

## Sprint 36 Acceptance Criteria ✅

- [x] Every Edge Function documented with request/response examples
- [x] Every RPC function documented with signature and return type
- [x] Database views documented
- [x] Authentication and rate limiting explained
- [x] Error handling patterns described

**Status:** API documentation complete.
