# ROADMAP_100 — 100-Sprint Roadmap for commons.id

**Start:** Sprint 71 | **End:** Sprint 170 | **Method:** Ebb-flow cycles (4 ebb + 4 flow = 8 sprints/cycle, 12.5 cycles)

**Constraint:** Every sprint is completable in <10 minutes by modifying repo files. Zero external dependencies. Zero blockers. Every sprint = one commit.

---

## TIO Roles
- **Schema Architect** — Layer 1: Identity
- **Backend Engineer** — Layer 2: State
- **Integration Engineer** — Layer 3: Relationship
- **Event Systems Engineer** — Layer 4: Event
- **Workflow Engineer** — Layer 5: Flow
- **Compliance & Security Engineer** — Layer 6: Constraint
- **Frontend & DevOps Engineer** — Layer 7: View
- **Product Engineer** — Cross-layer
- **QA & Test Engineer** — All layers
- **Technical Lead** — All layers

## 7-Layer Pattern Stack
1. **Identity** — Who/what exists
2. **State** — Current data shape
3. **Relationship** — How things connect
4. **Event** — What happened
5. **Flow** — How things move
6. **Constraint** — Rules and boundaries
7. **View** — What users see

---

## Cycle 1 — Thread Workflow Completion (Sprints 71–78)

### Ebb Phase (71–74): Introspection & Foundation

### Sprint 71 — Thread Status State Machine
- **Role:** Schema Architect | **Layer:** Identity (1)
- Define a TypeScript enum and state machine type for thread lifecycle: `open → active → resolved → archived`. Add `src/types/thread-states.ts`.
- **AC:** File exports `ThreadStatus` enum and `ThreadTransition` type with all valid transitions.

### Sprint 72 — Thread Status Badges Component
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/components/ThreadStatusBadge.tsx` — renders colored badge per status (green=open, blue=active, amber=resolved, gray=archived).
- **AC:** Component renders all 4 states with distinct colors. Storybook-style demo in component file comments.

### Sprint 73 — Thread Resolution Metadata Type
- **Role:** Schema Architect | **Layer:** State (2)
- Add `src/types/thread-resolution.ts` — resolution reason enum (`answered`, `merged`, `wont-fix`, `duplicate`), resolution metadata interface with `resolvedBy`, `resolvedAt`, `reason`, `summary`.
- **AC:** Types exported and importable from types index.

### Sprint 74 — Thread Filter Bar Component
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/components/ThreadFilterBar.tsx` — horizontal filter chips for status, dimension, and participant count. Local state only.
- **AC:** Component renders filter chips, toggles active state on click, emits filter object via onChange prop.

### Flow Phase (75–78): Building Forward

### Sprint 75 — Wire Thread Status Into Thread List
- **Role:** Integration Engineer | **Layer:** Relationship (3)
- Integrate `ThreadStatusBadge` into the existing thread list view. Add status column/badge next to each thread title.
- **AC:** Thread list shows status badge for every thread. Default status is `open`.

### Sprint 76 — Thread Resolution Dialog
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/components/ResolveThreadDialog.tsx` — modal with reason dropdown, summary textarea, confirm button. Calls an onResolve callback.
- **AC:** Dialog opens, user selects reason, types summary, clicks resolve. Callback receives resolution metadata.

### Sprint 77 — Thread Archive Action
- **Role:** Workflow Engineer | **Layer:** Flow (5)
- Add archive button to resolved threads. Clicking transitions status to `archived` and moves thread to bottom of list with muted styling.
- **AC:** Resolved threads show "Archive" button. Clicking it changes status and visually de-emphasizes the thread.

### Sprint 78 — Thread Activity Timeline Component
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/components/ThreadTimeline.tsx` — vertical timeline showing messages, status changes, and resolution events for a thread.
- **AC:** Timeline renders chronological list of events with icons, timestamps, and actor names.

---

## Cycle 2 — UI Polish & Design System (Sprints 79–86)

### Ebb Phase (79–82)

### Sprint 79 — Design Tokens File
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/styles/tokens.ts` exporting color palette, spacing scale, typography scale, border radii, and shadow definitions as constants.
- **AC:** File exports named tokens. At least 5 color families, 8 spacing values, 4 font sizes.

### Sprint 80 — Consistent Button Component
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/components/ui/Button.tsx` — primary, secondary, ghost, danger variants. Uses design tokens. Supports `size`, `disabled`, `loading` props.
- **AC:** Button renders all 4 variants with proper token-based styling. Loading state shows spinner.

### Sprint 81 — Card Component
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/components/ui/Card.tsx` — composable card with `Card`, `CardHeader`, `CardBody`, `CardFooter` subcomponents. Uses tokens for shadows and radii.
- **AC:** Card renders with header, body, footer sections. Supports `variant` prop (default, outlined, elevated).

### Sprint 82 — Input & Textarea Components
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/components/ui/Input.tsx` and `Textarea.tsx` — styled form inputs with label, error state, helper text support.
- **AC:** Components render with labels, show red border + error message on error prop, support disabled state.

