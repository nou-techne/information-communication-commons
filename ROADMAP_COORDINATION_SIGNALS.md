# Coordination Signals Roadmap

Turn the static knowledge graph into a living attention map. Coordination interests (intentional signals of "I care about this") become the system's heartbeat — visible across every view, every page, every interaction.

---

## Phase 0: Signal Infrastructure (4 sprints)

### Sprint CS-01 — Signal Aggregation View
TIO Role: 02-backend-engineer (State Layer)
Create a Supabase database view `coordination_signal_summary` that pre-aggregates: artifact_id, signal_count, unique_participants, first_signal_at, last_signal_at. Query `coordination_interests` grouped by artifact_id. This becomes the single source for all signal-related UI.

### Sprint CS-02 — Participant Signal Overlap Function
TIO Role: 02-backend-engineer (State Layer)
Create an RPC function `get_participant_overlaps(p_participant_id uuid)` returning rows of (other_participant_id, shared_signal_count, shared_artifact_ids[]). Two participants overlap when both have coordination_interests on the same artifact. This powers Social view edges.

### Sprint CS-03 — Cluster Signal Density Function
TIO Role: 02-backend-engineer (State Layer)
Create an RPC function `get_tag_signal_density()` returning rows of (tag_name, artifact_count, total_signals, unique_signalers, density_ratio). Density = total_signals / artifact_count. This powers Semantic view heat maps.

### Sprint CS-04 — Real-time Signal Subscription
TIO Role: 04-event-systems-engineer (Event Layer)
Add a Supabase realtime channel for `coordination_interests` table changes (INSERT/DELETE). When a new signal arrives, broadcast to connected clients so all views update live without polling.

---

## Phase 1: Chain View Signals (4 sprints)

### Sprint CS-05 — Contribution Signal Aggregation
TIO Role: 03-integration-engineer (Relationship Layer)
For each contribution in Chain view, calculate total coordination signals across all its extracted artifacts. Display as a flame icon with count next to the chain entry. Contributions with signals get a subtle glow border (orange gradient proportional to signal count).

### Sprint CS-06 — Signal Boost Ranking
TIO Role: 05-workflow-engineer (Flow Layer)
Add a "Sort by Signal" option to Chain view. Contributions sort by total coordination signals (descending) instead of chain sequence. Header shows "Sorted by resonance" when active. Default remains chain order.

### Sprint CS-07 — Signal Pulse Animation
TIO Role: 07-frontend-devops (View Layer)
When a new coordination signal arrives (via realtime subscription), animate a pulse on the affected contribution's chain entry. Brief orange ripple expanding outward from the flame icon. CSS keyframe animation, 1.5s duration. Shows the graph "breathing."

### Sprint CS-08 — Chain Signal Detail
TIO Role: 07-frontend-devops (View Layer)
In the expanded contribution detail (click to expand), show which specific artifacts received signals and from whom. Format: "Artifact Title — 3 signals (Todd, Lucian, Aaron)". Participants link to /p/{id}. Sorted by signal count descending.

---

## Phase 2: Social View Signals (5 sprints)

### Sprint CS-09 — Mutual Signal Edges
TIO Role: 03-integration-engineer (Relationship Layer)
Replace tag-only connections with signal-weighted edges. Use `get_participant_overlaps` RPC. Render edge thickness proportional to shared signal count. Signal overlap weighted 3x vs tag overlap. Edge color: orange for signal-only, blended for signal+tag.

### Sprint CS-10 — Signal Strength Indicator
TIO Role: 07-frontend-devops (View Layer)
On each participant connection card (Social view), show signal overlap prominently: "3 mutual signals" with flame icon, listed above shared tags. Add a small signal-strength bar (0-5 scale based on mutual signals). Full bar = strong intentional alignment.

### Sprint CS-11 — Signal Radar
TIO Role: 07-frontend-devops (View Layer)
Add a "Signal Radar" mini-visualization to the participant's own card (top of Social view). Small radial chart showing signal distribution across dimensions (e/, H/, L/, A/, M/, T/). Shows where the participant's attention concentrates. Uses dimension colors.

### Sprint CS-12 — Live Signal Notifications
TIO Role: 04-event-systems-engineer (Event Layer)
When viewing Social view, show a toast notification when someone coordinates on an artifact you created or also coordinated on. "Lucian just signaled interest in [Artifact Title]". Links to the artifact. Non-intrusive, bottom-right, auto-dismiss 5s.

### Sprint CS-13 — Discover Through Signals
TIO Role: 00-product-engineer (Cross-Cutting)
Add a "Discover" section below connections in Social view. Show participants you DON'T yet share signals with, but who signaled artifacts in the same tag clusters as your signals. "You might align with: [Name] — signals in [cluster]". Ranked by potential overlap.

---

## Phase 3: Semantic View Signals (5 sprints)

### Sprint CS-14 — Cluster Heat Gradient
TIO Role: 07-frontend-devops (View Layer)
Use `get_tag_signal_density` to color cluster boundaries. Density 0 = dim grey border. Density 0.1-0.5 = warm orange. Density 0.5-1.0 = bright orange-red. Density >1.0 = pulsing hot. Gradient applied to cluster boundary fill. Dormant clusters visually recede.

