# Sprint Queuing Protocol

*Emergent protocol for human-agent coordination during live development.*

Origin: commons.id project, Feb 12, 2026. Emerged during ETHBoulder pre-event testing when rapid issue identification outpaced sequential resolution.

## Problem

During live testing, a human tester identifies multiple issues faster than they can be resolved one at a time. Without structure, this creates:
- Lost issues (mentioned once, forgotten)
- Context switching (agent jumps between half-finished fixes)
- No visibility into what's pending vs. complete
- No record of what was fixed and why

## Protocol

### Roles

- **Queue Leader** (human): Identifies issues, queues sprints, sets priority by ordering
- **Sprint Agent** (agent): Acknowledges queue, executes sprints sequentially, reports status

### Queue Signal

The Queue Leader prefixes a message with `+++` to signal sprint queuing:

```
+++ [1] Description of issue or feature
    [2] Another issue
    [3] A third request
```

### Agent Response

On receiving a `+++` message, the Sprint Agent responds with:
- Total queue length
- Position of each new sprint in the queue
- Begins executing the first unblocked sprint immediately

### Execution Cycle

For each sprint:

1. **Diagnose** -- Identify root cause or scope
2. **Fix** -- Implement the change
3. **Deploy** -- Build, commit, push
4. **Report** -- Message the Queue Leader with:
   - Sprint ID (Q1, Q2, etc.)
   - Status (COMPLETE / BLOCKED / CLARIFICATION NEEDED)
   - What was done (plain language, no jargon)
   - Remaining queue state

### Sprint States

| State | Meaning |
|-------|---------|
| QUEUED | Acknowledged, waiting for execution |
| IN PROGRESS | Currently being worked on |
| COMPLETE | Fixed, deployed, verified |
| BLOCKED | Cannot proceed without external input |
| CLARIFICATION | Needs more information from Queue Leader |

### Blocking Rules

If a sprint is blocked (needs clarification, external dependency):
1. Mark it CLARIFICATION or BLOCKED
2. Skip to the next queued sprint
3. Return when the blocker resolves

Never idle on a blocked sprint when unblocked work exists in the queue.

### Versioning

Every sprint that modifies code:
- Gets a descriptive git commit message
- Is pushed to the repository immediately
- Changelog entry if significant

## TIO Integration

Each sprint can optionally declare a primary TIO role (from the Technology and Information Office role framework). The role's quality criteria become the sprint's acceptance standards.

Example roles:
- **Product Engineer** (00) -- User-facing behavior, UX issues
- **Technical Lead** (00) -- Architecture, integration decisions
- **Schema Architect** (01) -- Data model changes
- **Frontend/DevOps** (07) -- Build, deploy, UI components

## Properties

- **Sequential by default**: Sprints execute in queue order unless blocked
- **Interruptible**: New `+++` messages can add to the queue at any time
- **Transparent**: Queue state is always visible to the Queue Leader
- **Zero-deferral**: Every sprint either completes or gets an explicit status -- nothing silently drops

## Example Exchange

```
Human: +++ [1] Login button is broken on mobile
       [2] Add dark mode toggle
       [3] Fix typo on About page

Agent:  Sprint Queue initialized. Three sprints queued:
        [Q1] BUG: Login button broken on mobile
        [Q2] FEATURE: Add dark mode toggle
        [Q3] FIX: Typo on About page
        Queue length: 3. Starting Q1 now.

Agent:  Q1 COMPLETE -- Login button fix deployed.
        Root cause: Touch target too small (24px, needed 44px min).
        Fix: Increased button padding, added tap highlight.
        Queue: 2 remaining. Starting Q2.
```

## Relationship to Other Protocols

- Inherits **zero-deferral** discipline from the ROADMAP_100 sprint methodology
- Inherits **TIO role framework** for quality criteria
- Complements **Convergence Chain** (merkle chain) for contribution provenance
- Natural fit for any human-agent pair doing iterative development

---

*Documented by Nou, Techne Collective Intelligence Agent, after first use during commons.id ETHBoulder preparation.*
