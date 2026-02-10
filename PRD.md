# Information & Communications Commons

> A knowledge-graph-backed living archive that carries artifacts across convergence events — enabling agents and humans to deepen conversation, track commitments, and amplify aliveness beyond the time-bound container of any single gathering.

---

## Meta

| Field | Value |
|-------|-------|
| **Status** | `discovery` |
| **Health** | `green` |
| **Owner** | Todd Youngblood + Aaron Gabriel |
| **Steward** | Todd Youngblood (Techne) |
| **Tier** | `venture` |
| **Created** | 2026-02-10 |
| **Last Reviewed** | 2026-02-10 |
| **Reviewers** | Nou (agent) |

---

## 1. Problem

Every year, convergence events (ETHBoulder, GFEL, unconferences) generate extraordinary energy — new relationships form, ideas emerge, capital flows, commitments are made. Then the event ends, and that energy dissipates. The context, the heart-mind space, the connections between ideas — most of it is lost. What survives is scattered across personal notes, forgotten Discord channels, and fading memory.

### Who feels this problem?
- **Primary:** Event participants who want to build on what emerged
- **Secondary:** Communities and cooperatives trying to sustain momentum between events; agents trying to coordinate across contexts

### What happens if we don't solve it?
- Same conversations repeat year after year
- Commitments made in high-energy moments go untracked
- Patterns that span multiple gatherings remain invisible
- Agent coordination is ad-hoc, context-poor

### What exists today?
- **Current state:** Grain recordings, Discord archives, personal notes, scattered Google Docs
- **Why it's insufficient:** No structure, no lineage, no context preservation, no agent access, no artifact lifecycle

---

## 2. Solution

### Core proposition

A living knowledge graph that serves as the information and communications commons for convergence events. The graph preserves artifacts with full context (who, when, where, what state, what energy) and carries them across three temporal states: pre-conference, unconference, and post-conference. Agents interact via API; humans interact via a platform designed to feel like exploring a living garden, not querying a database.

### Key outcomes
1. Artifacts (ideas, proposals, commitments, relationships) survive beyond events with context intact
2. Agents can coordinate using structured knowledge, not raw chat streams
3. Participants experience continuity — each convergence builds on the last
4. Patterns become visible across years and events

