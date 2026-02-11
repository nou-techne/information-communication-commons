# Graph Visualization Assessment & Enhancement Design

**Author:** Nou (collective intelligence agent, Techne Studio)  
**Date:** 2026-02-11  
**Status:** Assessment complete, implementation proposals ready

---

## 1. Current State Analysis

### What Graph.tsx Does

The current implementation is a D3 force-directed graph that:
- Fetches up to 100 artifacts and 200 relationships from Supabase
- Renders artifacts as circular nodes, relationships as directed edges with arrowheads
- Supports two color modes: by REA role (resource/event/agent) or by artifact type (idea/proposal/commitment/etc.)
- Provides click-to-select with a detail sidebar showing title, type, REA role, and a link to the artifact detail page
- Supports drag interaction and zoom/pan via D3
- Uses the ETHBoulder dark theme (#0f0f0f bg, #c3fd50 primary)

### Strengths

1. **Clean foundation** — D3 force simulation with proper zoom, drag, and collision detection
2. **REA/type color coding** — meaningful visual encoding of the knowledge ontology
3. **Interactive selection** — click-to-inspect with navigation to detail pages
4. **Performant constraints** — limits to 100 nodes / 200 edges (avoids overwhelming the browser)
5. **Arrow markers** — directed relationships are visually clear

### Limitations

1. **Flat topology** — all nodes are the same size, no visual hierarchy. A seed idea looks identical to a major synthesis.
2. **No dimension data** — the e/H-LAM/T dimension system is completely absent. The graph doesn't show *what dimensions* an artifact touches or how heavily weighted those connections are.
3. **No temporal awareness** — no sense of when artifacts were created. The graph is a static snapshot with no growth narrative.
4. **No participants** — who created or stewards artifacts is invisible. Coordination signals (handshake interests) are absent.
5. **No contributions** — the contribution pipeline that *constructs* the knowledge graph is invisible. You can't see how observations flow in and crystallize into artifacts.
6. **No weighted edges** — all relationship lines are identical (`stroke-width: 1`, `opacity: 0.3`). The `weight` column on `artifact_dimensions` is unused.
7. **No clustering** — related artifacts don't visually cluster by theme, dimension, or convergence.
8. **Labels missing** — nodes show titles only on hover (`<title>` tooltip). No persistent text labels.
9. **Fixed limit** — hardcoded to 100/200 with no pagination or filtering by convergence/dimension/time.
10. **No real-time updates** — the graph loads once and doesn't subscribe to Supabase real-time channels.

---

## 2. Proposed Enhancements

### 2.1 Dimension Constellation View (Priority: 🔴 Critical)

**Concept:** Make the six e/H-LAM/T dimensions first-class nodes in the graph. Each dimension becomes a gravitational center, and artifacts orbit the dimensions they touch, weighted by intensity.

**Visual design:**
- 6 dimension nodes arranged in a hexagonal layout (or free-floating with strong charge)
- Each dimension node uses its configured color from the convergence `dimensions` JSONB
- Dimension nodes are larger (r=24) with letter labels (e/, H/, L/, A/, M/, T/)
- Artifact nodes connect to dimension nodes via edges whose thickness = `artifact_dimensions.weight`
- Artifacts touching multiple dimensions create cross-links, revealing interdisciplinary clusters

**Data requirements:**
```sql
-- Fetch artifact-dimension connections with weights
SELECT ad.artifact_id, ad.dimension, ad.key, ad.value, ad.weight
FROM artifact_dimensions ad
JOIN artifacts a ON a.id = ad.artifact_id
WHERE a.origin_convergence_id = $1;
```

**Rationale:** The dimension system is the conceptual backbone of commons.id. Making it visible in the graph transforms it from "a list of dots" into "a map of collective intelligence across six lenses."

### 2.2 Temporal Growth Animation (Priority: 🔴 Critical)

**Concept:** A timeline slider at the bottom of the graph that controls which artifacts and edges are visible based on `created_at`. Drag the slider to replay graph growth. Optional auto-play animation.

**Visual design:**
- Range slider with min = earliest artifact `created_at`, max = now
- As the slider advances, nodes fade in with a brief scale animation
- Edges appear when both connected nodes are visible
- Play/pause button for automatic playback
- Speed control (1x, 2x, 5x)
- Current timestamp displayed as `MMM DD, HH:mm`

**Data requirements:**
- Already available: `artifacts.created_at`, `artifact_relationships.created_at`
- Need: contributions with `created_at` to show the input pipeline

**Rationale:** Knowledge graphs grow. Showing *how* they grow reveals patterns: bursts of activity, branching threads, convergence moments.

### 2.3 Contribution Flow Layer (Priority: 🟡 High)

**Concept:** Show contributions as small transient particles that flow into the graph, indicating where new knowledge is entering. When a contribution gets processed into an artifact, show the transformation.

**Visual design:**
- Contributions shown as small diamonds (◇) in a distinct color (muted primary #c3fd50 at 40% opacity)
- Animated flow lines from contribution → artifact it generated
- Thread chains (parent_contribution_id) shown as dotted links between contribution nodes
- Toggle to show/hide contribution layer (default: hidden for clarity)

**Data requirements:**
```sql
SELECT c.id, c.content, c.participant_id, c.created_at, c.parent_contribution_id,
       p.name as participant_name
FROM contributions c
LEFT JOIN participants p ON p.id = c.participant_id
WHERE c.convergence_id = $1 AND c.status != 'deleted'
ORDER BY c.created_at;
```

### 2.4 Coordination Signal Overlay (Priority: 🟡 High)

**Concept:** When participants express coordination interest on an artifact (via the Coordinate button), show those signals as participant↔artifact connections. When multiple participants signal interest on the same artifact, the artifact node pulses or glows.

**Visual design:**
- Participant nodes: small hexagons at the graph periphery
- Coordination interest edges: dashed lines in primary color (#c3fd50)
- "Hot" artifacts (≥3 coordination signals): pulsing glow animation
- Hover on participant shows all their coordination interests highlighted

**Data requirements:**
```sql
SELECT ci.artifact_id, ci.participant_id, p.name
FROM coordination_interests ci
JOIN participants p ON p.id = ci.participant_id
WHERE ci.artifact_id IN (SELECT id FROM artifacts WHERE origin_convergence_id = $1);
```

### 2.5 Weighted & Typed Edges (Priority: 🟢 Medium)

**Concept:** Differentiate relationship types visually and use dimension weights for edge properties.

**Visual design:**
- Edge thickness: 1-4px based on relationship significance
- Edge color by type: `builds_on` (green), `extends` (blue), `contradicts` (red), `supersedes` (orange), `synthesizes` (gold), `related_to` (gray)
- Edge labels on hover showing relationship type
- Dimension-artifact edges: opacity = weight value (0.0 → transparent, 1.0 → solid)

### 2.6 Real-Time Updates (Priority: 🟢 Medium)

**Concept:** Subscribe to Supabase real-time channels so the graph grows live during a convergence.

**Implementation:**
```typescript
supabase.channel('graph-updates')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'artifacts' }, handleNewArtifact)
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'artifact_relationships' }, handleNewRelationship)
  .subscribe()
```

New nodes animate in with a ripple effect. The graph simulation gently re-balances.

### 2.7 Filter & Focus Controls (Priority: 🟢 Medium)

- Filter by convergence (dropdown)
- Filter by dimension (toggle each of e/H-LAM/T)
- Filter by artifact type
- Filter by time range
- Search to highlight specific nodes
- "Focus mode": click a node to see only its N-hop neighborhood

---

## 3. Data Model Requirements

### New Queries Needed

| Query | Purpose | Tables |
|-------|---------|--------|
| `get_graph_data(convergence_id)` | Full graph with dimensions, weights, participants | artifacts, artifact_relationships, artifact_dimensions, artifact_participants |
| `get_coordination_graph(convergence_id)` | Participant↔artifact coordination signals | coordination_interests, participants |
| `get_contribution_flow(convergence_id)` | Contribution timeline with threading | contributions, participants |
| `get_graph_timeline(convergence_id)` | Artifact + relationship creation timestamps | artifacts, artifact_relationships |

### Suggested Database View

```sql
CREATE OR REPLACE VIEW graph_data AS
SELECT 
  a.id,
  a.title,
  a.type,
  a.state,
  a.rea_role,
  a.created_at,
  a.origin_convergence_id,
  -- Aggregate dimensions as JSONB array
  COALESCE(
    jsonb_agg(DISTINCT jsonb_build_object(
      'dimension', ad.dimension,
      'key', ad.key,
      'value', ad.value,
      'weight', ad.weight
    )) FILTER (WHERE ad.id IS NOT NULL),
    '[]'::jsonb
  ) as dimensions,
  -- Aggregate participants
  COALESCE(
    jsonb_agg(DISTINCT jsonb_build_object(
      'participant_id', ap.participant_id,
      'role', ap.role
    )) FILTER (WHERE ap.participant_id IS NOT NULL),
    '[]'::jsonb
  ) as participants
FROM artifacts a
LEFT JOIN artifact_dimensions ad ON ad.artifact_id = a.id
LEFT JOIN artifact_participants ap ON ap.artifact_id = a.id
GROUP BY a.id;
```

---

## 4. UI/UX Design Decisions

### Layout Architecture

```
┌─────────────────────────────────────────────────┐
│  Knowledge Graph    [REA] [Type] [Dimension]    │  ← Mode switcher
│  12 artifacts · 8 relationships · 3 dimensions  │
├─────────────┬───────────────────────────────────┤
│             │                                   │
│  Filters    │        D3 Force Graph             │
│  ─────────  │                                   │
│  □ e/       │    e/──●──●                       │
│  □ H/       │       │  │ ╲                      │
│  □ L/       │    H/─●──●──A/                    │
│  □ A/       │       │     │                     │
│  □ M/       │    M/─●─────●                     │
│  □ T/       │       │                           │
│             │    T/──●                           │
│  Layers     │                                   │
│  ─────────  │                                   │
│  □ Contrib  │                                   │
│  □ Coord    │                                   │
│  □ Particip │                                   │
│             │                                   │
├─────────────┴───────────────────────────────────┤
│  ◀ ▶ ▶▶  ════════════●═══════════  Feb 11 20:00│  ← Timeline slider
└─────────────────────────────────────────────────┘
```

### Color System

Use dimension colors from the convergence config (stored in `convergences.dimensions` JSONB):

| Dimension | Letter | Color | Meaning |
|-----------|--------|-------|---------|
| Ecology | e/ | `#4a8c6f` | Where We Are |
| Human | H/ | `#c4956a` | Who's Here |
| Language | L/ | `#c3fd50` | How We Talk |
| Artifacts | A/ | `#8bbfff` | What We're Building |
| Methodology | M/ | `#7ccfb8` | How We Work |
| Training | T/ | `#e8927c` | What We're Learning |

### Interaction Model

1. **Default view:** Dimension constellation — 6 dimension hubs + artifact nodes connected by weighted edges
2. **Hover:** Show node label, dimension weights, connected count
3. **Click:** Select node, show detail panel (existing behavior, enhanced)
4. **Double-click:** Focus mode — isolate N-hop neighborhood
5. **Timeline drag:** Filter graph to show only artifacts created before the timestamp
6. **Layer toggles:** Show/hide contributions, coordination signals, participants

### Node Sizing

- **Dimension nodes:** r = 20-24, hexagonal or circle with letter label
- **Artifact nodes:** r = 6-14, scaled by connection count (degree centrality)
- **Contribution nodes:** r = 4, diamond shape (when layer enabled)
- **Participant nodes:** r = 8, hexagonal (when layer enabled)

---

## 5. Implementation Plan

### Phase 1: Dimension Constellation (1-2 days)

**Changes to Graph.tsx:**

1. Add dimension nodes to the graph data:
   - Fetch `artifact_dimensions` with weights
   - Create 6 synthetic dimension nodes
   - Create artifact→dimension edges with weight-based thickness

2. Update D3 simulation:
   - Add `forceRadial` to push dimension nodes to a ring
   - Increase charge strength for dimension nodes
   - Size nodes by type (dimension vs artifact)

3. Add "Color by Dimension" mode alongside existing REA/Type modes

4. Update legend to show dimension colors

**New queries:**
```typescript
const { data: dimensions } = await supabase
  .from('artifact_dimensions')
  .select('artifact_id, dimension, key, weight')
```

### Phase 2: Timeline Slider (1-2 days)

**New component: `TimelineSlider.tsx`**

1. Calculate time range from artifact `created_at` values
2. Render range input with play/pause controls
3. Pass `maxTime` filter to Graph.tsx
4. Graph filters visible nodes/edges by `created_at <= maxTime`
5. Animated transitions as nodes appear/disappear

### Phase 3: Weighted Edges + Visual Polish (1 day)

1. Edge thickness = `weight * 3 + 1` for dimension edges
2. Edge color by `relationship_type` for artifact-artifact edges
3. Node size by degree centrality
4. Persistent text labels for dimension nodes
5. Tooltip enhancement showing dimension weights

### Phase 4: Coordination & Participant Layer (1-2 days)

**New component: `GraphLayers.tsx`**

1. Fetch `coordination_interests` data
2. Add participant nodes (togglable)
3. Add coordination edges (dashed, primary color)
4. Pulse animation on highly-coordinated artifacts
5. Filter panel with checkboxes for each layer

### Phase 5: Contribution Flow (1-2 days)

1. Fetch contributions with threading
2. Small diamond nodes positioned near their generated artifacts
3. Thread chains as dotted lines
4. Toggle layer visibility

### Phase 6: Real-Time & Filters (1 day)

1. Supabase real-time subscription
2. Convergence selector dropdown
3. Dimension toggle filters
4. Search highlighting

---

## 6. Priority Ranking

| # | Enhancement | Impact | Effort | Priority |
|---|------------|--------|--------|----------|
| 1 | Dimension Constellation | 🔥 Transformative — makes the e/H-LAM/T framework visible | 1-2 days | **P0** |
| 2 | Timeline Slider | 🔥 Reveals growth narrative | 1-2 days | **P0** |
| 3 | Weighted/Typed Edges | 🔶 Better visual encoding | 1 day | **P1** |
| 4 | Coordination Overlay | 🔶 Shows emergent collaboration | 1-2 days | **P1** |
| 5 | Contribution Flow | 🔷 Input pipeline visibility | 1-2 days | **P2** |
| 6 | Real-Time Updates | 🔷 Live convergence experience | 1 day | **P2** |
| 7 | Filters & Focus | 🔷 Navigation at scale | 1 day | **P2** |

---

## 7. Technical Notes

- **D3 version:** Current code uses D3 force simulation — all enhancements are compatible
- **Performance:** With dimension nodes, max graph size becomes ~106 nodes (100 artifacts + 6 dimensions) + ~300 edges. Still well within D3's comfortable range. Beyond 500 nodes, consider WebGL (e.g., force-graph library).
- **Mobile:** The current SVG approach works on mobile but the interaction model needs touch-friendly adjustments. Consider a simplified "card view" fallback below 768px width.
- **Accessibility:** Add ARIA labels to SVG groups. Keyboard navigation for node selection. High-contrast mode using just shape + size (no color dependency).
- **State management:** Current component-local state is fine for Phase 1-3. If real-time + filters + layers get complex, consider extracting to a `useGraphStore` (zustand or context).

---

## 8. Summary

The current Graph.tsx is a solid D3 foundation that shows artifacts and relationships. The primary gap is that **the dimension system — the conceptual heart of commons.id — is invisible**. The highest-impact enhancement is making e/H-LAM/T dimensions into gravitational centers of the graph, with weighted edges showing how artifacts relate to each dimension.

Combined with a timeline slider, the graph becomes a living narrative of how collective intelligence grows across six lenses — ecology, human, language, artifacts, methodology, and training.

The implementation is incremental: each phase adds a layer without breaking existing functionality, and the data model already supports everything needed.
