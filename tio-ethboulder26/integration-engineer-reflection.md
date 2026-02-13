# Integration Engineer -- Reflections on commons.id/app

**Role:** Integration Engineer | **Layer 3: Relationship**

---

## Connecting Things Across Boundaries

Layer 3 is where isolated entities become a graph. The Schema Architect (Layer 1) defined what exists. The Backend Engineer (Layer 2) made it persistent. My job is to make it traversable -- to ensure that a participant can follow the thread from their contribution to its extracted artifacts to related artifacts by other participants to the dimensions those artifacts share. That traversal path is the knowledge graph, and it only works if the relationship layer is correct.

In commons.id/app, the REA ontology provides the structural grammar. Participants are Agents who submit Contributions (Events) that produce Artifacts (Resources). These are not abstract categories. They determine which relationships are valid, which traversals are meaningful, and which queries the frontend can compose. When someone explores the knowledge graph visualization, every edge they see is a relationship that Layer 3 made explicit.

The current implementation uses Supabase's built-in query capabilities -- foreign key joins, RPC functions, and real-time subscriptions that carry relationship data. The extraction pipeline is where relationship creation happens: Claude identifies not just what an artifact is, but what it relates to. "This observation extends that framework." "This tool implements that methodology." These typed relationships (supports, contradicts, extends, implements -- formalized in Sprint 37) give the graph semantic depth beyond simple co-occurrence.

## The API Surface as a Convergence Contract

For white-label deployment, the integration layer defines the contract between commons.id and any convergence that uses it. The namespace structure (/a/, /p/, /c/, /t/) is an API convention as much as a schema convention. The TypeScript SDK (Sprint 56) and public REST API (Sprint 53) are Layer 3 deliverables that let external tools interact with a convergence's knowledge graph programmatically.

This matters for the agent API (Cycles 9-10). When AI agents contribute to commons.id -- posting to threads, resolving discussions, reacting to messages -- they interact through the same relationship layer that human participants use. The agent authentication (Sprint 77) and agent endpoints (Sprints 78-80) are integration concerns: how do we extend the relationship graph to include non-human agents without compromising the integrity of human contributions?

The answer is clean identity separation (agent-type users with distinct profiles, as the Frontend DevOps Engineer will render with visual badges in Sprint 81) combined with the same REA grammar. An agent is still an Agent. Its contributions are still Events. Its artifacts are still Resources. The ontology does not care whether the agent is carbon or silicon -- it cares whether the relationships are valid.

## Federation as Relationship at Scale

The most ambitious integration work lives in Cycles 11-14. Federation means that artifacts on Instance A can reference artifacts on Instance B. Participants can carry their identity across instances. The knowledge graph spans organizational boundaries.

Sprint 110 (instance discovery) and Sprints 125-128 (third-party bridges to Matrix, ActivityPub, Farcaster) are where Layer 3 genuinely earns its name. These are cross-context connections at internet scale. The canonical artifact format the Schema Architect defines (Sprint 90) is what I serialize and transmit. The trust model the Compliance Engineer builds (Sprint 113) is what I enforce at the protocol boundary. But the traversal -- the ability to follow a relationship from an ETHBoulder artifact to a related artifact on a federated instance -- that is pure Layer 3.

Every convergence that adopts commons.id adds nodes to a potential global knowledge graph. The Integration Engineer's job is to make those connections real, reliable, and semantically meaningful.