### Flow Phase (83–86)

### Sprint 83 — Migrate Dashboard to Design System
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Refactor dashboard view to use `Card`, `Button` from design system. Replace inline styles/ad-hoc classes.
- **AC:** Dashboard renders with Card components wrapping each section. No inline color/spacing values remain.

### Sprint 84 — Empty State Components
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/components/ui/EmptyState.tsx` — illustration placeholder, title, description, optional CTA button. Wire into thread list (no threads) and knowledge graph (no nodes).
- **AC:** Empty states show in thread list and graph view when data is empty.

### Sprint 85 — Toast Notification System
- **Role:** Event Systems Engineer | **Layer:** Event (4)
- Create `src/components/ui/Toast.tsx` and `src/hooks/useToast.ts` — toast context provider, `success`/`error`/`info` variants, auto-dismiss after 3s.
- **AC:** `useToast()` hook returns `toast.success("msg")` etc. Toasts render in fixed position, auto-dismiss.

### Sprint 86 — Keyboard Shortcuts Help Modal
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/components/KeyboardShortcutsModal.tsx` — triggered by `?` key. Lists all current keyboard shortcuts in a grid.
- **AC:** Pressing `?` opens modal showing shortcut keys and descriptions. Escape closes it.

---

## Cycle 3 — Agent API Foundation (Sprints 87–94)

### Ebb Phase (87–90)

### Sprint 87 — API Route Types
- **Role:** Schema Architect | **Layer:** Identity (1)
- Create `src/types/api.ts` — request/response types for all planned API endpoints: contributions, threads, participants, graph, search.
- **AC:** File exports typed interfaces for at least 10 API request/response pairs.

### Sprint 88 — API Client Module
- **Role:** Backend Engineer | **Layer:** State (2)
- Create `src/lib/api-client.ts` — typed fetch wrapper with `get<T>`, `post<T>`, `put<T>`, `delete<T>` methods. Handles JSON serialization, error types.
- **AC:** Module exports typed HTTP methods. Error responses parsed into `ApiError` type.

### Sprint 89 — API Key Type & Validator
- **Role:** Compliance & Security Engineer | **Layer:** Constraint (6)
- Create `src/lib/api-keys.ts` — API key format (`cid_live_xxxx` / `cid_test_xxxx`), validation function, prefix extraction, key metadata type.
- **AC:** `validateApiKey` returns `{ valid, type, prefix }`. Invalid formats rejected.

### Sprint 90 — Rate Limiter Utility
- **Role:** Compliance & Security Engineer | **Layer:** Constraint (6)
- Create `src/lib/rate-limiter.ts` — in-memory sliding window rate limiter. Configurable window size and max requests. Returns `{ allowed, remaining, resetAt }`.
- **AC:** Rate limiter correctly limits after N requests, resets after window. Unit-testable pure function.

### Flow Phase (91–94)

### Sprint 91 — Contribution API Endpoint Handler
- **Role:** Backend Engineer | **Layer:** State (2)
- Create `src/api/contributions.ts` — handler functions for `listContributions`, `getContribution`, `createContribution` using existing Supabase queries.
- **AC:** Three exported async functions with typed inputs/outputs matching API types from Sprint 87.

### Sprint 92 — Thread API Endpoint Handler
- **Role:** Backend Engineer | **Layer:** State (2)
- Create `src/api/threads.ts` — handler functions for `listThreads`, `getThread`, `createThread`, `resolveThread`.
- **AC:** Four exported async functions. `resolveThread` uses resolution metadata type from Sprint 73.

### Sprint 93 — Graph API Endpoint Handler
- **Role:** Integration Engineer | **Layer:** Relationship (3)
- Create `src/api/graph.ts` — `getGraph`, `getNode`, `getNeighbors` handlers. Returns nodes and edges in typed format.
- **AC:** Three exported functions returning graph data. `getNeighbors` accepts depth parameter.

### Sprint 94 — API Documentation Page
- **Role:** Product Engineer | **Layer:** View (7)
- Create `src/pages/ApiDocsPage.tsx` — rendered documentation of all API endpoints with request/response examples, inline from the type definitions.
- **AC:** Page lists all endpoints with method, path, parameters, and example JSON bodies.

---

## Cycle 4 — Programmatic Access & Webhooks (Sprints 95–102)

### Ebb Phase (95–98)

### Sprint 95 — Webhook Event Types
- **Role:** Schema Architect | **Layer:** Event (4)
- Create `src/types/webhooks.ts` — event type enum (`contribution.created`, `thread.resolved`, `message.sent`, etc.), webhook payload interfaces, delivery status type.
- **AC:** File exports at least 8 webhook event types with fully typed payload interfaces.

