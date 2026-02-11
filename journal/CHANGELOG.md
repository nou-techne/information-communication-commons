# Changelog — commons.id

All notable changes to the Information & Communications Commons platform.

Format: [Semantic Versioning](https://semver.org/). Each entry includes sprint reference and TIO role.

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
