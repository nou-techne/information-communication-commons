# Graph Views Roadmap

Three mini-roadmaps implementing Chain Growth, Social Graph, and Semantic Clusters as selectable views in the 3D graph. Each sprint is completable in <10 minutes.

---

## Phase 0: View Infrastructure (Shared)

### Sprint G0 — View Selector Component
TIO Role: 07-frontend-devops (View Layer)
Create a 3-button toggle component (Chain / Social / Semantic) that replaces the current Color By + filter dropdowns. Store selected view in state. Pass view mode to Graph.tsx as a prop. Default to Chain Growth.

### Sprint G1 — Remove Dimension Hub Nodes
TIO Role: 01-schema-architect (Identity Layer)
Remove the 6 hardcoded e/H-LAM/T dimension nodes from Graph.tsx node generation. Remove dimension-to-artifact edges. Keep dimension data available as metadata on artifacts (for color overlay) but not as graph structure.

### Sprint G2 — Dimension Color Overlay Toggle
TIO Role: 07-frontend-devops (View Layer)
Add a toggle button "Color by Dimension" available in all three views. When on, nodes are tinted by their primary H-LAM/T tag. When off, nodes use the view-specific coloring. Persists in localStorage.

---

## Phase 1: Chain Growth View (8 sprints)

### Sprint C1 — Contribution Node Type
TIO Role: 01-schema-architect (Identity Layer)
Add contribution nodes to the graph. Query contributions table (id, title/content preview, created_at, participant_id, seq from Merkle chain). Render as distinct node shape/color (larger, different border) from artifact nodes.

### Sprint C2 — Contribution-to-Artifact Edges
TIO Role: 03-integration-engineer (Relationship Layer)
Create edges from each contribution to its extracted artifacts. Use the extraction JSONB to match contribution -> artifact titles. Edge type: "extracted_from" with dashed styling.

### Sprint C3 — Chain Sequence Layout
TIO Role: 05-workflow-engineer (Flow Layer)
Modify force simulation for Chain view: contributions arranged by seq order (left-to-right or radial). Artifacts cluster around their parent contribution. Earlier contributions have stronger center gravity. Creates a temporal flow.

### Sprint C4 — Replay Integration
TIO Role: 04-event-systems-engineer (Event Layer)
Wire replay slider to Chain view. At seq=1, show only the first contribution and its artifacts. Each step adds the next contribution and its artifacts. Edges to previously existing artifacts appear as connections form. Animate node entry with fade-in.

### Sprint C5 — Contribution Node Detail
TIO Role: 07-frontend-devops (View Layer)
When clicking a contribution node, show the contribution detail panel: content preview, contributor name, timestamp, chain sequence number, number of extracted artifacts, chain hash prefix.

### Sprint C6 — Edge Animation on Replay
TIO Role: 07-frontend-devops (View Layer)
When a new chain step introduces cross-contribution relationships (artifact from step 3 links to artifact from step 1), animate the edge drawing. Brief pulse effect on newly connected nodes.

### Sprint C7 — Empty State
TIO Role: 00-product-engineer (Cross-Cutting)
When graph has zero contributions, show centered prompt: "Submit your first contribution to seed the knowledge graph." Link to /contribute. No floating orphan nodes.

### Sprint C8 — Chain View QA
TIO Role: qa-test-engineer (Cross-Cutting)
Test with 0, 1, 3, 10+ contributions. Verify replay works forward and backward. Verify node click detail panels. Verify fullscreen. Verify dimension color overlay toggle. Fix edge cases.

---

## Phase 2: Social Graph View (8 sprints)

### Sprint S1 — Participant Node Type
TIO Role: 01-schema-architect (Identity Layer)
Add participant nodes to the graph. Query participants table (id, name, avatar_url). Render as circular nodes with initials or avatar, distinct from artifact nodes. Larger radius, different color family (warm tones).

### Sprint S2 — Participant-to-Artifact Edges
TIO Role: 03-integration-engineer (Relationship Layer)
Create edges from each participant to artifacts they created (created_by) or steward (steward_id). Edge type: "created" with solid styling.

### Sprint S3 — Cross-Participant Edges
TIO Role: 03-integration-engineer (Relationship Layer)
When two participants' artifacts share tags or have direct artifact_relationships, create a weighted edge between the participants. Thicker edge = more shared connections. These show conceptual overlap between people.

### Sprint S4 — Social Layout Forces
TIO Role: 05-workflow-engineer (Flow Layer)
Modify force simulation for Social view: participants repel each other (spread out). Artifacts attracted to their creator. Shared artifacts pulled toward midpoint between connected participants. Creates constellation-per-person with bridges.

