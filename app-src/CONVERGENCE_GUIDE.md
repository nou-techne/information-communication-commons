# commons.id — Convergence Setup Guide

How to create and configure a new convergence on the commons.id platform.

## What is a Convergence?

A **convergence** is a coordination space — an event, a cooperative, a DAO, a project.
commons.id provides shared infrastructure (chain, contributions, identity) that each
convergence configures for its own context.

**Two types:**
- **Event convergence** — time-bounded (e.g., ETHBoulder 2026)
- **Perpetual convergence** — ongoing (e.g., Techne cooperative)

## Quick Start

### 1. Create the Database Row

```sql
INSERT INTO convergences (id, name, description, convergence_type)
VALUES (
  gen_random_uuid(),
  'Your Convergence Name',
  'Brief description',
  'event'  -- or 'perpetual'
);
```

### 2. Configure Theme

Set visual identity via the convergence row:

| Column | Description | Example |
|--------|-------------|---------|
| `theme_primary` | Primary accent color | `#a6ed2a` |
| `theme_bg` | Background color | `#080c16` |
| `theme_surface` | Card/surface color | `#0a101d` |
| `theme_border` | Border color | `#1d2839` |
| `logo_text` | Logo text | `MyEvent` |
| `logo_accent` | Logo accent suffix | `.commons.id` |

### 3. Initialize the Chain

Run the genesis script to create Entry #0:

```typescript
import { appendEntry } from './lib/chain-engine'

await appendEntry({
  convergenceId: YOUR_CONVERGENCE_ID,
  eventType: 'convergence.created',
  aggregateId: YOUR_CONVERGENCE_ID,
  aggregateType: 'convergence',
  payload: {
    name: 'Your Convergence',
    type: 'event',
    description: 'What this convergence is about',
    startDate: '2026-03-01T00:00:00Z',
  },
  patternLayer: 1,
  actorId: 'founder',
})
```

### 4. Add Members

```typescript
await appendEntry({
  convergenceId: YOUR_CONVERGENCE_ID,
  eventType: 'people.member.created',
  aggregateId: MEMBER_UUID,
  aggregateType: 'member',
  payload: { name: 'Alice', memberNumber: '001', role: 'founder' },
  patternLayer: 1,
  actorId: 'genesis',
})
```

### 5. Configure Dimensions

Dimensions define the knowledge graph categories. Update the `dimensions` JSONB column:

```json
{
  "e": { "tag": "eco", "label": "Ecology" },
  "H": { "tag": "human", "label": "People" },
  "A": { "tag": "artifacts", "label": "Projects" }
}
```

## Architecture

```
┌─────────────────────────────────────────────┐
│                  commons.id                  │
├─────────────┬──────────────┬────────────────┤
│  Chain      │  Identity    │  Contributions │
│  (merkle)   │  (members)   │  (workflow)    │
├─────────────┴──────────────┴────────────────┤
│              Supabase (Postgres + Auth)      │
└─────────────────────────────────────────────┘
```

**Key modules:**
- `chain-engine.ts` — Append-only merkle chain (hash-linked events)
- `contribution-parser.ts` — Natural language contribution parsing
- `contribution-workflow.ts` — Submission → validation → approval pipeline
- `patronage-engine.ts` — Weighted patronage calculation + surplus allocation
- `venture-engine.ts` — Venture + royalty management
- `education-engine.ts` — Learning paths + glossary

## Seven-Layer Pattern Stack

Every chain event maps to one of seven layers:

1. **Identity** — Who/what exists
2. **State** — Current attributes
3. **Relationship** — Connections between entities
4. **Event** — What happened
5. **Flow** — Value/information movement
6. **Constraint** — Rules and governance
7. **View** — Derived presentations

## For Cooperatives

If your convergence is a cooperative (like Techne), you get:
- **Patronage accounting** — Track contributions, compute allocations (IRC 704(b))
- **Capital accounts** — Chain-sourced balances, K-1 export
- **Governance** — Period close proposals, democratic voting
- **Venture royalties** — Revenue sharing with vesting schedules
- **Compliance** — Automated checks for Subchapter K requirements

## Support

- GitHub: https://github.com/nou-techne/information-communication-commons
- Architecture: See `tio/techne-commons-id/ARCHITECTURE.md`
