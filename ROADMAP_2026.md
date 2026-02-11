# commons.id — 2026 Roadmap

*Ebb-flow cycles from day one. 160 sprints. Sprint 9 onward.*

**Method:** TIO-integrated ebb-flow cycles. Each cycle = 8 sprints (4 ebb + 4 flow).
**Ebb:** Optimize, test, harden, analyze what exists.
**Flow:** Build new capabilities, expand surface area.
**Sprint size:** 30 min – 2 hours of focused work.

**TIO Roles:**
- Schema Architect (Layer 1: Identity)
- Backend Engineer (Layer 2: State)
- Integration Engineer (Layer 3: Relationship)
- Event Systems Engineer (Layer 4: Event)
- Workflow Engineer (Layer 5: Flow)
- Compliance & Security Engineer (Layer 6: Constraint)
- Frontend & DevOps Engineer (Layer 7: View)
- Product Engineer (cross-cutting)
- Technical Lead (cross-cutting)
- QA & Test Engineer (cross-cutting)

---

# Prior Art: Platform Foundation (Sprints 1-8) ✅ COMPLETE

*24 platform sprints + 8 ETHBoulder readiness sprints. Completed Feb 10-11, 2026.*

**What shipped:**
- App live at commons.id/app/ (React + Vite + TypeScript + Tailwind + Supabase)
- Contribution → Supabase → Edge Function → Claude extraction → artifacts in Explore
- Real-time subscriptions, e/H-LAM/T dimension cards with counters
- Dimension detail views, My Thread with live status
- ETHBoulder theming (lime #c3fd50 + dark grey #0f0f0f)
- Auth via magic link (Spacemail SMTP), custom 404
- Edge Function error handling with retry and diagnostics (Sprint 1)
- E2E smoke test passing 5/5 diverse contributions (Sprint 2)
- Extraction quality tuning for edge cases (Sprint 3)
- Contribution-to-user linking with scoped My Thread (Sprint 4)
- Post-submission progress indicator with artifact links (Sprint 5)
- Mobile responsiveness at 375px/390px (Sprint 6)
- Artifact detail with relationships, tags, source contribution (Sprint 7)
- Empty states and onboarding for first-time visitors (Sprint 8)

---

# Cycle 1: ETHBoulder Ready (Sprints 9-16)

*Ebb: Harden infrastructure for multi-user event. Flow: Add depth features for live event.*

## Ebb: Infrastructure Hardening (Sprints 9-12)

### Sprint 9 — ethboulder.commons.id Subdomain
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Configure DNS CNAME, serve app at ethboulder.commons.id with HTTPS.
- **AC:** ethboulder.commons.id loads the app with HTTPS.

### Sprint 10 — Rate Limiting & Abuse Prevention
- **Role:** Compliance & Security Engineer | **Layer:** Constraint (6)
- Max 10 contributions per IP per hour. Content length 20-10,000 chars.
- **AC:** Spam blocked; legitimate use unaffected.

### Sprint 11 — Participant Self-Registration
- **Role:** Backend Engineer | **Layer:** State (2), Relationship (3)
- Authenticated users create/update participant profile (name, affiliation, bio, interests).
- **AC:** New user can sign in, create profile, see linked contributions.

### Sprint 12 — Monitoring & Observability
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Edge Function metrics (success rate, latency, errors). Alert on >20% failure rate.
- **AC:** Operator can monitor extraction health in real-time during ETHBoulder.

## Flow: Event Depth (Sprints 13-16)

### Sprint 13 — Knowledge Graph Visualization
- **Role:** Schema Architect | **Layer:** Relationship (3), View (7)
- D3-force graph: artifacts as nodes, relationships as edges. Color by type, filter by dimension.
- **AC:** Graph renders with real data, interactive, performs with 50+ nodes.

### Sprint 14 — Live Event Dashboard
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Large-screen projection view. Auto-refreshing artifacts, graph, counters. Minimal chrome.
- **AC:** Looks impressive on 1080p projector, updates without interaction.

### Sprint 15 — Search Enhancement
- **Role:** Backend Engineer | **Layer:** State (2), View (7)
- Full-text search across artifacts and contributions with snippet highlights.
- **AC:** Search finds relevant results across all content.

### Sprint 16 — Pre-Event Data Seeding
- **Role:** Product Engineer | **Layer:** Identity (1), State (2)
- Seed ETHBoulder schedule (sessions, speakers, topics). Tag by tent and dimension.
- **AC:** App has useful content before the first contribution is submitted.

---

# Cycle 2: Live Event & First Retro (Sprints 17-24)

*Ebb: Support live event, fix what breaks. Flow: First post-event expansion.*

## Ebb: Live Event Support (Sprints 17-20)

### Sprint 17 — Live Bug Triage & Hotfix
- **Role:** QA & Test Engineer | **Layer:** All
- Monitor during ETHBoulder. Catalog and fix critical bugs (data loss, auth failures, extraction errors).
- **AC:** Zero critical bugs remaining; all issues documented.

### Sprint 18 — Usage Analytics Report
- **Role:** Product Engineer | **Layer:** Event (4)
- Query contribution counts, peak times, error rates, user engagement, dimension distribution.
- **AC:** Written analytics report with key metrics saved to journal.

### Sprint 19 — Extraction Accuracy Audit
- **Role:** Schema Architect | **Layer:** Identity (1), Event (4)
- Review 20 random extractions for dimension tagging accuracy, type correctness, relationship quality.
- **AC:** Accuracy report with specific prompt improvements documented.

### Sprint 20 — Database Performance Review
- **Role:** Backend Engineer | **Layer:** State (2)
- Analyze slow queries, add missing indexes, review RLS policy performance under real data volume.
- **AC:** P95 query latency under 200ms for all primary views.

## Flow: First Expansion (Sprints 21-24)

### Sprint 21 — White-Label Convergence Config
- **Role:** Integration Engineer | **Layer:** Relationship (3)
- Extract ETHBoulder-specific config (name, theme, dates, dimensions) into a convergence config table.
- **AC:** App reads convergence context from DB, not hardcoded.

### Sprint 22 — Convergence Switcher UI
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Add convergence selector. Each convergence has its own artifact namespace.
- **AC:** User can switch between convergences; data is scoped correctly.

### Sprint 23 — Improved Extraction Pipeline
- **Role:** Event Systems Engineer | **Layer:** Event (4)
- Apply prompt improvements from Sprint 19. Add structured output validation. Log confidence scores.
- **AC:** Extraction accuracy improves by measurable margin on test corpus.

### Sprint 24 — Participant Profile Pages
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Public profile page showing participant's contributions, artifacts, and dimension activity.
- **AC:** Clicking a participant name anywhere navigates to their profile.

---

# Cycle 3: Stability & Enrichment (Sprints 25-32)

*Ebb: Harden auth, errors, backups. Flow: Threading, weighting, merging, templates.*

## Ebb: Stability (Sprints 25-28)

### Sprint 25 — Error Recovery UI
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Show failed contributions with retry button. Admin can re-trigger extraction.
- **AC:** Users can recover from extraction failures without operator intervention.

### Sprint 26 — Auth Flow Hardening
- **Role:** Compliance & Security Engineer | **Layer:** Constraint (6)
- Audit magic link flow. Add session expiry handling, token refresh, graceful logout.
- **AC:** No auth-related errors during 24-hour soak test.

### Sprint 27 — Data Export (JSON-LD)
- **Role:** Backend Engineer | **Layer:** State (2)
- Export convergence data as JSON-LD. Include artifacts, relationships, contributions, participants.
- **AC:** Exported JSON-LD validates against schema.org and can be re-imported.

### Sprint 28 — Automated Backup
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7), Constraint (6)
- Nightly Supabase pg_dump to encrypted S3 bucket. Verify restore process.
- **AC:** Backup runs nightly; restore tested and documented.