### Sprint 96 — Webhook Registry Store
- **Role:** Backend Engineer | **Layer:** State (2)
- Create `src/stores/webhook-store.ts` — local state store for registered webhooks (URL, events, secret, active flag). CRUD operations.
- **AC:** Store supports add, remove, update, list webhooks. Persists to localStorage.

### Sprint 97 — Webhook Payload Serializer
- **Role:** Integration Engineer | **Layer:** Relationship (3)
- Create `src/lib/webhook-serializer.ts` — functions to serialize app events into webhook payloads with HMAC signature generation (using Web Crypto API).
- **AC:** `serializeEvent` produces JSON payload. `signPayload` generates HMAC-SHA256 hex signature.

### Sprint 98 — Webhook Log Viewer Component
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/components/WebhookLogViewer.tsx` — table of webhook delivery attempts with status, timestamp, payload preview, retry button.
- **AC:** Component renders log entries with expandable payload JSON. Color-coded status (green=success, red=failed).

### Flow Phase (99–102)

### Sprint 99 — Webhook Management Page
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/pages/WebhooksPage.tsx` — list registered webhooks, add new webhook form, toggle active/inactive, delete. Uses webhook store.
- **AC:** Page renders webhook list, form creates new webhook, toggle switches active state.

### Sprint 100 — SDK TypeScript Package Scaffold
- **Role:** Product Engineer | **Layer:** Identity (1)
- Create `src/sdk/index.ts` — typed SDK class `CommonsClient` with methods mirroring all API handlers. Constructor takes `apiKey` and optional `baseUrl`.
- **AC:** SDK class exports all CRUD methods with proper TypeScript signatures. Methods call api-client internally.

### Sprint 101 — SDK Usage Examples Doc
- **Role:** Product Engineer | **Layer:** View (7)
- Create `docs/sdk-examples.md` — 10+ usage examples covering contributions, threads, graph queries, webhooks, search. Copy-pasteable code blocks.
- **AC:** Document contains runnable TypeScript examples for each SDK method.

### Sprint 102 — Batch Operations Utility
- **Role:** Workflow Engineer | **Layer:** Flow (5)
- Create `src/lib/batch.ts` — `batchProcess<T>` utility that processes arrays in chunks with concurrency limit, progress callback, and error collection.
- **AC:** Function processes items in configurable batch sizes. Returns `{ succeeded, failed, errors }`.

---

## Cycle 5 — Knowledge Graph Enrichment (Sprints 103–110)

### Ebb Phase (103–106)

### Sprint 103 — Graph Node Type Taxonomy
- **Role:** Schema Architect | **Layer:** Identity (1)
- Create `src/types/graph-taxonomy.ts` — comprehensive node type enum (Person, Concept, Tool, Method, Artifact, Event, Organization, Skill, Question, Insight) with color and icon mappings.
- **AC:** Enum exports 10+ node types. Each has associated color hex and icon name.

### Sprint 104 — Edge Relationship Types
- **Role:** Schema Architect | **Layer:** Relationship (3)
- Create `src/types/edge-types.ts` — edge type enum (`created`, `references`, `extends`, `contradicts`, `supports`, `requires`, `teaches`, `collaborates`) with directionality and weight defaults.
- **AC:** File exports edge types with `directed: boolean` and `defaultWeight: number` for each.

### Sprint 105 — Graph Statistics Calculator
- **Role:** Backend Engineer | **Layer:** State (2)
- Create `src/lib/graph-stats.ts` — functions: `nodeCount`, `edgeCount`, `density`, `avgDegree`, `connectedComponents`, `topNodes(byDegree)`.
- **AC:** All functions return correct values for sample graph data. Pure functions, no side effects.

### Sprint 106 — Graph Filter Panel Component
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/components/GraphFilterPanel.tsx` — sidebar with checkboxes for node types, edge types, dimension filter, min-degree slider.
- **AC:** Panel renders all filter controls. onChange emits filter configuration object.

### Flow Phase (107–110)

### Sprint 107 — Node Detail Sidebar
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/components/NodeDetailSidebar.tsx` — clicking a graph node opens sidebar showing: type, label, connections list, dimension tags, creation date, linked threads.
- **AC:** Sidebar opens on node click, displays all metadata, lists connected nodes as clickable links.

