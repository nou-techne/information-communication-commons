# Status Page Assessment & Enhancement Design

**Author:** Nou (collective intelligence agent, Techne Studio)  
**Date:** 2026-02-11  
**Route:** `/app/status` → `Status.tsx`

---

## 1. Current State Analysis

### What Status.tsx Does Now

The current implementation is a **Sprint 12 extraction health monitor** with Sprint 25 error recovery. It renders four sections:

1. **Overall Health Banner** — green/red indicator based on failure rate threshold (<20%)
2. **Last Hour Metrics** — contribution counts (total, successful, failed, in-progress), success rate, avg processing time
3. **Last 24 Hours** — total/successful/failed counts and success rate
4. **Recent Errors** — last 5 extraction failures with content preview and error message
5. **Error Recovery** — authenticated users see failed contributions with retry buttons (resets status to `pending`)

**Data sources:**
- `extraction_health_metrics` view (1h + 24h windows)
- `get_recent_extraction_errors()` RPC (last 5)
- Direct query on `contributions` table for error-status rows

**Refresh:** 10-second polling interval.

### Strengths

- **Operational clarity** — shows pipeline health at a glance
- **Actionable** — retry button enables error recovery without DB access
- **Auto-refresh** — 10s polling keeps it current
- **Theme-consistent** — uses ETHBoulder palette correctly
- **Auth-aware** — retry only shown to authenticated users

### Limitations

1. **Pipeline-only** — shows extraction health but nothing about what's being extracted (knowledge graph vitality)
2. **No temporal depth** — only 1h and 24h snapshots; no trends, no history
3. **No participant visibility** — who's contributing? How many active participants?
4. **No dimension coverage** — the e/H-LAM/T system is invisible on status
5. **No graph metrics** — artifact counts, relationship density, types distribution absent
6. **No coordination signals** — handshake/coordinate activity not shown
7. **Binary health model** — only "healthy" vs "degraded" with a single threshold
8. **No error categorization** — errors are listed but not classified or aggregated
9. **Missing growth indicators** — no sense of whether the commons is growing or stagnant

---

## 2. Proposed Enhancements

### 2.1 System Pulse (Priority: HIGH)

**What:** Replace the static health banner with a live pulse indicator showing real-time processing state.

**Rationale:** The current binary healthy/degraded doesn't convey activity. A pulse shows the system is alive.

**Design:**
- Animated dot: green pulsing = active processing, amber = idle, red = errors
- Show `processing` and `pending` counts inline
- Time since last successful extraction ("Last extraction: 3m ago")

### 2.2 Knowledge Graph Vitality Panel (Priority: HIGH)

**What:** New section showing the state of the knowledge commons.

**Metrics:**
- Total artifacts by type (idea/proposal/commitment/pattern/synthesis/question/reflection)
- Total artifacts by state (seed → completed lifecycle)
- Relationship count and density (relationships / artifacts ratio)
- Dimension distribution radar — weighted dimension coverage using `get_weighted_dimension_distribution()`
- REA role breakdown (resource/event/agent)

**New DB query needed:**
```sql
CREATE OR REPLACE FUNCTION get_knowledge_graph_stats()
RETURNS JSON AS $$
SELECT json_build_object(
  'total_artifacts', (SELECT COUNT(*) FROM artifacts),
  'by_type', (SELECT json_object_agg(type, cnt) FROM (SELECT type, COUNT(*) cnt FROM artifacts GROUP BY type) t),
  'by_state', (SELECT json_object_agg(state, cnt) FROM (SELECT state, COUNT(*) cnt FROM artifacts GROUP BY state) t),
  'total_relationships', (SELECT COUNT(*) FROM artifact_relationships),
  'by_rel_type', (SELECT json_object_agg(type, cnt) FROM (SELECT type, COUNT(*) cnt FROM artifact_relationships GROUP BY type) t),
  'total_tags', (SELECT COUNT(DISTINCT tag_id) FROM artifact_tags),
  'total_participants', (SELECT COUNT(*) FROM participants),
  'rea_breakdown', (SELECT json_object_agg(COALESCE(rea_role::text, 'unclassified'), cnt) FROM (SELECT rea_role, COUNT(*) cnt FROM artifacts GROUP BY rea_role) t)
);
$$ LANGUAGE sql STABLE;
```

### 2.3 Participant Engagement (Priority: MEDIUM)

**What:** Show who's active and how participation flows.

**Metrics:**
- Active contributors (distinct participant_ids in contributions last 24h)
- Contribution frequency per participant (anonymized distribution)
- Coordination signals count (handshake events from events table)
- Thread depth distribution (how many reply chains exist)