## Flow: Enrichment (Sprints 29-32)

### Sprint 29 — Contribution Threading
- **Role:** Workflow Engineer | **Layer:** Flow (5)
- Allow contributions to reference previous contributions. Build reply chains.
- **AC:** User can reply to a contribution; thread renders chronologically.

### Sprint 30 — Dimension Weighting
- **Role:** Schema Architect | **Layer:** Identity (1)
- Extraction assigns weight (0-1) per dimension tag instead of binary. UI shows intensity.
- **AC:** Dimension cards show weighted relevance; sorting by weight works.

### Sprint 31 — Artifact Merging
- **Role:** Backend Engineer | **Layer:** State (2), Relationship (3)
- Admin tool to merge duplicate artifacts. Relationships and tags consolidate.
- **AC:** Merging two artifacts preserves all relationships and attribution.

### Sprint 32 — Convergence Templates
- **Role:** Product Engineer | **Layer:** Identity (1)
- Create templates for common convergence types (hackathon, conference, workshop).
- **AC:** New convergence can be created from template in under 2 minutes.

---

# Cycle 4: Developer Infrastructure (Sprints 33-40)

*Ebb: CI/CD, testing, type safety, API docs. Flow: Graph model, explorer, clustering, filters.*

## Ebb: Developer Infrastructure (Sprints 33-36)

### Sprint 33 — CI/CD Pipeline Setup
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- GitHub Actions: lint, typecheck, build on PR. Deploy preview on push to branch.
- **AC:** PRs get automated checks; preview deploys work.

### Sprint 34 — Testing Framework
- **Role:** QA & Test Engineer | **Layer:** All
- Set up Vitest for unit tests. Write tests for extraction parsing, dimension mapping, RLS policies.
- **AC:** 20+ unit tests passing in CI.

### Sprint 35 — TypeScript Strict Mode
- **Role:** Technical Lead | **Layer:** All
- Enable strict mode. Fix all type errors. Add types for Supabase generated schema.
- **AC:** `tsc --strict` passes with zero errors.

### Sprint 36 — API Route Documentation
- **Role:** Backend Engineer | **Layer:** State (2)
- Document all Edge Functions and Supabase RPC calls. OpenAPI spec for custom endpoints.
- **AC:** Every API endpoint documented with request/response examples.

## Flow: Graph & Visualization (Sprints 37-40)

### Sprint 37 — Graph Data Model Refinement
- **Role:** Schema Architect | **Layer:** Identity (1), Relationship (3)
- Add relationship types (supports, contradicts, extends, implements). Add edge weights.
- **AC:** Relationship types enforced by DB constraint; migration applied.

### Sprint 38 — Interactive Graph Explorer
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Full-page graph view with zoom, pan, node selection, tooltip previews, click-to-detail.
- **AC:** Graph handles 200+ nodes at 30fps; node click opens detail panel.

### Sprint 39 — Graph Clustering
- **Role:** Event Systems Engineer | **Layer:** Event (4)
- Auto-detect clusters using community detection. Color-code clusters. Label with top keywords.
- **AC:** Clusters visually distinct; labels meaningful for 3+ clusters.

### Sprint 40 — Graph Filters & Legend
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Filter by artifact type, dimension, date range, participant. Persistent legend.
- **AC:** All filters work independently and in combination.

---

# Cycle 5: Performance & Quality (Sprints 41-48)

*Ebb: Lighthouse, accessibility, integration tests, error boundaries. Flow: Sessions, dashboards, analytics, public stats.*

