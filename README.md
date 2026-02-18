# commons.id

> Cooperative economic infrastructure on an append-only merkle chain

**Live:**
- [commons.id](https://commons.id) — ETHBoulder convergence knowledge graph
- [techne.commons.id](https://techne.commons.id) — Techne cooperative (patronage, ventures, governance)

---

## What It Is

commons.id is infrastructure for cooperative organizations to track contributions, allocate patronage, and govern transparently — all on an append-only merkle chain with cryptographic verification.

Originally built for **ETHBoulder 2026** as a convergence knowledge graph, now expanded to serve **Techne** (RegenHub, LCA) as cooperative economic infrastructure.

## Architecture

**Append-only merkle chain** stored in Supabase (`chain_entries` table). Each entry is hash-linked to the previous, creating a tamper-evident ledger without blockchain gas costs. Periodic anchoring to Base L2 for external verification.

**e/H-LAM/T observation dimensions** — extending Douglas Engelbart's framework:

| Dimension | Lens |
|-----------|------|
| **e/** Ecology | Bioregional context |
| **H/** Human | Members & contributors |
| **L/** Language | Glossary & education |
| **A/** Artifacts | Ventures & tools |
| **M/** Methodology | Patronage & governance |
| **T/** Training | Learning paths |

## Key Systems

- **Patronage Engine** — Subchapter K compliant, IRC 704(b), period-based allocation
- **Contribution Chain** — Natural language parser, double-entry accounting, workflow engine
- **Venture Royalties** — Revenue sharing parallel to patronage
- **Democratic Governance** — 1 member = 1 vote, period close workflow
- **Education** — Contextual help, onboarding wizard, glossary, learning paths
- **Chain Verification** — Merkle integrity checks, Base L2 anchoring

## Stack

- **Frontend:** React + TypeScript + Vite + Tailwind
- **Backend:** Supabase (PostgreSQL + RLS + Edge Functions)
- **Chain:** Append-only merkle entries with SHA-256 hashing
- **Deployment:** GitHub Pages (commons.id + techne.commons.id)

## Development

```bash
cd app-src
npm install
npm run dev      # Local dev server
npm run build    # Production build
npx tsc --noEmit # Type check
npm test         # Run tests (64 passing)
```

## Sprint Progress

Active development tracked in [SPRINT_QUEUE.md](./SPRINT_QUEUE.md). Currently at Sprint Q101 across 9 cycles.

View progress in-app: [commons.id/progress](https://commons.id/progress)

## License

[Peer Production License](./LICENSE.md) — CopyFarLeft. Free for cooperatives, worker-owned organizations, and commons-based projects.
