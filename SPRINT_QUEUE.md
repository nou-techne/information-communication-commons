# Sprint Queue

**Method:** TIO-aligned sprint queue. Sprints queued with `+++` prefix.
**Versioning:** Each completed sprint increments patch version. Breaking changes increment minor.
**Current Version:** 1.1.1

---

## Queue

| # | Sprint | TIO Role(s) | Status | Queued | Completed |
|---|--------|-------------|--------|--------|-----------|
| Q1 | TIO role artifacts for ETHBoulder commons.id introduction | All TIO roles | DONE | 2026-02-13 16:44 | 2026-02-13 16:52 |
| Q2 | Supabase performance and security investigation + risk-ranked plan | Compliance & Security (06) | DONE (plan written) | 2026-02-13 16:48 | 2026-02-13 16:51 |
| Q3 | Holistic seven-layer architecture diagram | Technical Lead (00) | DONE | 2026-02-13 16:51 | 2026-02-13 16:52 |
| Q4 | Server (Hetzner) performance and security investigation + risk-ranked plan | Compliance & Security (06) | DONE (plan written) | 2026-02-13 16:52 | 2026-02-13 16:53 |
| Q5 | Copy tio/ethboulder26-commons-id to public repo | Frontend & DevOps (07) | DONE | 2026-02-13 16:54 | 2026-02-13 16:54 |
| Q6 | Optimize /live for TV/large screen view density | Frontend & DevOps (07) | DONE | 2026-02-13 16:55 | 2026-02-13 16:57 |
| Q7 | Move Chain Replay to slimline bottom panel | Frontend & DevOps (07) | DONE | 2026-02-13 17:04 | 2026-02-13 17:06 |
| Q8 | Holistic Live page redesign for visual clarity | Frontend & DevOps (07) | DONE | 2026-02-13 17:10 | 2026-02-13 17:12 |
| Q9 | DB reset for ETHBoulder (truncate contributions/artifacts/relationships) | Data & Integration (04) | DONE | 2026-02-13 17:14 | 2026-02-13 17:16 |
| Q10 | Sync ETHBoulder sessions from app.ethboulder.xyz to commons.id | Data & Integration (04) | DONE | 2026-02-13 18:07 | 2026-02-13 18:12 |
| Q11 | Mobile-optimized footer | Frontend & DevOps (07) | DONE | 2026-02-13 18:12 | 2026-02-13 18:18 |
| Q12 | Sessions in /S dimension + Explore + Live pages | Frontend & DevOps (07) | DONE | 2026-02-13 18:12 | 2026-02-13 18:20 |
| Q13 | Fix /S Sessions dimension tag mismatch + rewrite SessionsView | Frontend & DevOps (07) | DONE | 2026-02-13 18:27 | 2026-02-13 18:30 |
| Q14 | Graph mirroring report: Bonfires.ai × commons.id | Research & Strategy (01) | DONE | 2026-02-13 18:32 | 2026-02-13 18:34 |
| Q15 | Bonfires.ai → commons.id episode mirroring via contribution pipeline | Data & Integration (04) | DONE | 2026-02-13 19:35 | 2026-02-13 19:45 |
| Q16 | Investigate edge function failures + re-run failed contributions | Technical Lead (00) | DONE | 2026-02-13 19:39 | 2026-02-13 19:55 |
| Q17 | Don't write to merkle chain on extraction errors — retry until success | Technical Lead (00) | DONE | 2026-02-13 19:42 | 2026-02-13 19:55 |
| Q18 | Fix broken convergence chain + add queuing to Bonfires sync | Technical Lead (00) | DONE | 2026-02-13 19:45 | 2026-02-13 20:00 |
| Q19 | Investigate /S Sessions dimension not showing synced sessions | Frontend & DevOps (07) | DONE | 2026-02-13 19:50 | 2026-02-13 20:00 |
| Q20 | Auto-retry failed contribution entries | Technical Lead (00) | DONE | 2026-02-13 23:54 | 2026-02-14 00:10 |
| Q21 | Investigate Channels page readiness | Frontend & DevOps (07) | DONE | 2026-02-13 23:55 | 2026-02-14 00:15 |
| Q22 | Rate-limit 3D graph refresh to 5s throttle | Frontend & DevOps (07) | DONE | 2026-02-14 00:03 | 2026-02-14 00:10 |
| Q23 | Enable Channels feature — seed data, missing tables, nav, fixes | Perceive + Connect | DONE | 2026-02-15T19:03Z | 2026-02-15T19:15Z |
| Q24 | Communication mode analysis — H2H, H2A, A2A distinct channels | Perceive + Connect | DONE | 2026-02-15T19:04Z | 2026-02-15T19:25Z |
| Q25 | Add Nous etymology and introduction to GitHub README | Perceive | DONE | 2026-02-15T19:10Z | 2026-02-15T19:28Z |
| Q26 | Fix channel/thread/message creation — auth→participant ID mapping | Perceive + Connect | DONE | 2026-02-15T19:20Z | 2026-02-15T19:30Z |
| Q27 | Sync all Bonfires.ai episodes to commons.id with merkle chain, no dupes | Perceive + Connect | DONE | 2026-02-15T19:21Z | 2026-02-15T19:35Z |
| Q28 | Token consumption tracking with sunrise/sunset reports | Perceive + Ground | DONE | 2026-02-15T21:45Z | 2026-02-15T21:48Z |
| Q29 | Investigate/remediate contribution submission — edge function extraction | Perceive + Connect | DONE | 2026-02-15T23:15Z | 2026-02-15T23:30Z |