## Ebb: Quality & Performance (Sprints 41-44)

### Sprint 41 — Lighthouse Performance Audit
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Run Lighthouse. Fix performance issues: code splitting, lazy loading, image optimization.
- **AC:** Lighthouse performance score ≥ 85 on mobile.

### Sprint 42 — Accessibility Baseline
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Run axe-core. Fix critical issues: focus management, ARIA labels, color contrast.
- **AC:** Zero critical accessibility violations.

### Sprint 43 — Integration Test Suite
- **Role:** QA & Test Engineer | **Layer:** All
- Playwright tests for core flows: contribute, explore, search, graph, profile.
- **AC:** 10+ integration tests passing in CI.

### Sprint 44 — Error Boundary & Logging
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Add React error boundaries to all routes. Client-side error logging to Supabase.
- **AC:** Unhandled errors show recovery UI; errors logged with stack traces.

## Flow: Sessions & Dashboards (Sprints 45-48)

### Sprint 45 — Session Model
- **Role:** Schema Architect | **Layer:** Identity (1), Event (4)
- Add sessions table (title, start/end, track, speakers). Link contributions to sessions.
- **AC:** Contributions can be tagged to a specific session; session page shows all related artifacts.

### Sprint 46 — Session-Scoped Contributions
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Contribute form has optional session selector. Session page has "contribute to this session" button.
- **AC:** Session detail page shows only session-scoped artifacts.

### Sprint 47 — Analytics Dashboard
- **Role:** Product Engineer | **Layer:** View (7)
- Admin dashboard: contributions over time, active users, top dimensions, extraction health.
- **AC:** Dashboard renders real-time data with 4+ chart types.

### Sprint 48 — Public Stats Page
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Public-facing convergence stats: total contributions, artifacts, participants, top topics.
- **AC:** Stats page loads in <2s and updates in real-time.

---

# Cycle 6: Search & API (Sprints 49-56)

*Ebb: Search index, search UI, keyboard nav, component docs. Flow: Public API, webhooks, embed widget, TypeScript SDK.*

## Ebb: Search & Polish (Sprints 49-52)

### Sprint 49 — Full-Text Search Index
- **Role:** Backend Engineer | **Layer:** State (2)
- PostgreSQL tsvector index on artifacts and contributions. Ranked results.
- **AC:** Search returns ranked results in <100ms for 1000+ records.

### Sprint 50 — Search UI Enhancement
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Autocomplete, recent searches, filters (type, dimension, date), result highlighting.
- **AC:** Search feels instant with useful suggestions.

### Sprint 51 — Keyboard Navigation
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Full keyboard nav: /, arrow keys, Enter to select, Esc to close. Focus indicators.
- **AC:** Power user can navigate entire app without mouse.

### Sprint 52 — Component Library Documentation
- **Role:** Technical Lead | **Layer:** View (7)
- Document shared components with props, examples, usage guidelines.
- **AC:** Every shared component has documented props and at least one usage example.

## Flow: API & Extensibility (Sprints 53-56)

### Sprint 53 — Public REST API v1
- **Role:** Backend Engineer | **Layer:** State (2)
- Read-only API: GET artifacts, contributions, participants, dimensions. API key auth.
- **AC:** API returns JSON; rate limited; documented with examples.

### Sprint 54 — Webhook Events
- **Role:** Event Systems Engineer | **Layer:** Event (4)
- Fire webhooks on: new contribution, new artifact, extraction complete. Configurable per convergence.
- **AC:** Webhook fires within 5s of event; retry on failure.

### Sprint 55 — Embed Widget
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Embeddable widget showing live convergence activity. Configurable size and theme.
- **AC:** Widget loads via script tag on external site; shows real-time updates.

### Sprint 56 — TypeScript SDK
- **Role:** Integration Engineer | **Layer:** Relationship (3)
- TypeScript SDK wrapping the REST API. Published to npm.
- **AC:** SDK covers all API endpoints; includes TypeScript types; README with examples.

---

# Cycle 7: Communication Foundation (Sprints 57-64)

*Ebb: Data models for channels, threads, messages, real-time architecture. Flow: Channel list, thread creation, live messages, reactions.*

## Ebb: Communication Data Layer (Sprints 57-60)

### Sprint 57 — Channel Data Model
- **Role:** Schema Architect | **Layer:** Identity (1)
- Channels table: id, convergence_id, name, slug, description, type (general/dimension/session), visibility, created_by.
- **AC:** Migration applied; RLS policies enforce visibility rules.

### Sprint 58 — Thread Data Model
- **Role:** Schema Architect | **Layer:** Identity (1), Relationship (3)
- Threads table: id, channel_id, title, status (open/tagged/resolved/consolidated/archived), created_by, resolved_at.
- **AC:** Thread lifecycle states enforced by DB constraint.

### Sprint 59 — Message Data Model
- **Role:** Backend Engineer | **Layer:** State (2)
- Messages table: id, thread_id, author_id, content, type (text/contribution/system), parent_message_id, created_at.
- **AC:** Messages support nesting; foreign keys enforce referential integrity.

### Sprint 60 — Real-Time Subscription Architecture
- **Role:** Event Systems Engineer | **Layer:** Event (4)
- Supabase Realtime channel strategy: per-channel subscriptions, presence tracking, typing indicators.
- **AC:** Architecture document with subscription topology; prototype subscription works.

## Flow: Basic Messaging (Sprints 61-64)

### Sprint 61 — Channel List & Creation
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Sidebar showing channels grouped by type. Create channel form (name, description, type).
- **AC:** User can create a channel and see it in the sidebar.

### Sprint 62 — Thread List & Creation
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Channel view shows threads sorted by activity. Create thread with title and initial message.
- **AC:** User can create a thread in a channel; thread appears in list.