### What this is NOT
- Not a conference app (scheduling, logistics, ticketing)
- Not a social network (profiles, feeds, likes)
- Not a CMS (static content management)
- Not a replacement for in-person gathering (technology amplifies aliveness, doesn't replace it)

---

## 3. Requirements by Pattern Layer

### 3.1 Identity — What entities does this introduce?

- [x] **Participant** — Human attendee (name, affiliation, interests, bio)
- [x] **Agent** — AI agent representing a participant or collective (name, capabilities, role)
- [x] **Artifact** — Any knowledge object (idea, proposal, commitment, pattern, synthesis, question)
- [x] **Session** — A conversation container (panel, workshop, 1:1, hallway)
- [x] **Convergence** — An event instance (ETHBoulder 2026, Cosmolocal 2027)
- [x] **Tent** — A thematic framing (ETHBoulder, Cosmolocal Convergence, Civic Finance Forum)
- [x] **Commons** — The knowledge graph itself as a governed entity
- [x] Naming: Human-readable names + persistent IDs (ENS subnames for agents?)
- [x] Uniqueness: Artifacts identified by content hash + origin context

### 3.2 State — What do we need to track?

**Artifact lifecycle:**
```
seed → discussed → proposed → committed → active → completed → archived
                                                          ↓
                                                      superseded
```

**Convergence lifecycle:**
```
announced → pre-conference → live → post-conference → archived
```

- [x] Artifact attributes: title, summary, origin context, lineage, stewards, energy level, maturity
- [x] Temporal state: which convergence phase (pre / during / post)
- [x] Participant engagement state: registered → attending → contributing → stewarding

### 3.3 Relationship — What connects to what?

- [x] **Participant ↔ Artifact:** authored, contributed_to, stewards, interested_in
- [x] **Artifact ↔ Artifact:** builds_on, extends, contradicts, supersedes, related_to
- [x] **Artifact ↔ Session:** discussed_in, emerged_from
- [x] **Participant ↔ Participant:** connected_at (with session/convergence context)
- [x] **Agent ↔ Participant:** represents, observes_for
- [x] **Artifact ↔ Tent:** belongs_to, crosses (cross-cutting themes)
- [x] **Artifact ↔ Convergence:** originated_at, evolved_at, presented_at
- [x] Cardinality: many:many for most relationships (artifacts cross tents, participants attend multiple sessions)

### 3.4 Event — What happens?

- [x] **artifact.created** — New artifact enters the commons
- [x] **artifact.evolved** — Artifact updated with new context, state change, or fork
- [x] **artifact.linked** — Relationship created between artifacts
- [x] **session.recorded** — Conversation captured and ingested
- [x] **session.synthesized** — Agent produces summary/extraction from session
- [x] **commitment.made** — Participant explicitly commits to action
- [x] **commitment.updated** — Progress reported on commitment
- [x] **observation.submitted** — Agent or human adds annotation/insight
- [x] **convergence.state_changed** — Event transitions between phases
- [x] Triggers: Human action (contribution form), agent action (extraction), temporal (phase transition), external (Bonfire ingestion)

### 3.5 Flow — What moves between agents?

- [x] **Conversations → Knowledge graph:** Raw recordings transcribed, entities extracted, relationships mapped (Bonfire AI pipeline)
- [x] **Knowledge graph → Personal agents:** Context packages, relevant artifact surfacing, connection suggestions
- [x] **Personal agents → Knowledge graph:** Observations, annotations, commitment tracking
- [x] **Knowledge graph → Human platform:** Views, summaries, garden visualization
- [x] **Human platform → Knowledge graph:** Feedback, corrections, new contributions
- [x] **Between convergences:** Artifacts carry forward; patterns compound

### 3.6 Constraint — What rules govern valid states?

- [x] **Attribution:** Every artifact must have an origin (who, when, what session)
- [x] **Consent:** Participants opt in to having their conversations recorded and extracted
- [x] **Privacy:** Chatham House rule option per session (ideas attributed, speakers not)
- [x] **Lineage integrity:** Artifacts cannot be modified without creating a new version (append-only history)
- [x] **Stewardship:** Every artifact above "seed" state must have at least one human steward
- [x] **Agent transparency:** Agent-generated content clearly labeled as such
- [x] **Commons governance:** Decisions about the commons structure require cooperative consensus

### 3.7 View — What do stakeholders need to see?

- [x] **The Garden** — Visual knowledge graph. Clusters, colors, pulse. Zoom in/out.
- [x] **My Thread** — Personal view: my connections, commitments, relevant artifacts. Agent-curated briefing.
- [x] **Live Pulse** — During event: real-time extracted insights, cross-session connections
- [x] **The Archive** — Searchable history across convergences. Filter by year, state, theme, person.
- [x] **Contribution** — Easy input: reflections, corrections, new connections. Voice-friendly. Agent-assisted tagging.
- [x] **Steward Dashboard** — For artifact stewards: track health, lineage, engagement of artifacts they're responsible for

---

## 4. Success Metrics

| Metric | Target | Measurement Method | Frequency |
|--------|--------|--------------------|-----------|
| Artifacts surviving past event | >60% have activity 30d post | Knowledge graph query | Post-event |
| Participant return rate | >40% attend consecutive year | Registration comparison | Annual |
| Cross-tent connections | >10 artifacts spanning 2+ tents | Graph analysis | Per convergence |
| Agent-surfaced connections | >50 "you might be interested" that are relevant | Participant feedback | Per event |
| Commitment tracking | >70% of commitments have status update within 90d | Commitment query | Quarterly |

### Leading indicators
- Number of artifacts created during pre-conference state
- Agent API usage (queries, observations submitted)
- Participant engagement with "My Thread" view

### Lagging indicators
- Projects that trace lineage to convergence artifacts
- Patterns extracted across 2+ convergences
- Revenue generated from commons-adjacent services

---

## 5. Dependencies

### Internal dependencies (within Techne)

| Dependency | Status | Owner | Notes |
|------------|--------|-------|-------|
| Agent infrastructure (Nou, $CLOUD) | Operational | Todd | API metering via $CLOUD credits |
| ENS identity (habitat.eth) | Operational | Todd | Participant/agent identity |
| Cooperative governance | Operational | Todd | Commons governance model |

### External dependencies (outside Techne)

| Dependency | Status | Owner | Notes |
|------------|--------|-------|-------|
| Bonfire AI | Piloting at ETHBoulder 2026 | Bonfire team | Knowledge graph ingestion |
| ETHBoulder 2026 | Feb 13-16 | ETHBoulder organizers | First convergence to capture |
| Clawsmos / agent community | Active | Aaron Gabriel + community | Agent swarm coordination |

### This project enables
- Civic Finance Forum (Todd's proposed tent)
- Agent coordination standards (Klausmos evolution)
- Techne pattern library expansion (convergence as design pattern)

---

## 6. Stakeholders

| Stakeholder | Role | Interest | Engagement Level |
|-------------|------|----------|-----------------|
| Todd Youngblood | Co-owner / Steward | Information commons, civic finance, Techne integration | Accountable |
| Aaron Gabriel | Co-owner | Agent orchestration, cosmolocal framing, Klausmos | Responsible |
| Bonfire AI team | Technology partner | Knowledge graph tooling, ETHBoulder pilot | Consulted |
| ETHBoulder organizers | Event partner | Conference infrastructure, participant access | Consulted |
| Convergence participants | Users | Value from artifact continuity, agent-curated insights | Informed |

---

## 7. Revenue and Patronage

### Revenue model
- **Service revenue:** Knowledge graph API access for agent developers ($CLOUD credits)
- **Event revenue:** Premium features for convergence organizers (live pulse, synthesis reports)
- **Commons revenue:** Sustained access to archive (freemium — basic free, advanced views paid)
- Revenue stream type: `service` + `venture-reciprocity`

### Patronage implications
- **Labor:** System design, development, stewardship (Todd, Aaron, engineers)
- **Expertise:** Knowledge graph architecture, agent orchestration, UX design
- **Relationship:** Bonfire AI partnership, ETHBoulder organizer relationship, Clawsmos community
- **Capital:** Infrastructure costs (hosting, compute, storage)

### Venture reciprocity
- **1% commitment:** 1% of revenue flowing through the venture returns to RegenHub cooperative
- **Tracking:** Via Habitat patronage system (contribution logging, period allocation)
- **Structure:** Defined by venture stewards, tracked in $CLOUD

---

## 8. Compliance and Legal

- [ ] Legal structure: TBD (could operate under Techne/RegenHub LCA initially)
- [ ] Privacy: GDPR-aware (participant consent for recording, right to deletion)
- [ ] Data retention: Governed by commons governance (not unilateral)
- [ ] Intellectual property: `peer-production-license` (CopyFarLeft — commons-oriented)
- [ ] Recording consent: Explicit opt-in per session at convergence events

---

## 9. Timeline and Milestones

| Milestone | Target Date | Status | Notes |
|-----------|-------------|--------|-------|
| Project concept + README | 2026-02-10 | `complete` | Todd + AG conversation |
| Venture promotion | 2026-02-10 | `complete` | Elevated from project |
| ETHBoulder 2026 capture | 2026-02-13 | `pending` | First convergence data via Bonfire |
| Post-ETHBoulder synthesis | 2026-02-28 | `pending` | Agent-generated synthesis from event |
| Knowledge graph prototype | 2026-Q2 | `pending` | Minimal API + garden view |
| Agent API v1 | 2026-Q2 | `pending` | Core operations for agent access |
| 2027 convergence planning | 2026-Q4 | `pending` | Three tents: ETHBoulder, Cosmolocal, Civic Finance |

### Phase structure
- **Discovery:** ← We are here. Problem validated, stakeholders identified, system designed.
- **Specification:** Requirements refined through ETHBoulder pilot experience
- **Implementation:** Knowledge graph + API + platform built
- **Operational:** Live for 2027 convergence cycle

---

## 10. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Bonfire AI pilot doesn't meet expectations | medium | medium | Evaluate alternatives; design graph-agnostic API |
| Low participant adoption of platform | medium | high | Focus on agent-side value first; human platform follows demand |
| Privacy concerns with conversation recording | medium | high | Explicit consent, Chatham House option, delete rights |
| Scope creep (becomes "everything platform") | high | medium | Strict "what this is NOT" boundaries in PRD |
| Agent coordination standards not established | medium | medium | Start with simple API, evolve based on actual usage |

---

## 11. Open Questions

1. What graph technology backs the knowledge graph? (Neo4j, Dgraph, RDF, lighter-weight?)
2. How does Bonfire AI integration work technically? (API, export format, real-time vs. batch?)
3. What's the governance model for the commons? (Cooperative stewardship via RegenHub?)
4. How does identity work? (ENS subnames? Email? Hybrid? Guest access?)
5. What's the minimum viable capture for ETHBoulder 2026? (Just recordings? Structured extraction?)
6. How does this venture relate financially to ETHBoulder itself?
7. What role does Nou play in the agent ecosystem for this venture?

---

## 12. Decision Log

| Date | Decision | Rationale | Decided By |
|------|----------|-----------|------------|
| 2026-02-10 | Created as project | Todd + AG conversation on convergence vision | Todd |
| 2026-02-10 | Promoted to venture | Sufficient scope, multi-stakeholder, revenue potential | Todd |
| 2026-02-10 | Knowledge graph = information commons | Graph is the primary artifact, not a backend detail | Todd |
| 2026-02-10 | Three temporal states (pre/during/post) | Artifacts must carry context across event phases | Todd + AG |
| 2026-02-10 | Three tents for 2027 (ETHBoulder, Cosmolocal, Civic Finance) | Plurality of framings for different audiences | Todd + AG |

---

## 13. Review History

| Date | Reviewer | Role | Health | Notes |
|------|----------|------|--------|-------|
| 2026-02-10 | Nou | agent | green | Initial creation, discovery phase, ETHBoulder in 3 days |

---

## Appendix

### Related documents
- `README.md` — Project overview and concept synthesis
- `SYSTEM.md` — System design (three states, artifact lifecycle, agent API, human platform)

### Related projects
- `projects/ethboulder-2026.md` — ETHBoulder event context
- `projects/ventures/learn-vibe-build/` — Techne educational venture (potential convergence integration)
- Habitat patronage system — Venture reciprocity tracking

### References
- Todd + Aaron Gabriel conversation, Feb 10, 2026 (Grain recording)
- Aaron Gabriel, "Amplifying Aliveness" (blog post)
- Bonfire AI — Knowledge graph tooling (bonfire.cafe)
- Cosmolocalism — cosmolocalism.eu

---

*Template version: 1.0*
*Developed for Techne / RegenHub, LCA*
