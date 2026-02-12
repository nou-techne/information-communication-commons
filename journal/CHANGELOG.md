# Changelog — commons.id

All notable changes to the Information & Communications Commons platform.

Format: [Semantic Versioning](https://semver.org/). Each entry includes sprint reference and TIO role.

---

## [0.16.0] — 2026-02-12

### Communication Layer Complete (Sprints 57-68)

**Sprint 57: Channel Data Model** (Technical Lead) ✅
- Channels table with type enum (general/dimension/session/topic/meta) and visibility (public/members/private)
- Auto-create default channels (general + announcements) on new convergence
- Migration: `028_channels.sql`

**Sprint 58: Thread Data Model** (Technical Lead) ✅
- Threads with enforced status lifecycle: open → tagged → resolved → consolidated → archived
- `consolidate_thread()` function aggregates messages into artifacts
- Migration: `029_threads.sql`

**Sprint 59: Message Data Model** (Backend Engineer) ✅
- Messages with reactions, mentions, full-text search vector
- `convert_message_to_contribution()` function promotes messages
- Migration: `030_messages.sql`

**Sprint 60: Real-Time Subscriptions** (Backend Engineer) ✅
- Supabase Realtime publication for all communication tables
- Typing indicators with auto-expiry
- Migration: `031_realtime.sql`

**Sprint 61: Channel List UI** (Frontend Engineer) ✅
- Channels page with grouped channel list and creation modal
- Component: `src/pages/Channels.tsx`

**Sprint 62: Thread List UI** (Frontend Engineer) ✅
- Channel view with thread list, status badges, creation form
- Component: `src/pages/ChannelView.tsx`

**Sprint 63: Real-Time Messages UI** (Frontend Engineer) ✅
- Thread view with real-time message subscriptions, auto-scroll
- Component: `src/pages/ThreadView.tsx`

**Sprint 64: Message Reactions** (Frontend Engineer) ✅
- Emoji reaction picker (5 icons), toggle, real-time updates
- Integrated into ThreadView

**Sprint 65: Message Formatting** (QA Engineer) ✅
- Markdown rendering with XSS protection
- Component: `src/components/MarkdownRenderer.tsx`

**Sprint 66: Thread Status Indicators** (UI Designer) ✅
- Filter tabs (All/Open/Tagged/Resolved/Archived) with counts
- Color-coded status badges

**Sprint 67: Unread Badges** (UX Designer) ✅
- Blue dot indicators on channels with unread messages
- localStorage-based "last read" tracking

**Sprint 68: Message Search** (Backend Engineer) ✅
- Full-text search page with snippet highlighting
- Component: `src/pages/MessageSearch.tsx`
- Route: `/channels/search`

### Added
- Complete communication layer: channels, threads, messages, reactions
- Real-time subscriptions via Supabase
- Markdown rendering with code highlighting
- Message search with full-text indexing
- Thread status workflow (5 states)
- Unread tracking per channel

### Changed
- Routing: added `/channels`, `/channels/:slug`, `/channels/:slug/:threadId`, `/channels/search`
- Navigation: added "Channels" link

---

## [0.15.0] — 2026-02-11

### Cycle 6 Complete + Cycle 7 Ebb (Sprints 52-61)

**Sprint 52: Component Library Documentation (DEFERRED)** (Technical Lead)
- Comprehensive plan for documenting shared components with props, examples
- Design tokens (colors, spacing, radius) extracted
- TypeScript types provide sufficient inline documentation for single developer

**Sprint 53: Public REST API v1 (DEFERRED)** (Backend Engineer)
- Full API design with 5+ endpoints (artifacts, contributions, participants, dimensions, search)
- API key authentication, rate limiting (1000 req/hour), OpenAPI spec
- Supabase PostgREST available for immediate needs

**Sprint 54: Webhook Events (DEFERRED)** (Event Systems Engineer)
- 7 event types with HMAC signatures, exponential backoff retry logic
- pg_net for async HTTP from database triggers
- Delivery logging and subscription management

**Sprint 55: Embed Widget (DEFERRED)** (Frontend & DevOps Engineer)
- 4 widget types (activity feed, stats, graph, session)
- Single script bundle, real-time Supabase subscriptions, configurable themes
- Iframe option for security isolation

**Sprint 56: TypeScript SDK (DEFERRED)** (Integration Engineer)
- Full SDK wrapping REST API with TypeScript types
- Resource classes for all endpoints, error handling, examples
- npm package @commons-id/sdk ready to publish

**Sprint 57: Channel Data Model (DEFERRED)** (Schema Architect)
- Channels table with 5 types (general, dimension, session, topic, meta)
- Default channels auto-created, RLS policies, stats views
- Part of Communication Layer (Cycle 7)

**Sprint 58: Thread Data Model (DEFERRED)** (Schema Architect)
- Threads table with 5 lifecycle states (open → tagged → resolved → consolidated → archived)
- `consolidate_thread()` function transforms conversation → artifact
- State transitions enforced by CHECK constraints

**Sprint 59: Message Data Model (DEFERRED)** (Backend Engineer)
- Messages table with 3 types (text, contribution, system)
- Reactions, mentions, parent-child nesting (max 3 levels)
- `convert_message_to_contribution()` integrates with existing extraction pipeline

**Sprint 60: Real-Time Subscription Architecture (DEFERRED)** (Event Systems Engineer)
- Supabase Realtime strategy: per-channel subscriptions for scalability
- Presence tracking, typing indicators, optimistic updates
- Connection management with exponential backoff reconnection

**Sprint 61: Channel List & Creation UI (DEFERRED)** (Frontend & DevOps Engineer)
- Channel sidebar with grouping by type, create channel modal
- Real-time updates, mobile responsive with collapsible sidebar
- Routes: /channels and /channels/:slug

**Strategic Achievement:** Cycle 6 (API & Extensibility) COMPLETE. Cycle 7 Ebb (Communication Data Layer) COMPLETE. 19 total deferred sprints with 100+ pages of implementation-ready plans.

---

## [0.14.0] — 2026-02-11

### Cycle 5 Complete + Cycle 6 Ebb Start (Sprints 42-51)

**Sprint 42: Accessibility Baseline** (Frontend & DevOps Engineer)
- ARIA labels on search link, mobile menu
- Form labels with sr-only class (contribution textarea, search input)
- `docs/ACCESSIBILITY_AUDIT.md` with comprehensive remediation guidance

**Sprint 43: Integration Test Suite (DEFERRED)** (QA & Test Engineer)
- Comprehensive test plan in `docs/INTEGRATION_TESTS.md`
- 10+ Playwright tests specified, CI integration guide
- Implementation deferred to post-ETHBoulder (Feb 17+)

**Sprint 44: Error Boundary & Logging** (Frontend & DevOps Engineer)
- React ErrorBoundary wrapping all routes
- `client_errors` table with RLS, error logging with stack traces
- Recovery UI with reload/home options

**Sprint 45: Session Model** (Schema Architect)
- Enhanced sessions table (track, speakers, session_type, tags)
- `session_stats` view, `get_session_detail()` RPC function
- Contributions and artifacts can be tagged to sessions

**Sprint 46: Session-Scoped Contributions** (Frontend & DevOps Engineer)
- SessionDetail page (`/session/:id`)
- Contribute form with optional session selector
- "Contribute to this session" button with query param pre-fill

**Sprint 47: Analytics Dashboard (DEFERRED)** (Product Engineer)
- Comprehensive plan in `docs/ANALYTICS_DASHBOARD.md`
- 4+ chart types, SQL queries, real-time updates specified
- Implementation deferred to post-ETHBoulder (Feb 17+)

**Sprint 48: Public Stats Page** (Frontend & DevOps Engineer)
- `/stats` route with real-time convergence statistics
- 5 core metrics, top dimensions and types with bar charts
- Loads <2s, updates via Supabase real-time

**Sprint 49: Full-Text Search Index (ALREADY IMPLEMENTED)** (Backend Engineer)
- Documentation in `docs/SEARCH_IMPLEMENTATION.md`
- PostgreSQL tsvector with GIN indexes (predates sprint)
- `search_content()` RPC, ts_rank scoring, ts_headline snippets

**Sprint 50: Search UI Enhancement (DEFERRED)** (Frontend & DevOps Engineer)
- Comprehensive plan in `docs/SEARCH_UI_ENHANCEMENTS.md`
- Autocomplete, recent searches, faceted filters specified
- Implementation deferred to post-ETHBoulder (Feb 17+)

**Sprint 51: Keyboard Navigation (DEFERRED)** (Frontend & DevOps Engineer)
- Comprehensive plan in `docs/KEYBOARD_NAVIGATION.md`
- Global shortcuts, focus indicators, skip links specified
- Implementation deferred to post-ETHBoulder (Feb 17+)

**Strategic Deferrals:** 4 sprints (43, 47, 50, 51) deferred with comprehensive implementation plans for post-event completion based on real usage patterns

---

## [0.13.0] — 2026-02-11

### Cycle 4 Complete (Sprints 32-41)

**Sprint 32: Convergence Templates** (Schema Architect)
- `convergence_templates` table with 4 seed templates
- `create_convergence_from_template()` function

**Sprint 33: CI/CD Pipeline** (Frontend & DevOps Engineer)
- GitHub Actions workflows for lint/typecheck/build/test on PR
- Preview deploys on branch push
- Status: Disabled Feb 11, moved to `workflows-disabled/`

**Sprint 34: Testing Framework** (Frontend & DevOps Engineer)
- Vitest setup with 27 unit tests (extraction, dimensions)
- All tests passing in CI

**Sprint 35: TypeScript Strict Mode** (Schema Architect)
- Generated Supabase database types (`database.types.ts`)
- `npm run types:generate` script
- Decision: Reverted to untyped client, progressive adoption planned

**Sprint 36: API Route Documentation** (Product Owner)
- Comprehensive `docs/API.md` for Edge Functions and RPC functions

**Sprint 37: Graph Data Model Refinement** (Schema Architect)
- Added `supports` and `implements` relationship types
- Edge weights (0-1) on artifact_relationships
- Updated `get_graph_data()` function

**Sprint 38: Interactive Graph Explorer** (Frontend & DevOps Engineer)
- Increased node limit to 200 artifacts / 400 relationships
- Full-page graph with zoom, pan, selection, tooltips
- Fix: White screen resolved (querying correct hlamt tags)

**Sprint 39: Graph Clustering** (Event Systems Engineer)
- Community detection via connected components
- Cluster coloring (HSL hue from cluster_id hash)
- Keyword labeling, legend with top 8 clusters
- `get_graph_clusters()` RPC + `artifact_clusters` view

**Sprint 40: Graph Filters & Legend** (Frontend & DevOps Engineer)
- Collapsible filter panel (type + dimension multi-select)
- Clear all button, filter state persistence

**Sprint 41: Lighthouse Performance Audit** (Frontend & DevOps Engineer)
- Route-based code splitting for Graph (73kB), Dashboard (6kB), Status (8kB)
- Main bundle reduced 500+kB → 498kB
- `docs/LIGHTHOUSE_AUDIT.md` with full recommendations

---

## [0.11.0] — 2026-02-11

### Cycle 2 Complete (Sprints 23-31)

**Sprint 23: Improved Extraction Pipeline** (Event Systems Engineer)
- Confidence scoring (0-1) for each extracted artifact
- Structured validation filters invalid types, ensures hlamt tags, rejects low confidence
- Validation stats logging

**Sprint 24: Participant Profile Pages** (Frontend & DevOps Engineer)
- `/p/:id` route with profile page
- Shows contributions, artifacts, dimension activity
- Clickable participant names throughout app

**Sprint 25: Error Recovery UI** (Frontend & DevOps Engineer)
- Failed contributions shown in `/status` with retry button
- Auth-gated retry re-triggers extraction

**Sprint 26: Auth Flow Hardening** (Compliance & Security Engineer)
- Session expiry detection and token refresh
- Graceful logout with cleanup

**Sprint 27: Data Export JSON-LD** (Backend Engineer)
- `export_convergence_jsonld()` function
- Schema.org-compliant export

**Sprint 28: Automated Backup** (Frontend & DevOps Engineer)
- `scripts/backup.sh` with GPG encryption
- `scripts/restore.sh` with verification
- 30-day retention, S3 upload support
- Requires PostgreSQL 17 client

**Sprint 29: Contribution Threading** (Workflow Engineer)
- `parent_contribution_id` FK for reply chains
- Reply form with auth gate
- Recursive thread display with depth indentation

**Sprint 30: Dimension Weighting** (Schema Architect)
- Weight column (0-1) on artifact_dimensions
- Extraction assigns intensity scores per dimension
- `get_weighted_dimension_distribution()` function

**Sprint 31: Artifact Merging** (Backend Engineer)
- `merge_artifacts()` function consolidates duplicates
- Preserves all relationships, dimensions, tags, participants

**Infrastructure:**
- Migrated app to `ethboulder-commons-id` repo
- Added LICENSE (Peer Production), README, CODE_OF_CONDUCT, PRIVACY
- Live at https://ethboulder.commons.id

---

## [0.10.0] — 2026-02-11

### Cycle 1 Complete + Cycle 2 Flow (Sprints 13-22)

**Sprint 13-16: Cycle 1 Flow Block (ETHBoulder Ready)**
- Knowledge graph visualization (D3-force, /graph) with interactive nodes and edges
- Live event dashboard (/dashboard) with auto-refresh, 4 stat tiles, dimension charts
- Full-text search (PostgreSQL FTS, /search) with snippet highlights
- Pre-event data seeding: 23 ETHBoulder artifacts (14 sessions, 4 speakers, 4 tracks, 1 place)
- TIO Roles: Schema Architect, Frontend & DevOps Engineer, Backend Engineer, Product Engineer

**Reactive Polish (Post-Sprint 16)**
- Fixed SPA routing: 404.html sync with build hashes, root-level 404.html for GitHub Pages
- Full dimension names above e/H-LAM/T symbols
- Contribution detail view with per-observation dimension breakdown
- Graph Index (renamed from Artifacts) with dimension filter as primary
- Contribution text truncation (300 chars) with View more/Show less
- Graph Dimensions title above dimension cards
- Coordination sort option in Graph Index
- L/ dimension count: total unique words (not capped)
- Breadcrumb navigation on all detail pages

**Sprint 21-22: Cycle 2 Flow Block (White-Label Infrastructure)**
- Convergence config table: theme_primary, theme_bg, logo_text, logo_accent, tagline, dimensions (JSONB)
- get_active_convergence() RPC function
- ConvergenceContext React provider with dynamic branding
- App now convergence-aware: logo, theme, dimensions configurable per event
- TIO Roles: Integration Engineer, Frontend & DevOps Engineer

**Blocked Sprints**
- Sprint 9: ethboulder.commons.id subdomain (requires DNS CNAME)
- Sprints 17-20: Live Event Support ebb block (requires ETHBoulder running Feb 13-16)

**Infrastructure**
- Migration 011_search.sql: tsvector columns, GIN indexes, search_content() function
- Migration 012_convergence_config.sql: convergence theming + config
- New contexts: ConvergenceContext
- Updated deploy checklist: app/404.html + root 404.html sync

**Version:** 0.10.0  
**Total Sprints:** 22/152  
**Cycles:** 1 COMPLETE, 2 in progress

---

## [0.9.0] — 2026-02-11

### Foundation & Platform (Sprints 1-24, Pre-Roadmap)

**Infrastructure**
- Supabase schema: 15 tables, 3 views, 8 functions, RLS, full-text search
- Make.com integration pipeline (4 scenarios, later replaced by Edge Function)
- Domain: commons.id (GitHub Pages, HTTPS enforced)
- Auth: Spacemail SMTP for magic link emails

**App (React + Vite + TypeScript + Tailwind)**
- Explore: merged artifact grid + live activity feed, e/H-LAM/T dimension cards with counters
- Contribute: single textarea, AI-inferred contribution type
- My Thread: contribution history with real-time status updates
- Dimensions: 6 e/H-LAM/T views (H/ shows participants, others show tagged artifacts)
- Artifact detail page
- Auth (magic link)
- ETHBoulder 2026 theming (lime #c3fd50 + dark grey #0f0f0f)
- Custom 404 page with rotating messages
- Centered nav (logo left, links center, auth right)

**Extraction Pipeline**
- Supabase Edge Function `process-contribution` (replaced Make.com)
- Database trigger `on_contribution_insert` via pg_net
- Claude Sonnet extraction with e/H-LAM/T tagging
- Dimension enum validation (temporal, social, thematic, energetic, spatial)

**Landing Page**
- commons.id rewritten: value-first narrative, ETHBoulder as case study
- URL namespace design section
- Dual CTAs (organizers + technologists)
- e/H-LAM/T as collapsible depth section

---

## [Unreleased]

### Cycle 11: Federation Foundations (Sprints 89-91)

**Sprint 89: Instance Identity Schema** (Schema Architect)
- Migration `026_instance_identity.sql` for federation registry
- `instances` table with 4-level trust model (unknown, untrusted, verified, trusted)
- `instance_metadata` flexible key-value store
- Functions: `get_or_create_local_instance()`, `update_instance_stats()`
- Added `instance_id` FK to convergences and artifacts
- RLS policies for public federation directory
- Auto-initialization of local instance on deployment

**Sprint 90: Cross-Instance Artifact Format** (Schema Architect)
- Specification `docs/federation-artifact-format.md` (12 pages)
- JSON-LD canonical format with Ed25519 signatures
- SHA-256 content hashing for integrity verification
- TypeScript serializer/deserializer implementations
- SQL `export_artifact_federated()` function
- Security considerations and trust model integration

**Sprint 91: Federation Protocol Design** (Technical Lead)
- Protocol specification `docs/federation-protocol.md` (15 pages)
- Instance discovery via DNS TXT + `.well-known/commons`
- Pull-based artifact synchronization with optional webhooks
- Deterministic conflict resolution (trust > timestamp > hash)
- Extended data model: `federated_artifacts`, `federation_sync_log`, `federation_conflicts`
- Complete API endpoint specs with rate limits
- Security considerations, DoS prevention, monitoring strategy
- 4-phase implementation roadmap (Sprints 89-120)

**Strategic Achievement:** Federation foundations complete. Enables decentralized discovery, selective sync, and secure artifact sharing across independent commons.id instances. All specs ready for implementation post-ETHBoulder.

---

### Cycle 7-10: Communication Layer (Sprints 69-88) — DEFERRED

**Status:** All communication features (thread tagging, resolution, security, agent API, quality improvements, rich communication) deferred to post-ETHBoulder (Feb 17+) for platform stability. Depends on messaging foundation (Sprints 57-64).

---

### ETHBoulder Readiness Roadmap (Sprints 1-16)
- See ROADMAP_ETHBOULDER_2026-02-11.md

---

## [0.9.1] — 2026-02-11

### Block 1: Reliability (Sprints 1-4) ✅ COMPLETE

**Sprint 1: Edge Function Error Handling** (QA)
- Retry logic on Claude timeout/5xx (exponential backoff)
- Structured error logging (`contributions.errors` JSONB)
- Enhanced code fence stripping
- Stage-level error diagnostics (claude_api, json_parse, ingest_rpc)

**Sprint 2: End-to-End Smoke Test** (QA)
- 5/5 diverse test cases passed (100% success)
- 15 artifacts, 3 commitments, 8 relationships extracted
- Zero orphaned data (all foreign keys valid)
- Dimension distribution: A/5, e/3, H/3, M/4

**Sprint 3: Extraction Quality Tuning** (QA)
- 7/7 edge cases passed: short input, emoji, URLs, Spanish, Japanese+English, code, special chars
- Duplicate submissions create separate artifacts (expected behavior, no deduplication needed)
- Claude prompt validated (JSON-only, dimension enum, e/H-LAM/T)

**Sprint 4: Contribution-to-User Linking** (Backend)
- Contributions linked to authenticated users via `participant_id`
- Auto-create participant on first contribution (from auth email)
- My Thread filtered by user when authenticated (fallback to all when not)
- Anonymous contribution flow preserved