### Sprint 63 — Real-Time Messages
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Thread view with message input. Messages appear in real-time via Supabase subscriptions.
- **AC:** Two users in same thread see each other's messages within 1 second.

### Sprint 64 — Message Reactions
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Emoji reactions on messages. Reaction counts. Toggle own reaction.
- **AC:** User can react to any message; reaction count updates in real-time.

---

# Cycle 8: Communication Quality (Sprints 65-72)

*Ebb: Formatting, status indicators, notifications, message search. Flow: Tagging, resolution, consolidation, archival.*

## Ebb: Communication Polish (Sprints 65-68)

### Sprint 65 — Message Formatting
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Markdown rendering in messages. Code blocks, links, bold, italic, lists.
- **AC:** All standard markdown renders correctly in thread view.

### Sprint 66 — Thread Status Indicators
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Visual indicators for thread status (open/tagged/resolved/consolidated/archived). Filter by status.
- **AC:** Thread list shows color-coded status; filter works.

### Sprint 67 — Notification Preferences
- **Role:** Backend Engineer | **Layer:** State (2), Constraint (6)
- Per-channel notification settings: all, mentions, none. Unread count badges.
- **AC:** User sees unread counts; notification setting persists.

### Sprint 68 — Message Search
- **Role:** Backend Engineer | **Layer:** State (2)
- Full-text search across messages within a channel or globally. Results link to message in thread.
- **AC:** Search finds messages with snippet preview and direct link.

## Flow: Resolution Workflows (Sprints 69-72)

### Sprint 69 — Thread Tagging System
- **Role:** Workflow Engineer | **Layer:** Flow (5)
- Tag threads with dimensions, topics, artifact types. Auto-suggest tags from content.
- **AC:** Thread can be tagged; tags visible in list; auto-suggest works.

### Sprint 70 — Thread Resolution Flow
- **Role:** Workflow Engineer | **Layer:** Flow (5)
- Resolve thread with summary. Resolution creates a new artifact in the knowledge graph.
- **AC:** Resolving a thread creates an artifact with source thread linked.

### Sprint 71 — Thread Consolidation
- **Role:** Workflow Engineer | **Layer:** Flow (5)
- Merge related resolved threads into consolidated summary. Link all source threads.
- **AC:** Consolidated thread references all source threads; artifacts merge cleanly.

### Sprint 72 — Thread Archival
- **Role:** Workflow Engineer | **Layer:** Flow (5)
- Auto-archive resolved threads after configurable period. Archive view accessible but not cluttering.
- **AC:** Archived threads hidden from default view; accessible via archive toggle.

---

# Cycle 9: Communication Security & Agent API (Sprints 73-80)

*Ebb: Moderation, permissions, performance, test suite. Flow: Agent auth, contribute/message, channels/threads, react/resolve.*

## Ebb: Communication Hardening (Sprints 73-76)

### Sprint 73 — Message Moderation
- **Role:** Compliance & Security Engineer | **Layer:** Constraint (6)
- Report message, hide message, ban user from channel. Moderation log.
- **AC:** Reported message hidden within one mod action; log records all actions.

### Sprint 74 — Channel Permissions
- **Role:** Compliance & Security Engineer | **Layer:** Constraint (6)
- Role-based channel access: public, members-only, admin-only. Invite flow for private channels.
- **AC:** Private channel invisible to non-members; invite grants access.

### Sprint 75 — Communication Performance
- **Role:** Backend Engineer | **Layer:** State (2)
- Optimize message loading: pagination, virtual scrolling, subscription cleanup.
- **AC:** Thread with 500+ messages loads in <2s; no memory leaks after 30 minutes.

### Sprint 76 — Communication Test Suite
- **Role:** QA & Test Engineer | **Layer:** All
- Integration tests: create channel, post message, react, resolve thread, search.
- **AC:** 15+ communication flow tests passing in CI.

## Flow: Agent Communication API (Sprints 77-80)

### Sprint 77 — Agent API: Authentication
- **Role:** Backend Engineer | **Layer:** State (2), Constraint (6)
- API key auth for agent accounts. Agent-type user with limited permissions.
- **AC:** Agent can authenticate via API key; rate limited separately from humans.

### Sprint 78 — Agent API: Contribute & Message
- **Role:** Integration Engineer | **Layer:** Relationship (3)
- POST /api/agent/contribute (submit content for extraction). POST /api/agent/message (post to thread).
- **AC:** Agent can contribute and message; outputs tagged as agent-authored.

### Sprint 79 — Agent API: Channels & Threads
- **Role:** Integration Engineer | **Layer:** Relationship (3)
- GET /api/agent/channels, GET /api/agent/threads, POST /api/agent/threads (create).
- **AC:** Agent can list channels, list/create threads programmatically.

### Sprint 80 — Agent API: React & Resolve
- **Role:** Integration Engineer | **Layer:** Relationship (3)
- POST /api/agent/react (react to message). POST /api/agent/resolve (resolve thread with summary).
- **AC:** Agent can react to messages and resolve threads via API.

---

# Cycle 10: Agent Quality & Rich Communication (Sprints 81-88)

*Ebb: Agent identity, expertise routing, commitment tracking, agent abuse prevention. Flow: File attachments, presence, pinning, communication analytics.*

## Ebb: Agent Quality (Sprints 81-84)

### Sprint 81 — Agent Identity Display
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Visual distinction for agent-authored messages (badge, different avatar). Agent profile page.
- **AC:** Agent messages clearly distinguishable from human messages.

### Sprint 82 — Domain Expertise Routing
- **Role:** Event Systems Engineer | **Layer:** Event (4)
- Route threads to agents/humans based on e/H-LAM/T dimension expertise scores.
- **AC:** New thread in a dimension auto-notifies experts in that dimension.

