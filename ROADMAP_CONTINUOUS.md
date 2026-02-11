# commons.id — Continuous Roadmap

*Roadmaps, like Earth cycles, ebb and flow.*

## Philosophy

This roadmap operates in alternating tides:

**Ebb — Retroactive Optimization**
Testing, fixes, performance, cleanup, debt reduction. The system contracts to become more resilient. QA and Test Engineer leads. All TIO roles audit their layers.

**Flow — Proactive Augmentation**
Enhancements, new capabilities, expansion. The system extends to become more capable. Product Engineer and Technical Lead set direction. Layer-specific TIO roles build.

Each cycle completes one full ebb-flow rotation before the next begins. Cycles are numbered and journaled. The current phase is tracked in `memory/heartbeat-state.json` under `icc.cycle`.

## Cycle Structure

Each cycle consists of two phases, each spanning 4 sprints (8 sprints per cycle):

### Ebb Phase (Sprints 1-4): Optimize
| Sprint | TIO Role | Focus |
|--------|----------|-------|
| 1 | QA and Test Engineer | E2E testing, regression, edge cases |
| 2 | Compliance and Security Engineer | RLS audit, rate limits, input validation |
| 3 | Frontend and DevOps Engineer | Performance, bundle size, caching, deployment |
| 4 | Technical Lead | Architecture review, tech debt, dependency updates |

### Flow Phase (Sprints 5-8): Augment
| Sprint | TIO Role | Focus |
|--------|----------|-------|
| 5 | Product Engineer | Feature scoping, user feedback synthesis, prioritization |
| 6 | Schema Architect + Backend Engineer | Data model evolution, new entities, migrations |
| 7 | Integration Engineer + Event Systems Engineer | New integrations, event flows, extraction improvements |
| 8 | Frontend and DevOps Engineer | UI features, new views, deployment |

### Between Cycles
- Journal entry: what changed, what was learned, what's next
- Version bump (minor for flow phases, patch for ebb phases)
- CHANGELOG update
- Cycle retrospective in journal

## Cycle Queue

### Cycle 1: Post-ETHBoulder Consolidation
*Begin after ETHBoulder (Feb 17, 2026)*

**Ebb (Sprints 1-4): Field-Tested Hardening**
1. QA: Analyze real ETHBoulder contributions — extraction accuracy, edge cases, failures
2. Security: RLS policy audit, rate limiting effectiveness, abuse patterns observed
3. DevOps: Performance under real load — Edge Function latency, bundle optimization, caching
4. Tech Lead: Architecture lessons — what scaled, what didn't, dependency review

**Flow (Sprints 5-8): First Expansion**
5. Product: User feedback from ETHBoulder participants, feature requests, accessibility audit
6. Schema: White-label convergence support — multi-event data model, convergence CRUD
7. Integration: Improved extraction — observation patterns vocabulary (Ring 3), confidence scoring
8. Frontend: Convergence selector UI, participant profiles, contribution search

### Cycle 2: Platform Maturation
*Scope emerges from Cycle 1 retrospective*

**Ebb:** Testing infrastructure, CI/CD pipeline, monitoring dashboards, error tracking
**Flow:** Graph visualization (D3-force), live event dashboard, session-scoped contributions, API docs

### Cycle 3: Ecosystem
*Scope emerges from Cycle 2 retrospective*

**Ebb:** Security audit, penetration testing, backup/restore, disaster recovery
**Flow:** Multi-convergence views, cross-event analysis, public API, federation protocol

## Landing Page Cycles

The commons.id landing page follows the same ebb-flow rhythm but on a slower cadence (one cycle per 2 app cycles):

**Ebb:** Copy review, link audit, SEO refresh, analytics review, accessibility pass
**Flow:** New sections, case studies from convergences, testimonials, partner logos, blog/journal integration

## Integration with Heartbeats

During active cycles:
- Each heartbeat = one sprint (30-minute cadence)
- HEARTBEAT.md references this roadmap
- `memory/heartbeat-state.json` tracks: `icc.cycle`, `icc.cyclePhase` (ebb/flow), `icc.cycleSprint`

During quiet periods (no active cycle):
- Heartbeats check for issues, monitor production
- Opportunistic small fixes (typos, minor UX tweaks)
- HEARTBEAT_OK when nothing needs attention

## TIO Role Rotation

Every sprint has a primary TIO role. Over a full cycle, every role is exercised at least once. This ensures:
- No layer accumulates debt silently
- Quality criteria from each role's SKILL.md serve as acceptance standards
- The system is reviewed from every angle regularly

The full TIO roster:
- Product Engineer (cross-cutting)
- Technical Lead (cross-cutting)
- Schema Architect (Layer 1: Identity)
- Backend Engineer (Layer 2: State)
- Integration Engineer (Layer 3: Relationship)
- Event Systems Engineer (Layer 4: Event)
- Workflow Engineer (Layer 5: Flow)
- Compliance and Security Engineer (Layer 6: Constraint)
- Frontend and DevOps Engineer (Layer 7: View)
- QA and Test Engineer (cross-cutting)

---

*The tide goes out so it can come back in. Every optimization enables the next augmentation. Every augmentation creates the next thing to optimize.*
