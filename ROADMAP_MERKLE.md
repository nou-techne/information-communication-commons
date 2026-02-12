# ROADMAP_MERKLE — Merkle Chain for Knowledge Graph Replay

**Feature:** Append-only Merkle chain on contributions enabling numbered state changes and full graph replay.  
**Start:** Sprint M1 | **End:** Sprint M12 | **Method:** Ebb-flow (6 flow + 4 ebb + 2 view)  
**Constraint:** Every sprint completable in <10 minutes. Zero blockers. Every sprint = one commit + push.

---

## TIO Role Assignments

| Sprint | Layer | TIO Role | Description |
|--------|-------|----------|-------------|
| M1 | 1. Identity | Schema Architect | Merkle chain schema: `seq`, `chain_hash`, `parent_hash` on contributions |
| M2 | 2. State | Backend Engineer | Postgres trigger: auto-compute chain_hash on INSERT |
| M3 | 2. State | Backend Engineer | Backfill existing contributions with sequential chain hashes |
| M4 | 3. Relationship | Integration Engineer | Graph snapshot function: reconstruct graph state at any seq |
| M5 | 4. Event | Event Systems Engineer | Chain validation function: verify integrity from genesis to HEAD |
| M6 | 5. Flow | Workflow Engineer | Replay API endpoint: stream contributions with chain proof |
| M7 | 6. Constraint | Compliance & Security Engineer | Immutability constraints: prevent UPDATE/DELETE on chain columns |
| M8 | 7. View | Frontend & DevOps Engineer | Chain status component: current HEAD seq, hash, integrity badge |
| M9 | 7. View | Frontend & DevOps Engineer | Graph replay slider UI: scrub through contribution history |
| M10 | — | QA & Test Engineer | Ebb: verify chain integrity, test replay at boundaries |
| M11 | — | Technical Lead | Ebb: optimize chain queries, add indexes for replay performance |
| M12 | — | Product Engineer | Ebb: README docs, chain explorer in dashboard, deploy verification |

---

## Architecture

```
contribution[n]:
  seq:          SERIAL (monotonic, gapless via advisory lock)
  chain_hash:   SHA-256(seq || contribution_id || content_hash || parent_hash)
  parent_hash:  chain_hash[n-1] (genesis: SHA-256('commons.id:genesis'))

Replay:
  GET /replay?from=0&to=N → ordered contributions with chain proof
  Graph state at seq N = apply all extractions from seq 1..N
```

## Acceptance Criteria

- Every new contribution automatically receives next seq + computed chain_hash
- Chain is verifiable: any observer can recompute all hashes from genesis
- Graph can be replayed to any historical state via seq number
- Chain columns are immutable after INSERT (no UPDATE/DELETE)
- UI shows current chain HEAD with integrity status
- Replay slider reconstructs graph visually at any point in time