### Sprint 83 — Commitment Tracking
- **Role:** Workflow Engineer | **Layer:** Flow (5)
- Extract commitments from messages. Track status (made/in-progress/fulfilled/broken). Dashboard.
- **AC:** Commitments extracted and trackable; dashboard shows fulfillment rate.

### Sprint 84 — Agent Rate Limiting & Abuse
- **Role:** Compliance & Security Engineer | **Layer:** Constraint (6)
- Per-agent rate limits. Auto-throttle on spam patterns. Agent reputation score.
- **AC:** Abusive agent automatically throttled; reputation visible to admins.

## Flow: Rich Communication (Sprints 85-88)

### Sprint 85 — File Attachments
- **Role:** Backend Engineer | **Layer:** State (2)
- Upload images, PDFs, documents to messages. Supabase Storage with signed URLs.
- **AC:** User can attach files to messages; preview renders inline.

### Sprint 86 — Presence & Typing Indicators
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Show who's online in a channel. Typing indicators in threads.
- **AC:** Online users shown in channel header; typing indicator appears within 500ms.

### Sprint 87 — Thread Pinning & Bookmarks
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Pin important threads to channel top. Bookmark threads for personal reference.
- **AC:** Pinned threads appear at top; bookmarks accessible from profile.

### Sprint 88 — Communication Analytics
- **Role:** Product Engineer | **Layer:** View (7)
- Dashboard: messages per day, active threads, resolution rate, agent vs human ratio, top contributors.
- **AC:** Analytics dashboard shows 6+ metrics with time-range filtering.

---

# Cycle 11: Federation Foundations (Sprints 89-96)

*Ebb: Instance identity, canonical formats, protocol design, sharding analysis. Flow: Cross-convergence search, graph, comparison, lineage.*

## Ebb: Multi-Instance Foundations (Sprints 89-92)

### Sprint 89 — Instance Identity Schema
- **Role:** Schema Architect | **Layer:** Identity (1)
- Define instance model: unique ID, domain, public key, metadata. Local instance registry.
- **AC:** Instance record created on first boot; schema migrated.

### Sprint 90 — Cross-Instance Artifact Format
- **Role:** Schema Architect | **Layer:** Identity (1), Relationship (3)
- Canonical artifact format for federation: JSON-LD with instance origin, content hash, signatures.
- **AC:** Format spec documented; serializer/deserializer implemented and tested.

### Sprint 91 — Federation Protocol Design
- **Role:** Technical Lead | **Layer:** All
- Design federation protocol: instance discovery, artifact sync, conflict resolution, trust model.
- **AC:** Protocol spec document with sequence diagrams for all flows.

### Sprint 92 — Database Sharding Analysis
- **Role:** Backend Engineer | **Layer:** State (2)
- Analyze data growth projections. Plan partitioning strategy for messages, artifacts, contributions.
- **AC:** Sharding plan documented with migration path.

## Flow: Cross-Convergence (Sprints 93-96)

### Sprint 93 — Cross-Convergence Search
- **Role:** Backend Engineer | **Layer:** State (2)
- Search across all convergences. Results tagged with convergence origin.
- **AC:** Global search returns results from multiple convergences with source labels.

### Sprint 94 — Cross-Convergence Graph
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Graph view spanning multiple convergences. Color-code by convergence. Show cross-links.
- **AC:** Multi-convergence graph renders with convergence-colored nodes.

### Sprint 95 — Convergence Comparison
- **Role:** Product Engineer | **Layer:** View (7)
- Side-by-side comparison of two convergences: dimensions, topics, participants, artifact types.
- **AC:** Comparison view highlights shared participants and overlapping themes.

### Sprint 96 — Artifact Lineage
- **Role:** Schema Architect | **Layer:** Relationship (3)
- Track artifact evolution across convergences (idea at Event A → project at Event B → launch at Event C).
- **AC:** Artifact detail shows lineage timeline across convergences.

---

# Cycle 12: Identity & Economics (Sprints 97-104)

*Ebb: ENS read, habitat.eth subnames, security audit, privacy controls. Flow: $CLOUD credits, rewards, spending, dashboard.*

## Ebb: Identity & Security (Sprints 97-100)

### Sprint 97 — ENS Integration: Read
- **Role:** Integration Engineer | **Layer:** Relationship (3)
- Resolve ENS names for display. Show ENS avatar and records on profile.
- **AC:** User with ENS name sees it displayed on their profile and messages.

### Sprint 98 — ENS Integration: habitat.eth Subnames
- **Role:** Integration Engineer | **Layer:** Relationship (3)
- Register habitat.eth subnames for participants. Link subname to commons.id identity.
- **AC:** Participant can claim [name].habitat.eth; subname resolves to profile.

### Sprint 99 — Security Audit
- **Role:** Compliance & Security Engineer | **Layer:** Constraint (6)
- Audit RLS policies, API endpoints, auth flow, file uploads, XSS vectors.
- **AC:** Zero critical vulnerabilities; all findings documented with remediation plan.

### Sprint 100 — Privacy Controls
- **Role:** Compliance & Security Engineer | **Layer:** Constraint (6)
- User data export (GDPR). Account deletion. Contribution anonymization option.
- **AC:** User can export all their data and delete their account.

## Flow: Economic Layer (Sprints 101-104)

### Sprint 101 — $CLOUD Credit Schema
- **Role:** Schema Architect | **Layer:** Identity (1), State (2)
- Credits table: user_id, balance, transaction_type, amount, reference_id. Ledger model.
- **AC:** Credit balance tracks correctly through earned/spent transactions.

