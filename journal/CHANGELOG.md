# Changelog — commons.id

All notable changes to the Information & Communications Commons platform.

Format: [Semantic Versioning](https://semver.org/). Each entry includes sprint reference and TIO role.

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