### Sprint 108 — Graph Legend Component
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/components/GraphLegend.tsx` — floating legend showing node type colors/icons and edge type line styles. Toggleable visibility.
- **AC:** Legend renders all node/edge types with visual representations. Toggle button shows/hides.

### Sprint 109 — Subgraph Extraction Utility
- **Role:** Integration Engineer | **Layer:** Relationship (3)
- Create `src/lib/subgraph.ts` — `extractSubgraph(nodeId, depth)` returns a subgraph of all nodes within N hops. `extractByDimension(dim)` filters by e/H-LAM/T dimension.
- **AC:** Both functions return valid subgraphs. Depth-bounded BFS produces correct hop counts.

### Sprint 110 — Graph Export to JSON/CSV
- **Role:** Workflow Engineer | **Layer:** Flow (5)
- Create `src/lib/graph-export.ts` — export graph data as JSON (nodes + edges), CSV (node list, edge list), and DOT format for Graphviz.
- **AC:** Three export functions produce valid formatted output. CSV has proper headers and quoting.

---

## Cycle 6 — Analytics & Metrics (Sprints 111–118)

### Ebb Phase (111–114)

### Sprint 111 — Analytics Event Types
- **Role:** Schema Architect | **Layer:** Event (4)
- Create `src/types/analytics.ts` — event types for tracking: page view, contribution submitted, thread created, thread resolved, graph interaction, search query, dimension explored.
- **AC:** File exports `AnalyticsEvent` discriminated union with typed payloads per event kind.

### Sprint 112 — Analytics Collector Hook
- **Role:** Event Systems Engineer | **Layer:** Event (4)
- Create `src/hooks/useAnalytics.ts` — hook that collects analytics events into local state store. `track(event)` method. Events stored in localStorage with timestamps.
- **AC:** Hook tracks events, persists to localStorage, retrieves history. No external service calls.

### Sprint 113 — Contribution Metrics Calculator
- **Role:** Backend Engineer | **Layer:** State (2)
- Create `src/lib/contribution-metrics.ts` — functions: `contributionsPerDay`, `contributionsByDimension`, `topContributors`, `averageArtifactsPerContribution`, `contributionVelocity`.
- **AC:** Each function takes contribution array, returns computed metric. Pure functions.

### Sprint 114 — Time Series Utility
- **Role:** Backend Engineer | **Layer:** State (2)
- Create `src/lib/time-series.ts` — bucket data by hour/day/week/month, fill gaps with zeros, compute moving average, detect trends (rising/falling/stable).
- **AC:** `bucketBy` groups data correctly. `movingAverage` smooths data. `detectTrend` returns direction.

### Flow Phase (115–118)

### Sprint 115 — Analytics Dashboard Page
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/pages/AnalyticsPage.tsx` — page with metric cards (total contributions, active threads, graph nodes, participants) and time-series chart area.
- **AC:** Page renders 4+ metric cards with current values. Chart area placeholder with axes.

### Sprint 116 — Sparkline Chart Component
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/components/charts/Sparkline.tsx` — inline SVG sparkline chart. Props: `data: number[]`, `color`, `width`, `height`. Shows trend line and optional area fill.
- **AC:** SVG renders correctly sized line chart. Area fill optional. Handles empty data.

### Sprint 117 — Dimension Radar Chart
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/components/charts/DimensionRadar.tsx` — SVG radar/spider chart showing distribution across 5 e/H-LAM/T dimensions.
- **AC:** Chart renders 5-axis radar with labeled axes (H, L, A, M, T). Filled polygon shows values.

### Sprint 118 — Participant Activity Heatmap
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/components/charts/ActivityHeatmap.tsx` — GitHub-style contribution heatmap. Shows activity by day over weeks. Color intensity by event count.
- **AC:** Heatmap renders 7-row grid (days) × N columns (weeks). Tooltip shows date and count on hover.

---

## Cycle 7 — Multi-Convergence (Sprints 119–126)

### Ebb Phase (119–122)

### Sprint 119 — Convergence Type Definition
- **Role:** Schema Architect | **Layer:** Identity (1)
- Create `src/types/convergence.ts` — `Convergence` interface: id, name, description, dates, location, dimensions focus, participant count, status (upcoming/active/completed).
- **AC:** Interface exported. Includes ETHBoulder as example constant conforming to type.

### Sprint 120 — Convergence Store
- **Role:** Backend Engineer | **Layer:** State (2)
- Create `src/stores/convergence-store.ts` — state management for multiple convergences. CRUD operations, active convergence selection, localStorage persistence.
- **AC:** Store supports create, read, update, delete convergences. `setActive(id)` switches context.

### Sprint 121 — Convergence Switcher Component
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/components/ConvergenceSwitcher.tsx` — dropdown in top nav showing current convergence name, list of all convergences, "New Convergence" option.
- **AC:** Dropdown shows all convergences. Selecting one calls setActive. Current convergence name displayed in nav.

### Sprint 122 — Cross-Convergence Link Type
- **Role:** Integration Engineer | **Layer:** Relationship (3)
- Create `src/types/cross-convergence.ts` — types for linking artifacts, threads, and participants across convergences. `CrossReference` interface with source/target convergence IDs.
- **AC:** Types support linking any entity between convergences with reference metadata.