### Sprint 102 — Contribution Rewards
- **Role:** Workflow Engineer | **Layer:** Flow (5)
- Earn credits for contributions, thread resolutions, high-quality artifacts. Configurable reward rates.
- **AC:** Credits auto-awarded on qualifying actions; visible in profile.

### Sprint 103 — Credit Spending
- **Role:** Workflow Engineer | **Layer:** Flow (5)
- Spend credits on: priority extraction, featured artifact, agent API calls.
- **AC:** User can spend credits; balance deducted; feature activated.

### Sprint 104 — Credit Dashboard
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Transaction history, balance chart, earning breakdown, spending categories.
- **AC:** Dashboard shows complete credit history with filtering.

---

# Cycle 13: Public API & Scale (Sprints 105-112)

*Ebb: API v2, rate tiers, GraphQL, load testing. Flow: Python SDK, instance discovery, artifact sync, identity portability.*

## Ebb: API & Scale (Sprints 105-108)

### Sprint 105 — Public API v2
- **Role:** Backend Engineer | **Layer:** State (2)
- Full CRUD API with pagination, filtering, sorting. OAuth2 auth.
- **AC:** API supports all CRUD operations; OAuth2 flow works.

### Sprint 106 — API Rate Limiting & Tiers
- **Role:** Compliance & Security Engineer | **Layer:** Constraint (6)
- Tiered rate limits: free (100/hr), pro (1000/hr), agent (5000/hr). Rate limit headers.
- **AC:** Rate limits enforced by tier; headers show remaining quota.

### Sprint 107 — GraphQL API
- **Role:** Backend Engineer | **Layer:** State (2)
- GraphQL endpoint for complex queries (artifacts with relationships, nested threads, participant graphs).
- **AC:** GraphQL playground works; complex nested queries resolve correctly.

### Sprint 108 — Load Testing
- **Role:** QA & Test Engineer | **Layer:** All
- Load test: 100 concurrent users, 50 messages/sec, 10 contributions/sec.
- **AC:** System handles target load with P95 latency <500ms.

## Flow: SDK & Federation (Sprints 109-112)

### Sprint 109 — Python SDK
- **Role:** Integration Engineer | **Layer:** Relationship (3)
- Python SDK for REST and GraphQL APIs. Published to PyPI.
- **AC:** SDK covers all endpoints; README with examples; installable via pip.

### Sprint 110 — Federation: Instance Discovery
- **Role:** Integration Engineer | **Layer:** Relationship (3)
- Well-known endpoint for instance metadata. DNS-based discovery. Instance directory.
- **AC:** Instance A can discover and verify Instance B via well-known URL.

### Sprint 111 — Federation: Artifact Sync
- **Role:** Event Systems Engineer | **Layer:** Event (4)
- Push/pull artifact sync between federated instances. Conflict resolution via content hash.
- **AC:** Artifact created on Instance A appears on Instance B within 30 seconds.

### Sprint 112 — Federation: Identity Portability
- **Role:** Schema Architect | **Layer:** Identity (1)
- Portable identity across instances using DID or ENS. Same user recognized on multiple instances.
- **AC:** User authenticates on Instance B with Instance A identity.

---

# Cycle 14: Federation Hardening & Infrastructure (Sprints 113-120)

*Ebb: Trust model, conflict resolution, federation monitoring, test suite. Flow: CDN, multi-region, horizontal scaling, chaos testing.*

## Ebb: Federation Hardening (Sprints 113-116)

### Sprint 113 — Federation Trust Model
- **Role:** Compliance & Security Engineer | **Layer:** Constraint (6)
- Instance trust levels: untrusted, verified, trusted. Content filtering by trust level.
- **AC:** Admin can set trust level; untrusted content marked and filterable.

### Sprint 114 — Federation Conflict Resolution
- **Role:** Backend Engineer | **Layer:** State (2)
- Handle edit conflicts, deleted-on-one-side artifacts, divergent thread resolutions.
- **AC:** All conflict scenarios resolve without data loss; conflicts logged.

### Sprint 115 — Federation Monitoring
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Dashboard showing federation peers, sync status, latency, error rates.
- **AC:** Admin can monitor all federation connections from one screen.

### Sprint 116 — Federation Test Suite
- **Role:** QA & Test Engineer | **Layer:** All
- Integration tests with two test instances: sync, conflict, trust, identity.
- **AC:** 20+ federation tests passing; covers all protocol flows.

## Flow: Infrastructure Scale (Sprints 117-120)

### Sprint 117 — CDN & Edge Caching
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- CDN for static assets and cached API responses. Edge functions for dynamic content.
- **AC:** Static assets served from CDN; TTFB <100ms globally.

### Sprint 118 — Multi-Region Database
- **Role:** Backend Engineer | **Layer:** State (2)
- Read replicas in multiple regions. Connection routing by geography.
- **AC:** Read latency <50ms from configured regions.

### Sprint 119 — Horizontal Scaling
- **Role:** Technical Lead | **Layer:** All
- Document and test horizontal scaling: multiple Edge Function instances, connection pooling, queue workers.
- **AC:** System handles 2x load by adding instances without code changes.

### Sprint 120 — Scale Testing & Chaos Engineering
- **Role:** QA & Test Engineer | **Layer:** All
- Test failure scenarios: DB failover, Edge Function timeout, federation peer down, CDN origin failure.
- **AC:** System recovers from each failure scenario within documented SLA.

---

# Cycle 15: Plugin Architecture & Integrations (Sprints 121-128)

*Ebb: Plugin design, runtime, extraction hooks, marketplace UI. Flow: Matrix bridge, ActivityPub, Farcaster, Zapier/n8n.*

## Ebb: Plugin Architecture (Sprints 121-124)

