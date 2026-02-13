# Backend Engineer -- Reflections on commons.id/app

**Role:** Backend Engineer | **Layer 2: State**

---

## Making State Reliable

Layer 2 is where the Schema Architect's blueprints become operational reality. The Backend Engineer's concern is deceptively simple: can we write data, read it back correctly, and do both fast enough that the system feels alive? In commons.id/app, "alive" is not metaphorical -- real-time subscriptions mean every contribution, every extraction result, every new artifact appears on screen within seconds of creation. State must be correct and it must be fast.

Supabase provides the PostgreSQL foundation. The contributions table accepts raw participant input. The artifacts table stores extracted knowledge objects. The artifact_dimensions junction table holds dimension tags with weights. The artifact_relationships table captures the graph edges that connect artifacts to each other. Behind these tables sit indexes tuned for the queries the frontend actually makes: filtering artifacts by dimension, searching contributions by full text, counting artifacts per convergence.

The extraction pipeline -- where a Supabase Edge Function sends contribution text to Claude and writes back structured artifacts -- is the most state-intensive operation in the system. A single contribution can produce multiple artifacts, each with dimension tags and relationships. That write must be atomic. If extraction succeeds but the relationship writes fail, the knowledge graph has orphaned nodes. Transactions wrap the entire extraction result, and the contribution status transitions from "processing" to "complete" only when every artifact and every relationship has landed.

## Performance Under Live Event Conditions

ETHBoulder is a stress test. Dozens of participants contributing simultaneously, the live event dashboard refreshing in real time, the knowledge graph visualization pulling complex joins across artifacts and relationships. The materialized views that power the dimension counters on the Explore page must refresh frequently enough to feel current but not so frequently that they contend with write operations.

Sprint 15 introduces full-text search with tsvector indexes. Sprint 20 is a dedicated performance review after real data volume reveals which queries actually need optimization. This is the ebb-flow rhythm the Technical Lead established: build the capability, then harden it with real-world evidence.

Sprint 49 deepens the search infrastructure with ranked full-text search targeting sub-100ms response times at 1000+ records. Sprint 75 tackles message performance when the communication layer arrives -- virtual scrolling, pagination, subscription cleanup to prevent memory leaks in long-running threads. These are Layer 2 problems that only surface under production load.

## The White-Label Data Layer

For commons.id to function as a service, the state layer must support multi-tenancy cleanly. Every query must scope to a convergence. Every index must perform well when the total dataset spans multiple events. The convergence_id foreign key on artifacts, contributions, participants, and sessions is the partition boundary.

The JSON-LD export (Sprint 27) is a Layer 2 deliverable that enables data portability. A convergence's entire knowledge graph -- artifacts, relationships, contributions, participants -- serialized into a standards-compliant format that can be imported into another instance or processed by external tools. Data portability is what separates a platform from a trap.

Looking at the federation roadmap (Cycles 11-14), the Backend Engineer faces database sharding analysis (Sprint 92), multi-region read replicas (Sprint 118), and conflict resolution for federated artifact sync (Sprint 114). These are hard distributed systems problems. The foundation we lay now -- clean partitioning, atomic writes, correct indexes -- determines whether that future is achievable or aspirational.