### Sprint CS-15 — Artifact Signal Glow
TIO Role: 07-frontend-devops (View Layer)
In Semantic view, artifacts with coordination signals get an outer glow ring. Glow radius and opacity scale with signal count. 1 signal = subtle halo. 5+ signals = bright corona. Creates a "stars in a nebula" effect where hot artifacts illuminate their cluster.

### Sprint CS-16 — Attention Flow Lines
TIO Role: 07-frontend-devops (View Layer)
Draw thin animated lines between artifacts in different clusters that share signalers. If Todd signals artifact A in cluster X and artifact B in cluster Y, a faint dashed line connects them. Shows how individual attention bridges conceptual neighborhoods. Opacity based on shared signaler count.

### Sprint CS-17 — Cluster Momentum Indicator
TIO Role: 05-workflow-engineer (Flow Layer)
Track signal velocity per cluster: signals in last hour vs previous hour. Show an up/down arrow next to cluster labels. Rising clusters get a brighter boundary. Falling clusters dim. Shows where collective attention is moving, not just where it is.

### Sprint CS-18 — Semantic Signal Detail
TIO Role: 07-frontend-devops (View Layer)
When clicking a cluster label, show a cluster detail panel: total artifacts, total signals, unique signalers, signal density, top 3 signalers ("Most active: Todd (5), Lucian (3), Aaron (2)"), momentum direction, and the most-signaled artifact within the cluster.

---

## Phase 4: Universal Signal Layer (4 sprints)

### Sprint CS-19 — Universal Flame Component
TIO Role: 07-frontend-devops (View Layer)
Create a reusable `<SignalFlame count={n} />` component used everywhere: artifact cards, contribution entries, dimension cards, participant profiles. Size scales: count 0 = hidden, 1-2 = small, 3-5 = medium, 6+ = large with subtle animation. Consistent orange color.

### Sprint CS-20 — Signal Count on Dimensions
TIO Role: 07-frontend-devops (View Layer)
Add total signal count to each dimension card on Explore and Live pages. Below the artifact count: "e/ 3 artifacts · 7 signals". Dimensions with more signals get a warmer border tint. Shows which dimensions the collective is actively engaging with vs passively tagging.

### Sprint CS-21 — Signal Leaderboard
TIO Role: 00-product-engineer (Cross-Cutting)
Add a "Most Signaled" section to the Explore page right column, below Live Activity. Top 5 artifacts by signal count with flame indicators. Updates in real-time. Links to artifact detail. Shows the current "attention frontier" of the convergence at a glance.

### Sprint CS-22 — My Signal Activity
TIO Role: 07-frontend-devops (View Layer)
On My Activity page (all three views), add a "My Signals" summary: total signals given, total signals received on my artifacts, signal reach (unique people who signaled my work). In Chain view, show which of my contributions received the most external signals.

---

## Phase 5: Polish & QA (4 sprints)

### Sprint CS-23 — Signal Animation Performance
TIO Role: 07-frontend-devops (View Layer)
Audit all signal animations (pulses, glows, flow lines) for performance. Ensure <16ms frame time with 50+ animated elements. Use CSS animations over JS where possible. Add `will-change` hints. Disable animations on reduced-motion preference. Test on mobile.

### Sprint CS-24 — Empty State Signals
TIO Role: 00-product-engineer (Cross-Cutting)
When a view has artifacts but zero coordination signals, show an educational prompt: "No coordination signals yet. Visit the Coordinate page to signal what interests you." Link to /coordinate. Disappears after first signal arrives. Don't show if user hasn't contributed.

### Sprint CS-25 — Signal Accessibility
TIO Role: 06-compliance-security (Constraint Layer)
Ensure all signal indicators have ARIA labels ("5 coordination signals"), color is not the only indicator (always paired with count or icon), flame animations respect prefers-reduced-motion, screen readers announce signal changes, keyboard users can navigate signal elements.

### Sprint CS-26 — Full Integration QA
TIO Role: qa-test-engineer (Cross-Cutting)
Test complete signal flow: contribute → extract → coordinate → verify signal appears in Chain view, Social view, Semantic view, dimension cards, leaderboard, My Activity. Test with 0, 1, 5, 20+ signals. Test real-time updates across two browser tabs. Test mobile. Verify all three graph views reflect signals correctly.

---

Total: 26 sprints across 6 phases
- Phase 0: Infrastructure (4 sprints) — database views, RPCs, realtime
- Phase 1: Chain Signals (4 sprints) — contribution resonance
- Phase 2: Social Signals (5 sprints) — participant alignment
- Phase 3: Semantic Signals (5 sprints) — cluster attention maps
- Phase 4: Universal Layer (4 sprints) — consistent signal UX
- Phase 5: Polish & QA (4 sprints) — performance, accessibility, testing

Estimated: ~4.5 hours at 6-minute heartbeat, ~13 hours at 30-minute heartbeat.

Each sprint maps to a TIO role from tio/roles/, defining acceptance criteria:
- 01-schema-architect: Clean data model, no redundancy
- 02-backend-engineer: Efficient queries, proper indexing
- 03-integration-engineer: Correct relationship semantics
- 04-event-systems-engineer: Reliable real-time propagation
- 05-workflow-engineer: Logical flow, state transitions
- 06-compliance-security: WCAG 2.1 AA, ARIA patterns
- 07-frontend-devops: Responsive, performant, animated
- 00-product-engineer: User-facing value, clear empty states
- qa-test-engineer: Edge cases, cross-browser, mobile
