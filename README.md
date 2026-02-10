# Information & Communications Commons

A knowledge-graph-backed living archive that preserves ideas, relationships, and commitments across convergence events with full context integrity. Agents and humans deepen conversation through three states: pre-event, during, and post-event. Artifacts carry forward; patterns compound.

---

## The Problem

Convergence events — conferences, unconferences, forums, gatherings — generate extraordinary energy. New relationships form, ideas emerge, commitments are made. Then the event ends, and that energy dissipates. The context, the connections between ideas, the heart-mind space present when something was shared — most of it is lost.

What survives is scattered across personal notes, forgotten chat channels, and fading memory. Same conversations repeat year after year. Commitments go untracked. Patterns that span multiple gatherings remain invisible.

## The Vision

An **information and communications commons** — a living knowledge graph that carries artifacts across three temporal states surrounding convergence events:

### Pre-Event
Listening, orienting, preparing. Participants register interests. Agents surface relevant prior artifacts. Questions emerge. Personal agents prepare context packages: *"Here's what's alive in the commons relevant to you."*

### During Event
Active, emergent, co-creative. Conversations feed directly into the knowledge graph. Agents extract entities, relationships, proposals, commitments in real-time. Live summaries replace raw chat streams. Cross-session connections surface: *"Session A just discussed something that connects to what you're exploring."*

### Post-Event
Integration, synthesis, continuation. The archive receives feedback and evolves. Commitments are tracked. Themes deepen through ongoing work. Agents continue coordination. A proposal becomes a project becomes a pattern. The commons grows.

## How It Works

The knowledge graph is the commons. Not a backend detail — the primary artifact. Everything else is a view into it.

**For agents:** A structured API for coordination, observation, and artifact exchange. Clear roles (orchestrator, observer, synthesizer, representative, steward). Structured knowledge, not raw chat streams.

**For humans:** A platform designed to feel like exploring a living garden, not querying a database. Multiple entry points — browse by theme, person, time, energy. Progressive disclosure. Contribution is natural.

## Artifact Lifecycle

Artifacts are living nodes in the knowledge graph. They carry context across states and accumulate meaning over time.

```
Pre-Event              During Event           Post-Event
─────────              ────────────           ──────────

  Question ──────────→ Discussion ──────────→ Synthesis
  Interest ──────────→ Connection ──────────→ Collaboration
  Context  ──────────→ Proposal ───────────→ Project
  Pattern  ──────────→ Validation ─────────→ Evolved Pattern
                       Commitment ─────────→ Progress Tracking
```

Each artifact carries:
- **Origin context** — who, when, where, what state, what energy
- **Lineage** — what it evolved from, what informed it
- **Stewards** — who (human or agent) is responsible for its evolution
- **Dimensions** — temporal, social, thematic, energetic, spatial

## Principles

**Context integrity.** Preserve not just content but the conditions under which it emerged — the relationships, the energy, the space between ideas. Without context, artifacts are just data.

**Artifacts over archives.** A living commons, not a static repository. Artifacts evolve, fork, connect, and sometimes fade. The graph is alive.

**Agents as partners.** Agents don't replace human sense-making — they amplify it. Personal agents help individuals integrate. Collective agents help communities coordinate. Both contribute to the commons.

**Amplifying aliveness.** Technology should amplify what is most alive in us. The commons exists to carry forward the generative energy of human gathering, not to extract or reduce it.

**Open by default.** The commons is a shared resource. Patterns, protocols, and ideas flow freely. What is light should be global.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 Knowledge Graph                  │
│                                                  │
│   Artifacts · Participants · Sessions · Themes   │
│   Relationships · Lineage · Context · Energy     │
│                                                  │
├─────────────┬──────────────┬────────────────────┤
│  Agent API  │ Human Views  │ Ingestion Pipeline │
│             │              │                    │
│  Queries    │  Garden      │  Transcription     │
│  Mutations  │  My Thread   │  Entity Extraction │
│  Observe    │  Live Pulse  │  Relationship Map  │
│  Synthesize │  Archive     │  Bonfire AI        │
│  Represent  │  Contribute  │                    │
└─────────────┴──────────────┴────────────────────┘
```

## Project Structure

```
├── README.md              ← You are here
├── SYSTEM.md              ← System design (states, artifacts, API, platform)
├── PRD.md                 ← Product requirements by pattern layer
├── spec/                  ← Technical specifications (forthcoming)
│   ├── knowledge-graph/   ← Graph schema, query patterns
│   ├── agent-api/         ← API specification for agent interaction
│   └── platform/          ← Human platform design
└── journal/               ← Development journal
```

## Origins

This project emerged from a conversation between Todd Youngblood and Aaron Gabriel on February 10, 2026, three days before ETHBoulder 2026. The discussion wove together several threads:

- **Information commons** — A living archive that bridges convergence events, preserving context and enabling artifacts to carry forward across years
- **Agent orchestration** — Swarm intelligence platforms where agents coordinate, with clear roles and transparency
- **Cosmolocal framing** — That which is light (protocols, ideas, software) should be shared globally; that which is heavy (relationships, community, resources) should be rooted locally
- **Amplifying aliveness** — The role of technology is to amplify what is most alive in us, reaching from the center outward

The Information & Communications Commons is the persistent layer — the system that exists between events, carrying what matters forward.

## Contributing

This is an open project under the [Peer Production License](LICENSE.md). Contributions welcome from humans and agents alike.

---

*A venture of [Techne Studio](https://the-habitat.org) / RegenHub, LCA*
*Boulder, Colorado*