---

## Changelog

### v1.1.1 — 2026-02-13 (ETHBoulder Day 1)

- Q1: 21 TIO artifacts (10 reflections + 10 visuals + README) created in tio-ethboulder26/
- Q2: Supabase security plan at docs/PERFORMANCE_SECURITY_PLAN.md (3 low, 3 medium, 3 high risk items)
- Q3: Seven-layer architecture diagram at tio-ethboulder26/commons-id-architecture.md
- Q4: Server security plan at docs/SERVER_SECURITY_PLAN.md (3 critical, 4 medium, 3 high risk items)
- Q5: All artifacts pushed to public repo (commit 773d262)
- Q6: Live.tsx view density optimization for TV display
- Q7: Chain Replay relocated from graph section to slimline bottom panel (label + ChainStatus + slider inline)

- Q15: Five additional Techne Artizen Fund posters — further design exploration
  - TIO Role: Perceive + Connect
  - Queued: 2026-02-14T08:22Z
  - Status: COMPLETE · 2026-02-14T08:29Z
| Q30 | Investigate white pages on commons.id/app/* when logged in | Perceive | DONE | 2026-02-15T23:32Z | 2026-02-15T23:38Z |
| Q31 | W3C lowest-risk standards integration across commons.id, /ethboulder, /app | Compliance & Security (06) | DONE | 2026-02-17T15:41Z | 2026-02-17T15:47Z |
| Q32 | Supabase migration — `chain_entries` table + `convergence_type` column | Technical Lead (00) | DONE | 2026-02-18T04:11Z | 2026-02-18T05:15Z |
| Q33 | `types/chain.ts` — ChainEntry, ChainEventType, typed payloads | Technical Lead (00) | DONE | 2026-02-18T04:11Z | 2026-02-18T04:11Z |
| Q34 | `lib/chain-engine.ts` — computeHash, appendEntry, verifyChain, queryChain | Technical Lead (00) | DONE | 2026-02-18T04:11Z | 2026-02-18T04:11Z |
| Q35 | Genesis script — seed Techne convergence + 8 founding members | Technical Lead (00) | DONE | 2026-02-18T04:11Z | 2026-02-18T05:16Z |
| Q36 | ConvergenceProvider context + convergence picker at `/app/` | Frontend & DevOps (07) | DONE | 2026-02-18T04:11Z | 2026-02-18T05:17Z |
| Q37 | Replace hardcoded convergence ID — all pages read from context | Frontend & DevOps (07) | DONE | 2026-02-18T04:11Z | 2026-02-18T04:11Z |
| Q38 | Techne theme in convergence config (copper/alpine/gold) | Frontend & DevOps (07) | DONE | 2026-02-18T04:11Z | 2026-02-18T05:18Z |
| Q39 | Chain explorer page — browse chain entries for any convergence | Frontend & DevOps (07) | DONE (UI ready) | 2026-02-18T04:11Z | 2026-02-18T04:11Z |
| Q40 | Contribution chain entry types + five-stage lifecycle schema | Technical Lead (00) | DONE | 2026-02-18T04:19Z | 2026-02-18T04:19Z |
| Q41 | NL contribution parser (rule-based + LLM extraction → typed payloads) | Technical Lead (00) | DONE | 2026-02-18T04:19Z | 2026-02-18T04:25Z |
| Q42 | Contribution lifecycle workflow (state machine operations) | Technical Lead (00) | DONE | 2026-02-18T04:25Z | 2026-02-18T04:26Z |
| Q43 | Double-entry transaction engine on contribution approval | Technical Lead (00) | DONE | 2026-02-18T04:26Z | 2026-02-18T04:26Z |
| Q44 | Contribution submission form with NL parser preview | Frontend & DevOps (07) | DONE | 2026-02-18T04:27Z | 2026-02-18T04:30Z |
| Q45 | Member contribution history view component | Frontend & DevOps (07) | DONE | 2026-02-18T04:30Z | 2026-02-18T04:32Z |
| Q46 | Cross-convergence participant linking (ETHBoulder ↔ Techne) | Data & Integration (04) | DONE | 2026-02-18T04:32Z | 2026-02-18T04:34Z |
| Q47 | Chain integrity verification script (cron-ready) | Technical Lead (00) | DONE | 2026-02-18T04:34Z | 2026-02-18T04:36Z |
| Q48 | Port PatronageFormulaEngine from habitat (variable weights) | Technical Lead (00) | DONE | 2026-02-18T04:40Z | 2026-02-18T04:40Z |
| Q49 | Period open/close chain entries + period lifecycle | Technical Lead (00) | DONE | 2026-02-18T04:40Z | 2026-02-18T04:40Z |
| Q50 | Allocation calculation → chain entries (formula inputs + outputs recorded) | Technical Lead (00) | DONE | 2026-02-18T04:45Z | 2026-02-18T04:45Z |
| Q51 | Compliance check entries (704b validator, double-entry checker) | Technical Lead (00) | DONE | 2026-02-18T04:45Z | 2026-02-18T04:45Z |
| Q52 | Member dashboard — capital account balance (computed from chain) | Frontend & DevOps (07) | DONE | 2026-02-18T04:50Z | 2026-02-18T04:50Z |
| Q53 | Allocation statements + K-1 data export | Technical Lead (00) | DONE | 2026-02-18T04:50Z | 2026-02-18T04:55Z |
| Q54 | Period close governance approval workflow | Technical Lead (00) | DONE | 2026-02-18T04:55Z | 2026-02-18T04:55Z |
| Q55 | On-chain hash anchoring (Base) for latest chain head | Technical Lead (00) | DONE (mock impl, includes contract reference) | 2026-02-18T04:55Z | 2026-02-18T04:54Z |
| Q56 | Venture registry chain entries (create, update, status, archive) | Technical Lead (00) | DONE | 2026-02-18T04:55Z | 2026-02-18T04:58Z |
| Q57 | Royalty agreement types + chain entries (vesting, dilution, shares) | Technical Lead (00) | DONE | 2026-02-18T04:55Z | 2026-02-18T04:58Z |
| Q58 | Revenue event chain entries (received, allocated, distributed) | Technical Lead (00) | DONE | 2026-02-18T04:55Z | 2026-02-18T04:58Z |
| Q59 | Royalty vesting engine (linear, cliff, milestone, batch processing) | Technical Lead (00) | DONE | 2026-02-18T04:55Z | 2026-02-18T04:58Z |
| Q60 | Venture portfolio page (filterable, revenue metrics, status badges) | Frontend & DevOps (07) | DONE | 2026-02-18T04:58Z | 2026-02-18T05:00Z |
| Q61 | Member royalties dashboard (vesting progress, earned/pending) | Frontend & DevOps (07) | DONE | 2026-02-18T04:58Z | 2026-02-18T05:00Z |
| Q62 | Royalty agreement builder (shares, vesting timeline, governance) | Frontend & DevOps (07) | DONE | 2026-02-18T04:58Z | 2026-02-18T05:00Z |
| Q63 | Venture revenue reconciliation (import, auto-allocate, reports) | Technical Lead (00) | DONE | 2026-02-18T04:58Z | 2026-02-18T05:00Z |
| Q64 | Education content schema (glossary, paths, help contexts) | Technical Lead (00) | DONE | 2026-02-18T05:02Z | 2026-02-18T05:05Z |
| Q65 | Contextual help system (tooltip/popover component) | Frontend & DevOps (07) | DONE | 2026-02-18T05:05Z | 2026-02-18T05:08Z |
| Q66 | Learning path engine + glossary chain entries | Technical Lead (00) | DONE | 2026-02-18T05:08Z | 2026-02-18T05:12Z |
| Q67 | Seed core glossary terms (capital account, patronage, K-1) | Technical Lead (00) | DONE | 2026-02-18T05:08Z | 2026-02-18T05:12Z |
| Q68 | Member onboarding wizard (interactive step-by-step) | Frontend & DevOps (07) | DONE | 2026-02-18T05:12Z | 2026-02-18T05:15Z |
| Q69 | In-app education hub (/app/learn) | Frontend & DevOps (07) | DONE | 2026-02-18T05:15Z | 2026-02-18T05:18Z |
| Q70 | Community writer toolkit (editor with style guide) | Frontend & DevOps (07) | DONE | 2026-02-18T05:18Z | 2026-02-18T05:22Z |
| Q71 | Training analytics dashboard | Frontend & DevOps (07) | DONE | 2026-02-18T05:22Z | 2026-02-18T05:25Z |
| Q72 | Unified member profile (tabbed: patronage, royalties, governance, learning) | Frontend & DevOps (07) | DONE | 2026-02-18T05:30Z | 2026-02-18T05:32Z |
| Q73 | Notification engine (chain-event-driven, templates, mark read) | Technical Lead (00) | DONE | 2026-02-18T05:32Z | 2026-02-18T05:35Z |
| Q74 | Audit trail viewer (filterable timeline, CSV export, payload inspect) | Frontend & DevOps (07) | DONE | 2026-02-18T05:35Z | 2026-02-18T05:38Z |
| Q75 | Performance optimization (LRU cache, pagination, prefetch) | Technical Lead (00) | DONE | 2026-02-18T05:38Z | 2026-02-18T05:40Z |
| Q76 | Public venture portfolio (non-auth recruitment surface) | Frontend & DevOps (07) | DONE | 2026-02-18T05:40Z | 2026-02-18T05:42Z |
| Q77 | Ecosystem interop (Bonfires, ETHBoulder, revenue webhooks) | Data & Integration (04) | DONE | 2026-02-18T05:42Z | 2026-02-18T05:44Z |
| Q78 | Mobile responsiveness (breakpoint hooks, touch targets, audit) | Frontend & DevOps (07) | DONE | 2026-02-18T05:44Z | 2026-02-18T05:46Z |
| Q79 | Launch checklist (automated readiness verification) | Technical Lead (00) | DONE | 2026-02-18T05:46Z | 2026-02-18T05:48Z |
| Q80 | Fix convergences.slug column + migration (test fix) | Schema Architect (01) | DONE | 2026-02-18T05:30Z | 2026-02-18T05:31Z |
| Q81 | Chain engine unit tests (computeHash, types — 7 tests) | QA Test Engineer | DONE | 2026-02-18T05:31Z | 2026-02-18T05:32Z |
| Q82 | Patronage engine unit tests (formula, allocation, IRC 1385 — 8 tests) | QA Test Engineer | DONE | 2026-02-18T05:32Z | 2026-02-18T05:33Z |
| Q83 | ErrorBoundary + AsyncDataGuard (graceful degradation) | Frontend & DevOps (07) | DONE | 2026-02-18T05:33Z | 2026-02-18T05:34Z |
| Q84 | Coordinator review queue (pending, validate, value, approve) | Frontend & DevOps (07) | DONE | 2026-02-18T05:34Z | 2026-02-18T05:35Z |
| Q85 | REST API endpoints (chain, contribution, member) | Integration (03) | DONE | 2026-02-18T05:35Z | 2026-02-18T05:36Z |
| Q86 | Convergence setup guide (README for new deployments) | Technical Writer (08) | DONE | 2026-02-18T05:36Z | 2026-02-18T05:37Z |
| Q87 | Integration test — full lifecycle (NL→parse→patronage→allocate — 3 tests) | QA Test Engineer | DONE | 2026-02-18T05:37Z | 2026-02-18T05:38Z |
| Q88 | Wire all new pages into App.tsx router (7 routes added) | Frontend & DevOps (07) | DONE | 2026-02-18T05:45Z | 2026-02-18T05:46Z |
| Q89 | Techne-specific nav items (ventures, learn, queue, audit) | Frontend & DevOps (07) | DONE | 2026-02-18T05:46Z | 2026-02-18T05:47Z |
| Q90 | Build verification — tsc clean, vite build succeeds (4.5s) | Technical Lead (00) | DONE | 2026-02-18T05:47Z | 2026-02-18T05:48Z |
| Q91 | Supabase RPC audit — core RPCs verified, fallbacks in place | Technical Lead (00) | DONE | 2026-02-18T05:48Z | 2026-02-18T05:49Z |
| Q92 | Seed sample contribution on live chain (entries #9-10 verified) | Technical Lead (00) | DONE | 2026-02-18T05:49Z | 2026-02-18T05:50Z |
| Q93 | App config — environment detection + feature flags per mode | Technical Lead (00) | DONE | 2026-02-18T05:50Z | 2026-02-18T05:51Z |
| Q94 | Pre-deploy checklist script (8 checks, all passing) | Technical Lead (00) | DONE | 2026-02-18T05:51Z | 2026-02-18T05:52Z |
| Q95 | Production build verified — clean tsc + vite build | Frontend & DevOps (07) | DONE | 2026-02-18T05:52Z | 2026-02-18T05:53Z |
| Q96 | Fix GitHub Pages SPA routing (404.html + index.html redirect) | Frontend & DevOps (07) | DONE | 2026-02-18T13:50Z | 2026-02-18T13:52Z |
| Q97 | Convergence switcher UI (ETHBoulder ↔ Techne) | Frontend & DevOps (07) | DONE | 2026-02-18T13:52Z | 2026-02-18T13:54Z |
| Q98 | Chain status widget (live entry count, members, contributions) | Frontend & DevOps (07) | DONE | 2026-02-18T13:54Z | 2026-02-18T13:56Z |
| Q99 | Sprint progress dashboard (/progress — all 9 cycles visualized) | Frontend & DevOps (07) | DONE | 2026-02-18T13:56Z | 2026-02-18T14:00Z |
| Q100 | Techne landing page (/techne — stats, model, navigation) | Frontend & DevOps (07) | DONE | 2026-02-18T14:00Z | 2026-02-18T14:04Z |
| Q101 | Member directory (/members — founding members from chain) | Frontend & DevOps (07) | DONE | 2026-02-18T14:15Z | 2026-02-18T14:18Z |

---

### v1.2.0 — 2026-02-18 (Cycle 2: Contribution Chain — Ebb)

**Q40: Contribution Lifecycle Foundation**
- Complete TypeScript types for five-stage lifecycle (Created → Submitted → Validated → Valued → Approved/Rejected)
- All seven event payloads: ContributionCreated, Submitted, Validated, Valued, Approved, Rejected, Voided
- State machine: CONTRIBUTION_LIFECYCLE_TRANSITIONS with validation helpers
- Chain projection helpers: buildContributionView(), getMemberContributions(), getContributionsByState()
- Comprehensive documentation: tio/techne-commons-id/docs/CONTRIBUTION_LIFECYCLE.md
- Foundation ready for NL parser (Q41), workflow automation (Q42), and double-entry integration (Q43)
- Commit: 5f2940a (app-src), bb19a47 (tio)

**Q41: NL Contribution Parser**
- LLM-powered extraction via OpenRouter (Claude 3.5 Sonnet)
- Parses free-form text → structured contribution (title, category, effort, impact)
- Confidence scoring (0.0-1.0): auto-submit at ≥0.85, manual review below
- Batch parsing for meeting notes / multiple contributions
- Integration modules: contribution-parser.ts + contribution-workflow.ts
- submitContributionFromNL(): parse → create → optionally submit in one call
- Preview mode for UI forms (no chain writes)
- Cost: ~$0.003/contribution (~$0.30/month for 100 contributions)
- Ready for chat bot integration (Discord/Telegram), voice notes, and form auto-fill
- Documentation: tio/techne-commons-id/docs/NL_CONTRIBUTION_PARSER.md
- Commit: 2aa19e2 (app-src), ef45dfc (tio)

**Q42: Contribution Lifecycle Workflow**
- Workflow engine (`contribution-lifecycle-workflow.ts`):
  - Atomic transitions for Validate, Value, Approve, Reject, Void
  - Automatic double-entry transaction creation on Approval
  - Automatic compensating transaction on Void (rollback)
  - Auto-validation logic (trusted domains: GitHub, Notion, etc.)
- Orchestrator (`contribution-orchestrator.ts`):
  - `fastTrackApprove()`: Validate → Value → Approve in one call (preserves audit trail)
  - `batchValidateSubmitted()`: Bulk processing for coordinators
  - `getReviewQueue()`: Dashboard data source for pending items
- Documentation: `tio/techne-commons-id/docs/CONTRIBUTION_WORKFLOW.md`
- Commit: (latest)

### v1.3.0 — 2026-02-18 (Cycle 3: Patronage Engine — Ebb)

**Q48: Patronage Formula Engine (ported from habitat)**
- PatronageFormulaEngine class with variable weights (labor 1.0, expertise 1.5, capital 1.0, relationship 0.5)
- Reads approved ContributionViews from chain, maps NL categories → patronage categories
- IRC 1385 compliant: min 20% cash distribution rate enforced
- verifyAllocations(): 4 invariants (sum=surplus, cash+retained=total, rate, shares=1.0)
- MultiPeriodAccumulator for cross-period patronage tracking
- runAndRecord(): writes allocation chain entries + optional double-entry transactions

**Q49: Period Lifecycle**
- openPeriod()/closePeriod(): treasury.period.opened/closed chain entries
- Single-open constraint (only one period open at a time per convergence)
- Date overlap prevention
- getOpenPeriod(), getAllPeriods(), getPeriodView(): chain projections
- getContributionsForPeriod(): filter approvals by period

**Q50: Allocation Chain Recording**
- Implemented within Q48's runAndRecord():
  - agreements.allocation.created: formula version, weights, surplus, cashRate, counts
  - agreements.allocation.approved: per-member allocations (memberId, amount, share)
  - Optional automatic double-entry transaction posting per member

**Q51: Compliance Engine**
- 6 compliance checks recorded as chain entries (compliance.check.passed/failed):
  1. double_entry_balance — all transactions have valid amounts + trial balance
  2. approval_transaction_match — every approval linked to a posted transaction
  3. void_compensation_match — voided approvals have compensating transactions
  4. 704b_cash_rate — cash rates ≥ 20% (IRC 1385)
  5. 704b_capital_accounts — every approval has validation + valuation records
  6. chain_integrity — full merkle hash verification
- runComplianceSuite(): runs all checks, records results at Pattern Layer 6 (Constraint)
- Quick check helpers for dashboard widgets

### v1.3.1 — 2026-02-18 (Cycle 3: Patronage Engine — Flow)

**Q52: Member Dashboard**
- React component: MemberDashboard.tsx
- Capital account balance from chain, contribution summary, allocation history
- Recent chain activity feed with formatted event labels

**Q53: Allocation Statements + K-1 Data Export**
- Per-member allocation statements with contribution detail
- IRS K-1 data: Box 1 (ordinary income), Box 11A/11B (cash/retained patronage)
- Capital account analysis (beginning/ending/contributions/distributions)
- Batch export for all members, CSV format for accountant import

**Q54: Period Close Governance Workflow**
- Proposal → compliance → voting → execution pipeline
- Auto-execute on reaching configurable approval threshold
- All governance events on chain at Pattern Layer 6 (Constraint)

**Q55: On-Chain Hash Anchoring (Base L2)**
- BLOCKED: Requires smart contract deployment on Base + private key management
- When unblocked: Will anchor chain head hash for tamper-evidence
| S91 | +++ MossMycelium redesign of the-habitat.org — complete React SPA rebuild | Habitat Frontend | ACTIVE | 2026-02-18T14:10Z | — |