**New DB function needed:**
```sql
CREATE OR REPLACE FUNCTION get_engagement_stats(p_hours integer DEFAULT 24)
RETURNS JSON AS $$
SELECT json_build_object(
  'active_contributors', (
    SELECT COUNT(DISTINCT participant_id) FROM contributions 
    WHERE created_at > NOW() - make_interval(hours => p_hours) AND participant_id IS NOT NULL
  ),
  'total_contributions', (
    SELECT COUNT(*) FROM contributions 
    WHERE created_at > NOW() - make_interval(hours => p_hours)
  ),
  'threaded_contributions', (
    SELECT COUNT(*) FROM contributions 
    WHERE parent_contribution_id IS NOT NULL 
    AND created_at > NOW() - make_interval(hours => p_hours)
  ),
  'coordination_signals', (
    SELECT COUNT(*) FROM events 
    WHERE type = 'coordination.signal' 
    AND created_at > NOW() - make_interval(hours => p_hours)
  )
);
$$ LANGUAGE sql STABLE;
```

### 2.4 Temporal Patterns (Priority: MEDIUM)

**What:** Hourly contribution histogram for the last 24 hours.

**Rationale:** Shows when the commons is most alive, helps stewards plan convergences.

**New DB function:**
```sql
CREATE OR REPLACE FUNCTION get_contribution_hourly_histogram(p_hours integer DEFAULT 24)
RETURNS TABLE (hour_bucket timestamptz, total bigint, successful bigint, failed bigint) AS $$
  SELECT 
    date_trunc('hour', created_at) as hour_bucket,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'complete') as successful,
    COUNT(*) FILTER (WHERE status = 'error') as failed
  FROM contributions
  WHERE created_at > NOW() - make_interval(hours => p_hours)
  GROUP BY date_trunc('hour', created_at)
  ORDER BY hour_bucket;
$$ LANGUAGE sql STABLE;
```

**UI:** Simple CSS bar chart (no charting library needed). Each bar = 1 hour, color-coded green/red.

### 2.5 Dimension Balance Radar (Priority: MEDIUM)

**What:** Visual representation of e/H-LAM/T dimension coverage.

**Data:** Already available via `get_weighted_dimension_distribution()`.

**UI:** Six-pointed radar/spider chart showing weighted coverage across dimensions. Pure CSS/SVG, no library. Dimensions mapped:
- e/ → spatial (Ecology)
- H → social (Human)  
- L → thematic (Language)
- A → (Artifacts — count by type)
- M → temporal (Methodology)
- T → energetic (Training)

### 2.6 Error Diagnostics Enhancement (Priority: LOW)

**What:** Categorize and aggregate errors instead of just listing them.

**Design:**
- Group errors by error message pattern (first 50 chars)
- Show resolution rate: (retried + succeeded) / total errors
- Show retry success rate

**New DB function:**
```sql
CREATE OR REPLACE FUNCTION get_error_diagnostics()
RETURNS TABLE (
  error_pattern text,
  occurrence_count bigint,
  first_seen timestamptz,
  last_seen timestamptz
) AS $$
  SELECT 
    LEFT(errors->-1->>'message', 80) as error_pattern,
    COUNT(*) as occurrence_count,
    MIN(created_at) as first_seen,
    MAX(created_at) as last_seen
  FROM contributions
  WHERE status = 'error' AND errors IS NOT NULL
  GROUP BY LEFT(errors->-1->>'message', 80)
  ORDER BY occurrence_count DESC
  LIMIT 10;
$$ LANGUAGE sql STABLE;
```

### 2.7 Quality Indicators (Priority: LOW)

**What:** Show extraction quality signals.

**Metrics:**
- Average dimensions per artifact
- Average tags per artifact
- Artifacts with no dimensions (incomplete extraction)
- Average dimension weight (confidence proxy)

---

## 3. Data Model Requirements Summary

| Function | Purpose | Priority |
|---|---|---|
| `get_knowledge_graph_stats()` | Artifact/relationship/tag totals and breakdowns | HIGH |
| `get_engagement_stats(hours)` | Active contributors, threads, coordination | MEDIUM |
| `get_contribution_hourly_histogram(hours)` | Temporal bar chart data | MEDIUM |
| `get_error_diagnostics()` | Grouped error patterns | LOW |
| `get_quality_indicators()` | Extraction completeness metrics | LOW |
| `get_weighted_dimension_distribution()` | Already exists | — |

All new functions should be `LANGUAGE sql STABLE` and granted to `anon, authenticated`.

---

## 4. UI/UX Design

### Layout (Top to Bottom)

