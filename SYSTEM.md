# Information & Communications Commons — System Design

**Type:** System Design  
**Status:** Conceptual  
**License:** Peer Production License

---

## What This Is

A knowledge-graph-backed system that serves as both:
- **Agent service (API)** — structured data layer for agent coordination and artifact exchange
- **Human platform** — fun, easy-to-use interface for participants to explore, contribute, and make sense of convergence outputs

The knowledge graph IS the information commons. Not a backend detail — the primary artifact. Everything else is a view into it.

---

## Three Temporal States

The system spans three states around each convergence event. Artifacts flow between states, accumulating context.

### State 1: Pre-Conference

**Mode:** Listening, orienting, preparing  
**Energy:** Passive, reflective

**What happens here:**
- Participants register intent, interests, capabilities
- Agents surface relevant prior artifacts (from previous convergences or ongoing work)
- Threads and questions emerge from community activity
- Personal agents prepare context packages for their humans ("here's what's alive in the commons relevant to you")

**Artifacts produced:**
- Participant profiles (human + agent)
- Interest graphs (who cares about what)
- Question threads (what wants to be explored)
- Context packages (agent-curated briefings)

**Knowledge graph activity:**
- Nodes: People, Agents, Topics, Questions, Prior Artifacts
- Edges: interested_in, related_to, builds_on, authored_by

---

### State 2: Unconference

**Mode:** Active, emergent, co-creative  
**Energy:** High, complex, generative

**What happens here:**
- Conversations recorded → transcribed → fed into knowledge graph (Bonfire AI)
- Agents observe in real-time, extract entities, relationships, proposals, commitments
- Live summaries available to participants (not just chat streams)
- Cross-pollination: agents surface connections between concurrent conversations ("Session A just discussed X, which relates to what you're exploring in Session B")

**Artifacts produced:**
- Conversation transcripts (raw)
- Extracted entities (people, organizations, projects, ideas, proposals)
- Relationship maps (who met whom, what connected to what)
- Commitments and action items (explicitly stated next steps)
- Emergent themes (agent-inferred patterns across sessions)

**Knowledge graph activity:**
- Nodes: Sessions, Conversations, Ideas, Proposals, Commitments
- Edges: discussed_in, proposed_by, committed_to, connects_to, contradicts, extends
- Temporal metadata: when said, in what context, energy/sentiment

---

### State 3: Post-Conference

**Mode:** Integration, synthesis, continuation  
**Energy:** Reflective, building, deepening

**What happens here:**
- Living archive receives feedback (corrections, reflections, updates)
- Agents continue coordination in cosmos (swarm orchestration)
- Commitments tracked against progress
- Themes deepen through ongoing conversation and work
- Personal agents help humans integrate what they experienced
- Artifacts evolve (a proposal becomes a project becomes a pattern)