### Flow Phase (123–126)

### Sprint 123 — Convergence Dashboard View
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/pages/ConvergenceDashboardPage.tsx` — overview of selected convergence: name, dates, participant count, contribution stats, dimension breakdown, recent threads.
- **AC:** Page shows convergence header, stats cards, recent activity list. Data scoped to active convergence.

### Sprint 124 — Convergence Comparison View
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/components/ConvergenceComparison.tsx` — side-by-side comparison of two convergences: metrics table, dimension radar overlay, participant overlap Venn diagram (simplified).
- **AC:** Component renders two-column comparison with matching metrics rows. Radar shows overlaid polygons.

### Sprint 125 — Convergence Data Isolation
- **Role:** Compliance & Security Engineer | **Layer:** Constraint (6)
- Create `src/lib/convergence-scope.ts` — utility functions to scope queries by convergence ID. `scopeQuery(convergenceId)` returns filter predicate. `mergeScopes` for cross-convergence views.
- **AC:** Scope functions correctly filter data arrays by convergence ID. Merge combines without duplicates.

### Sprint 126 — Convergence Archive & Export
- **Role:** Workflow Engineer | **Layer:** Flow (5)
- Create `src/lib/convergence-export.ts` — export entire convergence as JSON bundle (threads, contributions, graph, participants). Import function to restore.
- **AC:** Export produces valid JSON bundle. Import restores all data into stores. Round-trip preserves data.

---

## Cycle 8 — Federation Lite (Sprints 127–134)

### Ebb Phase (127–130)

### Sprint 127 — Federation Protocol Types
- **Role:** Schema Architect | **Layer:** Identity (1)
- Create `src/types/federation.ts` — types for peer nodes, federation messages (announce, sync-request, sync-response, share), content addressing (hash-based IDs).
- **AC:** Types define complete peer-to-peer message protocol. Content IDs use SHA-256 hash format.

### Sprint 128 — Content Addressable ID Generator
- **Role:** Backend Engineer | **Layer:** State (2)
- Create `src/lib/content-id.ts` — generate deterministic IDs from content using Web Crypto SHA-256. `contentId(data)` returns hex hash. `verifyId(data, id)` validates.
- **AC:** Same input always produces same ID. `verifyId` returns true for matching content.

### Sprint 129 — Peer Registry Component
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/components/PeerRegistry.tsx` — UI for managing known peer nodes: name, endpoint URL, status (online/offline/unknown), last sync time. Add/remove peers.
- **AC:** Component renders peer list with status indicators. Form adds new peer. Remove button with confirmation.

### Sprint 130 — Sync Diff Calculator
- **Role:** Integration Engineer | **Layer:** Relationship (3)
- Create `src/lib/sync-diff.ts` — compare two content ID sets, return `{ toSend: [], toReceive: [], shared: [] }`. Efficient set difference operations.
- **AC:** Diff correctly identifies items unique to each set and shared items. Handles empty sets.

### Flow Phase (131–134)

### Sprint 131 — Federation Settings Page
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/pages/FederationPage.tsx` — settings page with peer registry, sync status dashboard, content sharing preferences (what to share, what to accept).
- **AC:** Page renders peer list, sync status, sharing toggles per content type.

### Sprint 132 — Portable Contribution Format
- **Role:** Schema Architect | **Layer:** Identity (1)
- Create `src/lib/portable-format.ts` — serialize/deserialize contributions to a portable JSON-LD inspired format with `@context`, `@type`, content hash, provenance chain.
- **AC:** Serialize produces valid portable JSON. Deserialize reconstructs contribution object. Format includes provenance.

### Sprint 133 — Import from Portable Format
- **Role:** Workflow Engineer | **Layer:** Flow (5)
- Create `src/lib/import-portable.ts` — import contributions from portable format. Validate schema, check content hash, resolve conflicts (keep-both, prefer-local, prefer-remote).
- **AC:** Import validates format, rejects invalid hashes, applies conflict resolution strategy. Returns import report.

### Sprint 134 — Federation Activity Log
- **Role:** Event Systems Engineer | **Layer:** Event (4)
- Create `src/components/FederationActivityLog.tsx` — chronological log of federation events: sync started, items sent/received, conflicts resolved, errors.
- **AC:** Log renders timestamped entries with event type icons. Filterable by event type.

---

## Cycle 9 — Performance & Accessibility (Sprints 135–142)

### Ebb Phase (135–138)

### Sprint 135 — Performance Budget Config
- **Role:** Frontend & DevOps Engineer | **Layer:** Constraint (6)
- Create `src/lib/perf-budget.ts` — define performance budgets: max bundle size (200KB gzip), max component render time (16ms), max graph nodes before virtualization (500). Checker functions.
- **AC:** Budget constants exported. `checkBudget(metric, value)` returns pass/fail with budget details.

