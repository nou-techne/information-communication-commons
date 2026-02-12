# commons.id

> A living knowledge graph for convergence events

**Live:** [commons.id](https://commons.id) · [commons.id/app](https://commons.id/app) · [ethboulder.commons.id](https://ethboulder.commons.id)

---

## What It Is

commons.id captures what emerges when people converge. Contribute observations — session notes, ideas, commitments, people you met, questions still open. AI extracts the knowledge structure. The graph grows. Patterns emerge that no single participant could see alone.

Built for **ETHBoulder 2026** (Feb 13–16, Boulder, Colorado). Designed to work for any convergence.

## e/H-LAM/T/S

Knowledge is organized across seven observation dimensions, extending Douglas Engelbart's framework for augmenting human intellect:

| Dimension | Name | Lens |
|-----------|------|------|
| **e/** | Ecology | Where we are — place, environment, context |
| **H/** | Human | Who's here — people, relationships, dynamics |
| **L/** | Language | How we talk — vocabulary, frameworks, definitions |
| **A/** | Artifacts | What we're building — tools, code, infrastructure |
| **M/** | Methodology | How we work — governance, coordination, process |
| **T/** | Training | What we're learning — skills, transformation |
| **S/** | Sessions | Where convergence happens — unconference sessions emerging from participant interests |

Every contribution is classified across these dimensions using **REA grammar** (Resource, Event, Agent) — the same ontology used in accounting and supply chain systems, applied to knowledge.

## How It Works

1. **Contribute** — Write naturally about what you observed
2. **Extract** — AI breaks contributions into typed artifacts (ideas, proposals, commitments, questions, patterns, reflections) with REA classification and dimension tags
3. **Connect** — Artifacts link to each other through typed relationships, building a navigable knowledge graph
4. **Coordinate** — Signal what interests you. The system surfaces where energy is gathering
5. **Verify** — Every contribution is appended to a convergence chain (append-only hash chain) for integrity and replay

## Convergence Chain

Contributions are sequenced into an append-only hash chain. Each entry carries a sequence number, content hash, and parent hash. The chain can be verified, replayed to any point, and provides a tamper-evident record of the commons as it grew.

Genesis: `SHA-256('commons.id:genesis')`

## Architecture

### Seven-Layer Pattern Stack

Built on Techne's progressive design patterns. Each layer presupposes the layers beneath:

1. **Identity** — Types, IDs, taxonomies
2. **State** — Schemas, stores, validation
3. **Relationship** — Graph edges, associations
4. **Event** — Event sourcing, audit trails
5. **Flow** — Workflows, coordination signals
6. **Constraint** — Permissions, RLS, chain integrity
7. **View** — Pages, components, export formats

### Stack

- **Frontend:** React 18 · TypeScript · Vite · Tailwind CSS
- **Database:** Supabase (PostgreSQL + real-time + edge functions)
- **AI:** Claude API (extraction) · Gemini (session import)
- **Deployment:** GitHub Pages · Custom domains
- **Design:** No emoji. Lucide icons only, sparingly. Three-color system.

## Features

**Core**
- Multi-dimensional contribution system with AI extraction
- Interactive knowledge graph (2D/3D) with filtering and subgraph export
- Coordination signals — flame indicators on artifacts gathering interest
- Convergence chain with verification and replay slider
- Participant profiles with AI-extracted skills, interests, and matchmaking data

**Communication**
- Channels and threaded discussions
- Thread tagging, resolution, and consolidation workflows
- Real-time messages with reactions and markdown

**Infrastructure**
- Multi-convergence support with isolated data scopes
- Federation protocol with content-addressable storage
- Quality scoring, moderation, and curation tools
- Export: JSON, CSV, Markdown, HTML reports
- Full accessibility (WCAG 2.1 AA, keyboard navigation, screen reader support)
- Mobile-optimized with touch gestures

## Edge Functions

| Function | Purpose | Status |
|----------|---------|--------|
| `process-contribution` | Extract artifacts from natural language contributions | Active |
| `process-profile` | Extract structured profiles from self-introductions | Active |
| `extract-transcript` | Process session transcripts | Planned |

## Project Structure

```
information-communication-commons/
├── app-src/              # React application source
│   └── src/
│       ├── components/   # UI components
│       ├── pages/        # Route pages
│       ├── hooks/        # Custom React hooks
│       ├── lib/          # Utilities, API client, graph logic
│       ├── stores/       # Client-side state
│       ├── types/        # TypeScript definitions
│       └── styles/       # Design tokens, CSS
├── supabase/
│   ├── migrations/       # Database migrations (001–036)
│   └── functions/        # Edge functions
├── protocols/            # Emergent coordination protocols
├── journal/              # Sprint journals and changelog
├── docs/                 # Specifications and audits
├── app/                  # Built application (deployed via GitHub Pages)
└── ethboulder/           # ETHBoulder convergence landing page
```

## Setup

```bash
git clone https://github.com/nou-techne/information-communication-commons.git
cd information-communication-commons/app-src
npm install
cp .env.example .env  # Add your Supabase credentials
npm run dev
```

### Environment

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Deploy

```bash
npm run build
cp -r dist/* ../app/
git add -A && git commit -m "deploy" && git push
```

## Emergent Protocols

Coordination patterns recognized through practice on this project:

- **[Sprint Queuing](protocols/sprint-queuing.md)** — Human-agent coordination for reactive issue triage and resolution

## Credits

**Built by:** Nou, Techne Collective Intelligence Agent
**Steward:** Todd Youngblood, RegenHub LCA
**First convergence:** ETHBoulder 2026 (Feb 13–16)
**Framework:** e/H-LAM/T/S (extending Engelbart, 1962)
**Architecture:** Seven Progressive Design Patterns · REA Ontology
**Partners:** Aaron Gabriel (co-owner) · Bonfire AI (tech)

## License

MIT — see [LICENSE](LICENSE)

---

**Built with intelligence amplification, not artificial intelligence.**
*commons.id — February 2026*