### Sprint 121 — Plugin System Design
- **Role:** Technical Lead | **Layer:** All
- Design plugin architecture: lifecycle hooks, sandboxed execution, manifest format, permissions model.
- **AC:** Plugin spec documented with lifecycle diagram and permission matrix.

### Sprint 122 — Plugin Runtime
- **Role:** Backend Engineer | **Layer:** State (2), Event (4)
- Plugin execution environment: load, initialize, handle events, cleanup. Isolated per plugin.
- **AC:** Sample plugin loads and responds to contribution events.

### Sprint 123 — Plugin Hooks: Extraction
- **Role:** Event Systems Engineer | **Layer:** Event (4)
- Hooks: pre-extraction (modify prompt), post-extraction (enrich artifacts), custom extractors.
- **AC:** Plugin can modify extraction behavior without core code changes.

### Sprint 124 — Plugin Marketplace UI
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Browse, install, configure, disable plugins. Plugin settings page.
- **AC:** User can install a plugin from marketplace and configure it.

## Flow: Third-Party Integrations (Sprints 125-128)

### Sprint 125 — Matrix Bridge
- **Role:** Integration Engineer | **Layer:** Relationship (3)
- Bridge commons.id channels to Matrix rooms. Bidirectional message sync.
- **AC:** Message posted in Matrix appears in commons.id thread and vice versa.

### Sprint 126 — ActivityPub Support
- **Role:** Integration Engineer | **Layer:** Relationship (3)
- Publish artifacts as ActivityPub objects. Follow commons.id convergences from Mastodon.
- **AC:** Artifact published to ActivityPub appears in Mastodon feed of follower.

### Sprint 127 — Farcaster Integration
- **Role:** Integration Engineer | **Layer:** Relationship (3)
- Post artifact summaries as Farcaster casts. Import casts as contributions via Frame.
- **AC:** Artifact creates a cast; Farcaster Frame submits contribution to commons.id.

### Sprint 128 — Zapier/n8n Connector
- **Role:** Integration Engineer | **Layer:** Relationship (3)
- Webhook-based connector for Zapier/n8n. Triggers: new artifact, new thread, resolution.
- **AC:** Zapier zap triggers on new artifact; action creates contribution.

---

# Cycle 16: Mobile (Sprints 129-136)

*Ebb: PWA, mobile nav, push notifications, offline queue. Flow: React Native shell, camera, voice, app store submission.*

## Ebb: Mobile Foundation (Sprints 129-132)

### Sprint 129 — PWA Manifest & Service Worker
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Add web app manifest, service worker for offline caching, install prompt.
- **AC:** App installable as PWA on iOS and Android; loads offline with cached data.

### Sprint 130 — Mobile Navigation Redesign
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Bottom tab bar, swipe gestures, mobile-optimized channel/thread navigation.
- **AC:** Full app navigable with thumb-only on mobile.

### Sprint 131 — Push Notifications
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Web push notifications for mentions, thread updates, new contributions.
- **AC:** User receives push notification on mobile within 10 seconds of mention.

### Sprint 132 — Offline Contribution Queue
- **Role:** Workflow Engineer | **Layer:** Flow (5)
- Queue contributions when offline. Sync when connection restored. Conflict handling.
- **AC:** Contribution submitted offline appears after reconnection.

## Flow: Mobile Native (Sprints 133-136)

### Sprint 133 — React Native Shell
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- React Native app with shared component logic. iOS and Android builds.
- **AC:** Native app builds and runs on iOS simulator and Android emulator.

### Sprint 134 — Native Camera Integration
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Capture photos/documents from native camera. OCR extraction for whiteboard notes.
- **AC:** Photo taken in-app extracts text and creates contribution.

### Sprint 135 — Native Voice Contributions
- **Role:** Event Systems Engineer | **Layer:** Event (4)
- Record audio, transcribe via Whisper, submit as contribution. Show transcript before submit.
- **AC:** Voice recording transcribes and submits as contribution.

### Sprint 136 — App Store Submission
- **Role:** Product Engineer | **Layer:** View (7)
- Prepare store listings, screenshots, privacy policy. Submit to App Store and Play Store.
- **AC:** App submitted to both stores; passes initial review.

---

# Cycle 17: Accessibility & i18n (Sprints 137-144)

*Ebb: WCAG audit, screen reader, i18n framework, RTL. Flow: User docs, developer docs, governance, community pipeline.*

## Ebb: Accessibility & i18n (Sprints 137-140)

### Sprint 137 — WCAG 2.1 AA Audit
- **Role:** QA & Test Engineer | **Layer:** View (7)
- Full WCAG 2.1 AA audit. Document all violations with severity and remediation.
- **AC:** Audit report complete; all Level A violations fixed.

### Sprint 138 — Screen Reader Optimization
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Test with VoiceOver and NVDA. Fix landmark regions, live regions, focus management.
- **AC:** Core flows completable via screen reader without confusion.

### Sprint 139 — i18n Framework
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Set up react-intl or similar. Extract all strings. Default locale: en-US.
- **AC:** All UI strings extracted; locale switching works with placeholder second language.

### Sprint 140 — RTL Support
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Add RTL CSS support. Test with Arabic locale. Fix layout issues.
- **AC:** App renders correctly in RTL mode with no layout breaks.

## Flow: Documentation & Governance (Sprints 141-144)

### Sprint 141 — User Documentation
- **Role:** Product Engineer | **Layer:** View (7)
- Getting started guide, feature walkthroughs, FAQ. Hosted at docs.commons.id.
- **AC:** Documentation site live with 10+ pages covering all major features.