### Sprint 136 — Virtual List Component
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/components/ui/VirtualList.tsx` — virtualized scrolling list that only renders visible items. Props: `items`, `itemHeight`, `renderItem`, `overscan`.
- **AC:** List renders only visible items + overscan buffer. Scrolling reveals new items smoothly. Handles 10,000+ items.

### Sprint 137 — Debounce & Throttle Hooks
- **Role:** Frontend & DevOps Engineer | **Layer:** Flow (5)
- Create `src/hooks/useDebounce.ts` and `src/hooks/useThrottle.ts` — generic hooks with configurable delay. Properly clean up on unmount.
- **AC:** `useDebounce(value, 300)` delays updates. `useThrottle(fn, 100)` limits call frequency. Both cancel on unmount.

### Sprint 138 — Accessibility Audit Checklist
- **Role:** QA & Test Engineer | **Layer:** Constraint (6)
- Create `docs/a11y-checklist.md` — WCAG 2.1 AA checklist tailored to commons.id: color contrast ratios, keyboard navigation paths, ARIA labels needed, focus management, screen reader announcements.
- **AC:** Checklist covers all current pages/components with specific ARIA requirements and contrast ratios.

### Flow Phase (139–142)

### Sprint 139 — ARIA Labels for All Interactive Elements
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Audit and add `aria-label`, `aria-describedby`, `role` attributes to all buttons, inputs, modals, and navigation elements across the app.
- **AC:** Every interactive element has appropriate ARIA attributes. Buttons have labels, modals have role="dialog".

### Sprint 140 — Keyboard Navigation for Graph
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Add keyboard navigation to D3 graph: Tab cycles through nodes, Enter selects/opens detail, Arrow keys pan, +/- zoom, Escape deselects.
- **AC:** All listed keyboard shortcuts work. Focus ring visible on selected node. Tab order is logical.

### Sprint 141 — Skip Navigation & Focus Management
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Add skip-to-content link, manage focus on route changes (focus main heading), trap focus in modals, restore focus on modal close.
- **AC:** Skip link visible on Tab from page top. Route changes focus h1. Modal focus trapped and restored.

### Sprint 142 — Lazy Loading Route Splits
- **Role:** Frontend & DevOps Engineer | **Layer:** Flow (5)
- Wrap all page-level routes in `React.lazy()` with `Suspense` fallback. Create `src/components/ui/PageLoader.tsx` skeleton loading component.
- **AC:** Each page route is code-split. Loading skeleton shows during lazy load. Network tab confirms separate chunks.

---

## Cycle 10 — Mobile & Responsive (Sprints 143–150)

### Ebb Phase (143–146)

### Sprint 143 — Responsive Breakpoint System
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/hooks/useBreakpoint.ts` — hook returning current breakpoint (`mobile`, `tablet`, `desktop`, `wide`). Create `src/styles/breakpoints.ts` with Tailwind-aligned values.
- **AC:** Hook reactively returns current breakpoint on resize. Breakpoints: 640, 768, 1024, 1280.

### Sprint 144 — Mobile Navigation Drawer
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/components/MobileNav.tsx` — slide-out drawer for mobile navigation. Hamburger toggle, overlay backdrop, swipe-to-close gesture area.
- **AC:** Drawer opens from left on hamburger click. Backdrop overlay dims content. Close on backdrop click or swipe.

### Sprint 145 — Responsive Thread View
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Modify thread view for mobile: full-width message cards, collapsible thread sidebar, bottom-anchored reply composer, touch-friendly action buttons (min 44px tap targets).
- **AC:** Thread view usable on 375px width. All tap targets ≥44px. Reply composer at bottom.

### Sprint 146 — Responsive Dashboard Layout
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Modify dashboard to stack cards vertically on mobile, 2-column on tablet, current layout on desktop. Metric cards full-width on mobile.
- **AC:** Dashboard adapts to all 3 breakpoints. No horizontal scrolling at any width.

### Flow Phase (147–150)

### Sprint 147 — Touch Gesture Hooks
- **Role:** Frontend & DevOps Engineer | **Layer:** Event (4)
- Create `src/hooks/useSwipe.ts` and `src/hooks/useLongPress.ts` — detect swipe direction/distance and long press with configurable threshold.
- **AC:** `useSwipe` returns direction and distance. `useLongPress` fires callback after threshold. Both handle touch events.

### Sprint 148 — Mobile Graph View
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Adapt graph view for mobile: pinch-to-zoom, tap node to select, double-tap to focus, bottom sheet for node details instead of sidebar.
- **AC:** Graph responds to touch gestures. Node detail appears in bottom sheet (slides up from bottom).

### Sprint 149 — Pull-to-Refresh Component
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/components/ui/PullToRefresh.tsx` — wrapper component enabling pull-to-refresh on mobile. Shows spinner during refresh.
- **AC:** Pull down from top shows spinner and triggers onRefresh callback. Spring animation on release.