**Artifacts produced:**
- Synthesis documents (agent-generated, human-reviewed)
- Project seeds (proposals that gained enough energy to become work)
- Pattern extractions (recurring themes across multiple convergences)
- Relationship continuity (connections that persist beyond the event)
- Retrospectives (what worked, what didn't, what wants to emerge next)

**Knowledge graph activity:**
- Nodes: Projects, Patterns, Retrospectives, Updates
- Edges: evolved_from, informed_by, tracked_by, superseded_by
- Feedback loops: humans and agents annotate, correct, extend

---

## Artifact Lifecycle

Artifacts are not static documents. They are living nodes in the knowledge graph that carry context across states.

```
Pre-Conference          Unconference            Post-Conference
─────────────          ─────────────           ───────────────

  Question ──────────→ Discussion ──────────→ Synthesis
                         │                       │
  Interest ──────────→ Connection ─────────→ Collaboration
                         │                       │
  Context ───────────→ Proposal ───────────→ Project
                         │                       │
  Prior Pattern ─────→ Validation ─────────→ Evolved Pattern
                         │                       │
                       Commitment ─────────→ Progress Tracking
```

Each artifact carries:
- **Origin context** — when, where, who, what state
- **Lineage** — what it evolved from, what informed it
- **Current state** — active, dormant, completed, superseded
- **Stewards** — who (human or agent) is responsible for its evolution

---

## Design Framework: e/H-LAM/T

The commons is structured around Douglas Engelbart's augmentation framework (H-LAM/T), extended with an ecological foundation (e/) that grounds all coordination in living systems.

**e/H-LAM/T is not a feature list — it is the lens through which every mechanism, feature, and design decision is evaluated.** Each element of the framework maps to a structural component of the system and a narrative anchor for communicating its purpose.

### e/ — Ecology (The Ground)

Every convergence happens in a place, in a season, in a watershed. The ecological layer ensures the commons remembers its ground.

**System role:** Bioregional metadata for convergences and artifacts. Seasonal context. The land as participant.
**Narrative anchor:** "Technology that forgets its ground extracts. Technology that remembers its ground can contribute."
**Features:** Location-aware artifact tagging. Bioregional context in convergence profiles. Ecological dimensions in the knowledge graph.

### H — Human (The Practitioners)

People and their evolving capabilities. Not users — participants with embodied knowledge and unique vantage points.

**System role:** Participant identity, interest graphs, social fabric across events. Personal sense-making alongside collective synthesis.
**Narrative anchor:** "The commons is tended by people. Agents amplify; humans steward."
**Features:** Participant profiles. Interest matching. "My Thread" personal view. Contribution interfaces.

### L — Language (The Shared Vocabulary)

How we name things shapes what we can coordinate around. The knowledge graph schema IS the language of the commons.

**System role:** Ontology design. Entity types, relationship types, event types. Translation between vocabularies.
**Narrative anchor:** "The graph is how the commons speaks to itself."
**Features:** Knowledge graph schema. Tagging and categorization. Cross-vocabulary mapping. Glossary and ontology documentation.

### A — Artifacts (What Persists)

The durable traces of human coordination — the knowledge graph itself, and every node within it.

**System role:** Artifact lifecycle (seed → discussed → proposed → committed → active → completed). Lineage tracking. Context preservation.
**Narrative anchor:** "Artifacts carry forward; patterns compound."
**Features:** Artifact CRUD. Lineage visualization. Version history. Steward assignment. Context dimensions.

### M — Methodology (How We Work Together)

The practices, protocols, and workflows that turn individual capability into collective coordination.

**System role:** Three temporal states. Agent orchestration roles. Stewardship practices. The rhythm of convergence and continuation.
**Narrative anchor:** "The gardening, not just the garden."
**Features:** Pre/during/post workflows. Agent role assignment. Commitment tracking. Periodic review cycles.

### T — Training (Transformation Through Practice)

How the system improves itself. How practitioners deepen. How the commons becomes more alive over time.

**System role:** Onboarding flows. Pattern recognition across convergences. Bootstrap discipline (using the commons to improve the commons).
**Narrative anchor:** "Each convergence builds on the last. Capability compounds."
**Features:** Participant onboarding. Agent capability development. Cross-convergence pattern extraction. System retrospectives.

### How e/H-LAM/T Guides Design Decisions

When evaluating any proposed feature or mechanism, ask:

1. **e/ — Is it grounded?** Does it acknowledge place, season, ecological context? Or does it float above the world?
2. **H — Does it serve practitioners?** Does it amplify human capability, or replace it? Is it fun and easy?
3. **L — Is the language clear?** Will agents and humans understand the vocabulary? Does it translate across contexts?
4. **A — Does it produce durable artifacts?** Will something persist that carries context forward?
5. **M — Does it fit the methodology?** Which temporal state does it serve? What workflow does it support?
6. **T — Does it help the system learn?** Does it contribute to pattern recognition? Does it make the next convergence better?

---

## Dimensions of Context

The knowledge graph encodes multiple dimensions for each artifact, mapped to the e/H-LAM/T framework:

### Temporal (M — Methodology)
- Which convergence year (2026, 2027, ...)
- Which state (pre, during, post)
- Timestamp and sequence

### Social (H — Human)
- Who was present (participants, agents)
- What relationships formed or deepened
- Trust/familiarity levels

### Thematic (L — Language)
- Topics, tags, domains
- Which "tent" (ETHBoulder, Cosmolocal, Civic Finance)
- Cross-cutting themes

### Energetic (T — Training)
- Sentiment / aliveness level
- Convergence or divergence of perspectives
- Maturity (nascent idea → established pattern)

### Spatial (e/ — Ecology)
- Physical location (which room, which city)
- Bioregional context (watershed, elevation, season)
- Digital space (which channel, which platform)

---

## Agent API

The knowledge graph exposes a structured API for agent interaction.

### Core Operations

```
# Read
GET /artifacts?state=pre&theme=governance
GET /connections?participant=todd&convergence=2026
GET /threads?status=active&energy=high

# Write
POST /artifacts          — Register new artifact
POST /observations       — Agent submits extracted insight
POST /connections        — Link two artifacts or participants

# Evolve
PATCH /artifacts/:id     — Update artifact (add context, change state)
POST /artifacts/:id/fork — Create derivative artifact
POST /feedback           — Human or agent annotation
```

### Agent Roles (from Aaron's architecture)

| Role | Function | API Access |
|------|----------|------------|
| **Orchestrator** | Coordinates agent activity, assigns tasks | Full read/write |
| **Observer** | Extracts entities and relationships from conversations | Write observations |
| **Synthesizer** | Generates summaries, identifies patterns | Read all, write syntheses |
| **Representative** | Carries artifacts to external contexts | Read, fork |
| **Steward** | Maintains artifact quality and lineage | Read/write assigned artifacts |

### Personal Agent Integration

Each participant's personal agent can:
- Query the commons for relevant artifacts
- Submit observations from their human's perspective
- Track commitments their human made
- Surface connections their human might miss
- Prepare context packages before sessions

---

## Human Platform

The human-facing platform makes the knowledge graph accessible and alive.

### Design Principles

1. **Fun and easy** — Not a database browser. Feels like exploring a living garden.
2. **Multiple entry points** — Browse by theme, person, time, energy level
3. **Progressive disclosure** — Start with summaries, dive into detail on demand
4. **Contribution is natural** — Feedback, corrections, reflections are first-class actions
5. **Personal + collective** — See your own thread through the commons alongside the whole

### Key Views

**The Garden** — Visual map of the knowledge graph. Clusters of related artifacts. Zoom in for detail, zoom out for patterns. Color-coded by tent/theme. Pulse indicates recent activity.

**My Thread** — Personal view showing your connections, commitments, artifacts you've touched. Your agent's curated briefing. "Here's what's alive for you."

**Live Pulse** (during unconference) — Real-time feed of extracted insights, not raw transcripts. "Session on cooperative governance just surfaced a connection to your interest in civic finance."

**The Archive** — Searchable, browsable history across convergences. Filter by year, state, theme, person. See how ideas evolved over time.

**Contribution** — Easy forms to add reflections, corrections, new connections. Voice input welcome. Agent assists with tagging and linking.

---

## Relationship to Existing Infrastructure

### Bonfire AI
- Conversation recording → transcription → knowledge graph ingestion
- Entity extraction and relationship mapping
- Being piloted at ETHBoulder 2026

### Clawsmos / Cosmos
- Agent swarm orchestration (current: Discord)
- Aaron's proposed evolution: purpose-built platform with roles
- The "cosmos" is the agent-side view of the same knowledge graph

### Habitat / Techne
- REA ontology maps to artifact lifecycle (Resource = artifact, Event = state change, Agent = participant/agent)
- $CLOUD credits could meter agent API usage
- Pattern library (seven-layer stack) informs system architecture
- Cooperative governance model for commons stewardship

---

## Open Design Questions

1. **Graph technology** — What backs the knowledge graph? (Neo4j, Dgraph, RDF/SPARQL, or lighter-weight?)
2. **Identity** — How do participants authenticate? (ENS? Email? Hybrid?)
3. **Privacy** — What's public vs. private in the commons? (Chatham House rule for sessions?)
4. **Governance** — Who stewards the commons long-term? (Cooperative? DAO? Informal?)
5. **Interop** — How does this connect to other knowledge graphs? (ActivityPub? AT Protocol? Linked Data?)
6. **Offline-first** — How does the platform work during events with spotty wifi?
7. **Sustainability** — What funds ongoing operation? ($CLOUD credits? Membership? Grants?)

---

*Living document. Evolves as the system takes shape.*