### Sprint 142 — Developer Documentation
- **Role:** Technical Lead | **Layer:** All
- Architecture guide, plugin development, API reference, contribution guide, local dev setup.
- **AC:** New developer can set up local environment and make a contribution in <30 minutes.

### Sprint 143 — Governance Framework
- **Role:** Product Engineer | **Layer:** Constraint (6)
- Define governance model: convergence ownership, moderation policies, plugin review, federation admission.
- **AC:** Governance document ratified; roles and processes defined.

### Sprint 144 — Community Contribution Pipeline
- **Role:** Technical Lead | **Layer:** Flow (5)
- Issue templates, PR review process, contributor license agreement, recognition system.
- **AC:** External contributor can submit PR with clear guidance; merged within one review cycle.

---

# Cycle 18: Final Polish & Launch (Sprints 145-152)

*Ebb: Regression suite, performance budgets, dependency audit, doc review. Flow: Launch checklist, landing page, hosted offering, v1.0.*

## Ebb: Final Polish (Sprints 145-148)

### Sprint 145 — End-to-End Regression Suite
- **Role:** QA & Test Engineer | **Layer:** All
- Comprehensive regression suite: 50+ tests covering all phases. Runs nightly.
- **AC:** Full regression passes; <5% flake rate.

### Sprint 146 — Performance Budget
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- Set performance budgets: bundle size <200KB, LCP <2.5s, FID <100ms. CI enforcement.
- **AC:** Performance budgets enforced in CI; current build passes all budgets.

### Sprint 147 — Dependency Audit
- **Role:** Compliance & Security Engineer | **Layer:** Constraint (6)
- Audit all npm/pip dependencies. Remove unused. Update vulnerable. License compatibility check.
- **AC:** Zero known vulnerabilities; all licenses compatible.

### Sprint 148 — Documentation Review
- **Role:** Technical Lead | **Layer:** All
- Review all documentation for accuracy. Update screenshots. Fix broken links.
- **AC:** All docs reviewed and updated; zero broken links.

## Flow: Ecosystem Launch (Sprints 149-152)

### Sprint 149 — Public Launch Checklist
- **Role:** Product Engineer | **Layer:** All
- Final launch checklist: monitoring, backups, support channels, incident response plan.
- **AC:** All checklist items verified; incident response tested with drill.

### Sprint 150 — Landing Page & Marketing Site
- **Role:** Frontend & DevOps Engineer | **Layer:** View (7)
- commons.id landing page: value prop, demo convergence, pricing, docs links, sign up.
- **AC:** Landing page live at commons.id; conversion funnel tracked.

### Sprint 151 — Hosted Offering
- **Role:** Backend Engineer | **Layer:** State (2), Constraint (6)
- Multi-tenant hosting: sign up, create convergence, custom domain, billing integration.
- **AC:** New user can sign up and have a working convergence in <5 minutes.

### Sprint 152 — v1.0 Release
- **Role:** Technical Lead | **Layer:** All
- Tag v1.0. Release notes. Announce on all channels. Archive pre-release issues.
- **AC:** v1.0 tagged and published; release notes cover all phases; announcement posted.

---

# Cycle 19: Post-v1.0 Horizon (Sprints 153-160)

*Ebb: Post-launch triage, user feedback synthesis, telemetry review, roadmap v2 planning. Flow: Top user-requested features, community plugins, partner convergences, ecosystem seeding.*

## Ebb: Post-Launch (Sprints 153-156)

### Sprint 153 — Post-Launch Bug Triage
- **Role:** QA & Test Engineer | **Layer:** All
- Catalog all bugs from first wave of public users. Prioritize by impact and frequency.
- **AC:** All reported bugs triaged; critical bugs fixed within 24 hours.

### Sprint 154 — User Feedback Synthesis
- **Role:** Product Engineer | **Layer:** All
- Aggregate feedback from all channels. Identify top 10 feature requests and top 10 pain points.
- **AC:** Feedback report with prioritized action items.

### Sprint 155 — Telemetry Review
- **Role:** Backend Engineer | **Layer:** State (2), Event (4)
- Analyze usage patterns: most-used features, drop-off points, performance bottlenecks at scale.
- **AC:** Telemetry report with recommendations for next development cycle.

### Sprint 156 — 2027 Roadmap Planning
- **Role:** Technical Lead | **Layer:** All
- Plan next year's roadmap based on feedback, telemetry, and ecosystem needs. Community input process.
- **AC:** Draft 2027 roadmap published for community review.

## Flow: Ecosystem Seeding (Sprints 157-160)

### Sprint 157 — Top Feature Request Implementation
- **Role:** Product Engineer | **Layer:** All
- Build the #1 most-requested feature from user feedback synthesis.
- **AC:** Feature shipped and announced; requesting users notified.

### Sprint 158 — Community Plugin Showcase
- **Role:** Integration Engineer | **Layer:** Relationship (3)
- Curate and highlight 3+ community-built plugins. Feature on marketplace homepage.
- **AC:** Showcase page live with plugin descriptions, install counts, ratings.

### Sprint 159 — Partner Convergence Onboarding
- **Role:** Product Engineer | **Layer:** All
- Onboard 3 partner organizations to host convergences. White-glove setup and support.
- **AC:** 3 partner convergences live with active contributions.

### Sprint 160 — Ecosystem Health Report
- **Role:** Technical Lead | **Layer:** All
- Publish ecosystem health metrics: instances, convergences, contributions, agents, federation peers.
- **AC:** Public dashboard showing ecosystem health; report published.

---

*Roadmap created Feb 11, 2026. 160 sprints across 19 ebb-flow cycles.*
*Sprints 1-8: prior art (complete). Sprints 9-160: active roadmap.*
*Every cycle optimizes then builds. Every sprint advances commons.id toward replacing Discord for convergence communication.*