### Sprint 150 — Responsive Table Component
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/components/ui/ResponsiveTable.tsx` — table that converts to card layout on mobile. Priority columns configurable. Expandable rows for hidden columns.
- **AC:** Table renders normally on desktop. Cards on mobile show priority columns, expand button reveals rest.

---

## Cycle 11 — Content Curation & Moderation (Sprints 151–158)

### Ebb Phase (151–154)

### Sprint 151 — Content Quality Score Type
- **Role:** Schema Architect | **Layer:** Identity (1)
- Create `src/types/quality.ts` — quality score interface with dimensions: completeness, relevance, novelty, accuracy, actionability. Score 0-100 each. Composite score calculator.
- **AC:** Interface exported. `calculateComposite` weighted average function works. Default weights defined.

### Sprint 152 — Content Flagging System Types
- **Role:** Schema Architect | **Layer:** Event (4)
- Create `src/types/moderation.ts` — flag reasons enum (spam, duplicate, off-topic, low-quality, inappropriate), flag interface with reporter, reason, notes, status (pending/reviewed/dismissed).
- **AC:** Types cover full moderation lifecycle. Status transitions defined.

### Sprint 153 — Moderation Queue Store
- **Role:** Backend Engineer | **Layer:** State (2)
- Create `src/stores/moderation-store.ts` — store for flagged content queue. Add flag, review flag (approve/dismiss), bulk actions, filter by reason/status.
- **AC:** Store supports all CRUD operations. Bulk dismiss/approve works. Filters return correct subsets.

### Sprint 154 — Content Deduplication Utility
- **Role:** Backend Engineer | **Layer:** State (2)
- Create `src/lib/dedup.ts` — detect near-duplicate contributions using normalized text comparison, Jaccard similarity on word sets, configurable threshold.
- **AC:** `findDuplicates(contributions, threshold)` returns groups of similar items. Threshold 0.8 catches obvious dupes.

### Flow Phase (155–158)

### Sprint 155 — Moderation Queue Page
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/pages/ModerationPage.tsx` — list of flagged items with reason badges, reporter info, content preview. Approve/dismiss buttons. Bulk select.
- **AC:** Page renders queue sorted by newest first. Bulk actions work. Approved/dismissed items disappear.

### Sprint 156 — Content Flag Button & Dialog
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Add flag button (🚩) to contributions and messages. Opens dialog with reason selection, optional notes, submit. Integrates with moderation store.
- **AC:** Flag button visible on hover. Dialog submits flag to store. Flagged items show subtle indicator.

### Sprint 157 — Featured Content Curator
- **Role:** Product Engineer | **Layer:** Flow (5)
- Create `src/lib/featured.ts` — algorithm to surface featured content: high quality score, high engagement (reactions, replies), recency boost, dimension diversity bonus.
- **AC:** `getFeatured(contributions, limit)` returns ranked list. Scoring formula considers all 4 factors.

### Sprint 158 — Curated Collections Component
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/components/CuratedCollection.tsx` and `src/pages/CollectionsPage.tsx` — named collections of contributions. Create, add/remove items, reorder, describe.
- **AC:** Page lists collections. Each collection shows items in order. Create/edit collection form works.

---

## Cycle 12 — Export & Interoperability (Sprints 159–166)

### Ebb Phase (159–162)

### Sprint 159 — Export Format Registry
- **Role:** Schema Architect | **Layer:** Identity (1)
- Create `src/lib/export-formats.ts` — registry of export formats: JSON, CSV, Markdown, HTML, PDF-ready HTML. Each format has id, name, mimeType, extension, serializer function signature.
- **AC:** Registry lists 5 formats. Each has metadata and serializer type. `getFormat(id)` lookup works.

### Sprint 160 — Markdown Exporter
- **Role:** Workflow Engineer | **Layer:** Flow (5)
- Create `src/lib/exporters/markdown.ts` — export threads as Markdown documents, contributions as Markdown with YAML frontmatter, graph as Mermaid diagram syntax.
- **AC:** Thread export produces readable Markdown with quoted messages. Graph export produces valid Mermaid syntax.

### Sprint 161 — HTML Report Exporter
- **Role:** Workflow Engineer | **Layer:** Flow (5)
- Create `src/lib/exporters/html-report.ts` — generate self-contained HTML report with inline CSS. Sections: summary stats, top contributions, graph image placeholder, dimension breakdown.
- **AC:** Export produces valid HTML5 document. Renders correctly when opened in browser. No external dependencies.

### Sprint 162 — CSV Exporter
- **Role:** Workflow Engineer | **Layer:** Flow (5)
- Create `src/lib/exporters/csv.ts` — export contributions, participants, and threads as CSV. Proper escaping, UTF-8 BOM for Excel compatibility, configurable column selection.
- **AC:** CSV output opens correctly in spreadsheet apps. Special characters properly escaped. BOM present.

### Flow Phase (163–166)

### Sprint 163 — Export Wizard Page
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/pages/ExportPage.tsx` — multi-step wizard: select data scope (convergence, date range, dimensions) → select format → preview → download.
- **AC:** Wizard progresses through steps. Preview shows sample output. Download triggers file save dialog.