```
┌─────────────────────────────────────────────┐
│  System Pulse    [●] Active  │ Last: 3m ago │  ← replaces health banner
├─────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Last Hour     │  │ Knowledge Graph      │ │  ← side by side on desktop
│  │ (existing)    │  │ 142 artifacts        │ │
│  │               │  │ 67 relationships     │ │
│  │               │  │ type breakdown       │ │
│  └──────────────┘  └──────────────────────┘ │
├─────────────────────────────────────────────┤
│  24h Activity Histogram                      │  ← CSS bar chart
│  ▁▂▃▅▇█▇▅▃▂▁▁▂▃▅▇█▇▅▃▂▁▁                  │
├─────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Participants  │  │ Dimension Balance    │ │
│  │ 12 active     │  │ [radar/spider SVG]   │ │
│  │ 3 threads     │  │                      │ │
│  └──────────────┘  └──────────────────────┘ │
├─────────────────────────────────────────────┤
│  Recent Errors + Error Recovery (existing)   │
└─────────────────────────────────────────────┘
```

### Design Decisions

- **No charting library** — pure CSS bars and inline SVG for radar. Keeps bundle small.
- **Responsive grid** — 2-column on desktop, stacked on mobile (existing Tailwind pattern)
- **ETHBoulder palette** — bg `#0f0f0f`, surface `#1a1a1a`, border `#262626`, accent `#c3fd50`
- **Component extraction** — each panel becomes its own component under `src/components/status/`

### Component Structure

```
src/
  pages/Status.tsx              ← orchestrator, data loading
  components/status/
    SystemPulse.tsx             ← animated health indicator
    ExtractionMetrics.tsx       ← existing 1h/24h metrics (extracted)
    KnowledgeGraphVitality.tsx  ← artifact/relationship stats
    ActivityHistogram.tsx       ← 24h bar chart
    ParticipantEngagement.tsx   ← contributor stats
    DimensionRadar.tsx          ← e/H-LAM/T spider chart
    ErrorDiagnostics.tsx        ← grouped errors + recovery
```

---

## 5. Implementation Plan

### Phase 1: Foundation (1-2 days)
1. Create `get_knowledge_graph_stats()` DB function
2. Extract existing metrics into `ExtractionMetrics` component
3. Add `SystemPulse` component (replace banner)
4. Add `KnowledgeGraphVitality` component
5. Restructure Status.tsx as orchestrator

### Phase 2: Engagement & Temporal (1-2 days)
1. Create `get_engagement_stats()` and `get_contribution_hourly_histogram()` functions
2. Implement `ActivityHistogram` with CSS bars
3. Implement `ParticipantEngagement` component
4. Wire `get_weighted_dimension_distribution()` into `DimensionRadar` SVG

### Phase 3: Quality & Diagnostics (1 day)
1. Create `get_error_diagnostics()` function
2. Enhance error section with categorization
3. Add quality indicators

### Migration file: `018_status_dashboard_functions.sql`

---

## 6. Priority Ranking

| # | Enhancement | Impact | Effort | Priority |
|---|---|---|---|---|
| 1 | Knowledge Graph Vitality | High — makes the commons visible | Medium | **P0** |
| 2 | System Pulse | High — better health signal | Low | **P0** |
| 3 | Activity Histogram | Medium — temporal awareness | Medium | **P1** |
| 4 | Dimension Balance Radar | Medium — shows e/H-LAM/T health | Medium | **P1** |
| 5 | Participant Engagement | Medium — community visibility | Low | **P1** |
| 6 | Error Diagnostics | Low — operational improvement | Low | **P2** |
| 7 | Quality Indicators | Low — extraction insight | Low | **P2** |

---

## 7. User Perspectives

### Participants (Transparency)
> "Is the system working? Is my contribution being processed?"

They see: System pulse, their contribution in the pipeline, extraction success rate. The status page builds trust — the commons is transparent about its own health.

### Stewards (Operations)  
> "Are there errors I need to address? Is the extraction pipeline healthy? What needs attention?"

They see: Error diagnostics with retry, processing times, failure patterns, dimension gaps that suggest extraction prompt tuning.

### Visitors (Vitality)
> "Is this project alive? Is anyone using it?"

They see: Knowledge graph stats (142 artifacts, 67 relationships), activity histogram showing recent contributions, participant count. This is the "proof of life" for the commons.

---

## 8. Connection to e/H-LAM/T

The status page itself embodies the framework:

- **e/ (Ecology)** — the page shows the health of the digital ecology
- **H (Human)** — participant engagement makes human contribution visible
- **L (Language)** — contribution content flowing through extraction
- **A (Artifacts)** — knowledge graph vitality is the artifact layer
- **M (Methodology)** — the extraction pipeline IS the methodology
- **T (Training)** — quality metrics indicate how well the system learns to extract

The dimension radar makes this connection explicit and visual.

---

*This assessment was generated by analyzing the current Status.tsx, database schema (17 migrations), and the broader commons architecture. Implementation should proceed in phases, with Phase 1 deliverable within a sprint.*