### Sprint S5 — Replay by Participant Entry
TIO Role: 04-event-systems-engineer (Event Layer)
Wire replay to Social view. Each chain step may introduce a new participant. Show participant node appearing, then their artifacts radiating out, then cross-edges forming to existing participants' artifacts.

### Sprint S6 — Participant Detail Panel
TIO Role: 07-frontend-devops (View Layer)
When clicking a participant node, show: name, contribution count, artifact count, top tags, coordination interests count, link to /p/{id} profile. Show list of their artifacts as clickable items.

### Sprint S7 — Overlap Indicators
TIO Role: 07-frontend-devops (View Layer)
When hovering a participant node, highlight all their artifacts and any shared edges to other participants. Dim non-connected nodes. Shows the "reach" of each person's contributions.

### Sprint S8 — Social View QA
TIO Role: qa-test-engineer (Cross-Cutting)
Test with 1 participant (solo), 2 participants (pair with overlap), 5+ participants. Verify replay. Verify hover highlighting. Verify participant detail panel. Verify dimension color overlay.

---

## Phase 3: Semantic Clusters View (8 sprints)

### Sprint V1 — Tag Co-occurrence Matrix
TIO Role: 02-backend-engineer (State Layer)
Build a tag co-occurrence calculation: for each pair of tags that appear on the same artifact, increment a weight. Store as an in-memory adjacency structure. This defines "semantic distance" between artifacts.

### Sprint V2 — Tag-Based Gravity Forces
TIO Role: 05-workflow-engineer (Flow Layer)
Modify force simulation for Semantic view: artifacts sharing tags attract each other proportional to shared tag count. No anchor nodes. Artifacts with unique tags drift to periphery. Dense tag overlap creates tight clusters.

### Sprint V3 — Cluster Label Detection
TIO Role: 01-schema-architect (Identity Layer)
Detect emergent clusters using simple density: groups of 3+ artifacts within a force-distance threshold. Label each cluster by its most common shared tag (excluding hlamt: prefix tags). Render cluster labels as floating text.

### Sprint V4 — Artifact-Only Rendering
TIO Role: 07-frontend-devops (View Layer)
In Semantic view, only artifact nodes appear. No contribution or participant anchors. Node size based on tag count (more tags = more connections = larger). Node color by REA role or most prominent tag family.

### Sprint V5 — Replay as Emergence
TIO Role: 04-event-systems-engineer (Event Layer)
Wire replay to Semantic view. Each chain step adds artifacts. As artifacts accumulate, clusters form and re-form. Early steps show scattered nodes. Later steps show neighborhoods coalescing. Force simulation re-runs on each step.

### Sprint V6 — Cluster Boundary Visualization
TIO Role: 07-frontend-devops (View Layer)
Draw subtle convex hull boundaries around detected clusters. Semi-transparent fill matching the cluster's dominant color. Boundaries shift as replay progresses and clusters evolve.

### Sprint V7 — Semantic Detail Panel
TIO Role: 07-frontend-devops (View Layer)
When clicking an artifact in Semantic view, show: title, tags, cluster membership, co-clustered artifacts (neighbors), shared tag count with each neighbor. Emphasize the "why" of the clustering.

### Sprint V8 — Semantic View QA
TIO Role: qa-test-engineer (Cross-Cutting)
Test with sparse data (few shared tags), dense data (many overlaps), single-cluster, multi-cluster. Verify clusters form sensibly. Verify replay emergence. Verify detail panels. Verify dimension color overlay.

---

## Phase 4: Polish (3 sprints)

### Sprint P1 — View Transition Animation
TIO Role: 07-frontend-devops (View Layer)
Animate transitions between views. When switching Chain -> Social -> Semantic, morph node positions smoothly rather than jumping. Shared nodes (artifacts) slide to new positions. View-specific nodes fade in/out.

### Sprint P2 — View-Specific Legend
TIO Role: 07-frontend-devops (View Layer)
Update the graph legend dynamically per view. Chain: contribution vs artifact node shapes. Social: participant vs artifact, edge thickness meaning. Semantic: cluster colors, node size meaning.

### Sprint P3 — Final Integration QA
TIO Role: qa-test-engineer (Cross-Cutting)
Full pass across all three views. Verify view switching, replay in each view, fullscreen in each view, dimension overlay in each view, node detail panels, empty states, mobile responsiveness.

---

Total: 30 sprints (3 sprints shared + 8 Chain + 8 Social + 8 Semantic + 3 Polish)
Estimated: 5 hours at 6-minute heartbeat cadence, or 15 hours at 30-minute heartbeat cadence.