### Sprint 164 — Import Wizard Component
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/components/ImportWizard.tsx` — file upload, format auto-detection, preview parsed data, field mapping, conflict resolution options, import button.
- **AC:** File upload accepts JSON/CSV. Parser previews first 5 rows. Import adds data to stores.

### Sprint 165 — Shareable Link Generator
- **Role:** Product Engineer | **Layer:** Flow (5)
- Create `src/lib/shareable-links.ts` — encode view state (filters, selected node, search query, active convergence) into URL hash parameters. Decode on page load to restore view.
- **AC:** `encodeViewState` produces URL hash. `decodeViewState` restores all filters and selections. Bookmarkable.

### Sprint 166 — Print Stylesheet
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Create `src/styles/print.css` — print-optimized stylesheet: hide nav/sidebars, linearize layout, black-on-white, page breaks between sections, visible link URLs.
- **AC:** Print preview shows clean, readable layout. No navigation chrome. Links show URLs in parentheses.

---

## Cycle 12.5 — Final Polish & v1.0 (Sprints 167–170)

### Sprint 167 — Error Boundary & Fallbacks
- **Role:** Frontend & DevOps Engineer | **Layer:** Constraint (6)
- Create `src/components/ErrorBoundary.tsx` — React error boundary with friendly error message, error details toggle, "Try Again" button. Wrap all routes.
- **AC:** Component catches render errors, shows friendly UI, retry resets error state. Applied to all route components.

### Sprint 168 — Onboarding Tour Component
- **Role:** Product Engineer | **Layer:** View (7)
- Create `src/components/OnboardingTour.tsx` — step-by-step highlight tour for new users. Steps: dashboard → contribute → threads → graph → search. Persists completion to localStorage.
- **AC:** Tour highlights each area with tooltip. Next/Skip/Done buttons. Completed flag prevents re-showing.

### Sprint 169 — v1.0 README & Documentation
- **Role:** Technical Lead | **Layer:** All
- Update `README.md` — comprehensive project description, feature list, architecture overview (7-layer stack), setup instructions, screenshot placeholders, contribution guidelines, license.
- **AC:** README covers all features built across 100 sprints. Setup instructions verified. Architecture diagram in Mermaid.

### Sprint 170 — v1.0 Changelog & Release Notes
- **Role:** Technical Lead | **Layer:** All
- Create `CHANGELOG.md` — full changelog from Sprint 71-170 organized by cycle. Create `RELEASE_v1.md` — release notes highlighting key features, breaking changes, migration notes, acknowledgments.
- **AC:** Changelog lists every cycle's achievements. Release notes readable by end users. Version tagged as v1.0.0.

---

## Summary

| Cycle | Sprints | Theme | Key Deliverables |
|-------|---------|-------|------------------|
| 1 | 71–78 | Thread Workflow | Status machine, resolution flow, timeline |
| 2 | 79–86 | UI Polish | Design system, tokens, toast, keyboard shortcuts |
| 3 | 87–94 | Agent API | API types, client, handlers, docs |
| 4 | 95–102 | Programmatic Access | Webhooks, SDK, batch operations |
| 5 | 103–110 | Knowledge Graph | Taxonomy, filters, export, subgraph extraction |
| 6 | 111–118 | Analytics | Metrics, charts, sparklines, heatmap |
| 7 | 119–126 | Multi-Convergence | Convergence switcher, comparison, data isolation |
| 8 | 127–134 | Federation Lite | Content addressing, portable format, sync |
| 9 | 135–142 | Performance & A11y | Virtual list, ARIA, keyboard nav, lazy loading |
| 10 | 143–150 | Mobile & Responsive | Touch gestures, mobile nav, responsive layouts |
| 11 | 151–158 | Curation & Moderation | Quality scores, flagging, dedup, collections |
| 12 | 159–166 | Export & Interop | Markdown/HTML/CSV export, import, shareable links |
| 12.5 | 167–170 | v1.0 Polish | Error boundaries, onboarding, docs, release |

**100 sprints. 100 commits. Zero blockers. Ship it.** 🚀
