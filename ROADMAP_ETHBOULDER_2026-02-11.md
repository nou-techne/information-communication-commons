# commons.id/app — ETHBoulder Readiness Roadmap

*Evolutionary sprint plan: test, enhance, refine before ETHBoulder 2026 (Feb 13-16)*

**Method:** TIO-integrated sprints. Each sprint has a primary TIO role, layer mapping, and acceptance criteria drawn from role quality standards.
**Timeline:** Feb 11-12, 2026 (~48 hours, 30-minute heartbeat cadence)
**Cadence:** Micro-sprints during heartbeats + directed work sessions

---

## Current State (Feb 11, 2026)

**Working:**
- App live at commons.id/app/ (React + Vite + TypeScript + Tailwind)
- Contribution → Supabase INSERT → Edge Function → Claude extraction → ingest_extraction → artifacts in Explore
- Real-time subscriptions (artifacts, events, contributions)
- e/H-LAM/T dimension cards with counters
- Dimension detail views (H/ shows participants, others show tagged artifacts)
- My Thread shows contributions with live status updates
- ETHBoulder theming (lime #c3fd50 + dark grey #0f0f0f)
- Custom 404 page
- Auth via magic link (Spacemail SMTP)

**Known Issues:**
- No error recovery for failed extractions (Edge Function errors leave contributions in "error" state)
- No way to re-process failed contributions
- Contribution not linked to authenticated user
- No loading/processing indicator after submission (user sees "done" but extraction is async)
- Artifact detail page untested with real data
- No mobile optimization pass
- No rate limiting on contributions
- ethboulder.commons.id subdomain not yet configured

**Not Built:**
- Knowledge graph visualization (D3-force)
- White-label convergence context provider
- Participant self-registration
- Search across contributions

---

## Block 1: Reliability (Sprints 1-4)
*Ensure the core loop works flawlessly under real conditions*

**Primary TIO Role:** QA and Test Engineer (cross-cutting)
**Layer:** Event (4) + Flow (5)

### Sprint 1 — Edge Function Error Handling
- Add retry logic to Edge Function (1 retry on Claude timeout)
- Log extraction errors to a `contribution_errors` column (JSONB)
- If Claude returns code fences, strip them before JSON.parse
- **Acceptance:** No silent failures. Every contribution ends in `complete` or `error` with diagnostics.

### Sprint 2 — End-to-End Smoke Test
- Submit 5 diverse contributions (short idea, long session notes, commitment, question, mixed content)
- Verify each produces correct artifacts, tags, dimensions, relationships
- Verify dimension counters match actual tagged artifacts
- Verify My Thread shows all contributions with correct status
- **Acceptance:** 5/5 contributions processed correctly. Zero orphaned data.

### Sprint 3 — Extraction Quality Tuning
- Review Claude extraction prompt for accuracy (correct dimension enum, type classification)
- Test edge cases: very short input, non-English fragments, emoji, URLs
- Ensure duplicate submissions don't create duplicate artifacts
- **Acceptance:** Extraction handles all ETHBoulder-realistic inputs without error.

### Sprint 4 — Contribution-to-User Linking
- Link contributions to authenticated user when signed in
- My Thread filters to show only current user's contributions (fall back to all if not signed in)
- **Acceptance:** Signed-in user sees only their contributions in My Thread.

---

## Block 2: Experience (Sprints 5-8)
*Make the app feel polished and intuitive for first-time users*

**Primary TIO Role:** Frontend and DevOps Engineer (Layer 7 — View)
**Layer:** View (7)

### Sprint 5 — Post-Submission Feedback
- After contribution submit, show a progress indicator: "Saving..." → "Extracting..." → "Done! X artifacts created"
- Poll contribution status or use real-time subscription to update
- Link to newly created artifacts from the success screen
- **Acceptance:** User sees live feedback from submission through extraction completion.

### Sprint 6 — Mobile Responsiveness
- Audit all pages at 375px width (iPhone SE) and 390px (iPhone 14)
- Fix nav overflow, dimension card layout, artifact grid on mobile
- Ensure Contribute textarea is comfortable on mobile
- **Acceptance:** All pages usable on mobile without horizontal scroll.

### Sprint 7 — Artifact Detail Polish
- Test ArtifactDetail page with real extracted data
- Show related artifacts (via artifact_relationships)
- Show tags and dimensions clearly
- Show which contribution/session produced this artifact
- **Acceptance:** Clicking any artifact in Explore shows a complete, useful detail view.

### Sprint 8 — Empty States & Onboarding
- When Explore is empty: show welcome message + CTA to contribute
- When dimensions have 0 artifacts: show contextual encouragement
- Add a brief "How it works" section accessible from Explore
- **Acceptance:** First-time visitor understands what to do within 10 seconds.

---

## Block 3: Infrastructure (Sprints 9-12)
*Prepare for multi-user concurrent usage during the event*

**Primary TIO Role:** Integration Engineer (Layer 3) + Backend Engineer (Layer 2)
**Layer:** Relationship (3) + Constraint (6)

### Sprint 9 — ethboulder.commons.id Subdomain
- Create GitHub Pages repo or configure subdomain routing
- DNS CNAME record (Todd to add in Spaceship)
- App served at ethboulder.commons.id (root, no /app path)
- **Acceptance:** ethboulder.commons.id loads the app with HTTPS.

### Sprint 10 — Rate Limiting & Abuse Prevention
- Add rate limit to contributions table (max 10 per IP per hour via RLS or Edge Function check)
- Add content length validation (min 20 chars, max 10,000 chars)
- **Acceptance:** Spam submissions are blocked; legitimate use unaffected.

### Sprint 11 — Participant Self-Registration
- Allow authenticated users to create/update their participant profile
- Fields: name, affiliation, bio, interests
- Link participant to auth user for My Thread artifact tracking
- **Acceptance:** New user can sign in, create profile, and see their contributions linked.

### Sprint 12 — Monitoring & Observability
- Add Edge Function execution metrics (success rate, latency, error rate)
- Dashboard or log query for monitoring during event
- Alert on Edge Function failure rate > 20%
- **Acceptance:** Operator can monitor extraction health in real-time during ETHBoulder.

---

## Block 4: Depth (Sprints 13-16)
*Add features that make the knowledge graph come alive during the event*

**Primary TIO Role:** Product Engineer (cross-cutting) + Schema Architect (Layer 1)
**Layer:** Relationship (3) + View (7)

### Sprint 13 — Knowledge Graph Visualization
- D3-force graph: artifacts as nodes, relationships as edges
- Color by type, size by connection count
- Filter by dimension
- Accessible from Explore (tab or toggle)
- **Acceptance:** Visual graph renders with real data, interactive, performs with 50+ nodes.

### Sprint 14 — Live Event Dashboard
- Large-screen view optimized for projection/display at the venue
- Auto-refreshing: new artifacts appear, graph grows, counters increment
- Minimal UI chrome — the data is the show
- **Acceptance:** Looks impressive on a 1080p projector. Updates without interaction.

### Sprint 15 — Search Enhancement
- Full-text search across artifacts AND contributions
- Search results show matching snippets with highlights
- **Acceptance:** Search finds relevant results across all content.

### Sprint 16 — Pre-Event Data Seeding
- Seed ETHBoulder schedule as artifacts (sessions, speakers, topics)
- Create participant records for confirmed speakers
- Tag schedule items by tent and dimension
- **Acceptance:** App has useful content before the first contribution is submitted.

---

## Sprint Sequencing & Priority

| Priority | Sprint | Title | TIO Role | Layer | Est. |
|----------|--------|-------|----------|-------|------|
| P0 | 1 | Edge Function Error Handling | QA | 4,5 | 30m |
| P0 | 2 | E2E Smoke Test | QA | All | 30m |
| P0 | 3 | Extraction Quality Tuning | QA | 4 | 30m |
| P0 | 6 | Mobile Responsiveness | Frontend | 7 | 30m |
| P1 | 4 | Contribution-User Linking | Backend | 2,3 | 30m |
| P1 | 5 | Post-Submission Feedback | Frontend | 7 | 30m |
| P1 | 7 | Artifact Detail Polish | Frontend | 7 | 30m |
| P1 | 8 | Empty States & Onboarding | Frontend | 7 | 30m |
| P1 | 9 | ethboulder.commons.id | DevOps | 7 | 30m |
| P2 | 10 | Rate Limiting | Security | 6 | 30m |
| P2 | 11 | Participant Self-Registration | Backend | 2,3 | 60m |
| P2 | 12 | Monitoring | DevOps | 7 | 30m |
| P3 | 13 | Knowledge Graph Visualization | Schema/Frontend | 3,7 | 60m |
| P3 | 14 | Live Event Dashboard | Frontend | 7 | 60m |
| P3 | 15 | Search Enhancement | Backend | 7 | 30m |
| P3 | 16 | Pre-Event Data Seeding | Product | 1,2 | 30m |

**P0 = Must have for launch (Feb 12 EOD)**
**P1 = Should have (Feb 12 EOD)**
**P2 = Nice to have (Feb 13 AM)**
**P3 = Stretch / during event**

---

## TIO Role Coverage

| Role | Sprints | Focus |
|------|---------|-------|
| QA and Test Engineer | 1, 2, 3 | Reliability, extraction quality |
| Frontend and DevOps Engineer | 5, 6, 7, 8, 9, 12, 14 | UX, mobile, monitoring |
| Backend Engineer | 4, 11 | User linking, registration |
| Integration Engineer | 9 | Subdomain infrastructure |
| Compliance and Security | 10 | Rate limiting, abuse prevention |
| Schema Architect | 13 | Graph data model |
| Product Engineer | 8, 14, 16 | Onboarding, event experience, seeding |

---

*Roadmap created Feb 11, 2026. Informed by TIO role structure and Seven Progressive Design Patterns.*
*Target: ETHBoulder 2026, Feb 13-16, Boulder, Colorado.*
