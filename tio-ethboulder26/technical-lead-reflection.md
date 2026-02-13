# Technical Lead -- Reflections on commons.id/app

**Role:** Technical Lead | **Layer:** Leadership (Cross-Cutting)

---

## Holding the Stack as a Single System

The Technical Lead's job is to see the whole. Not just the database, not just the API, not just the UI -- the entire composition from Identity through View. With commons.id/app, this means holding a stack that spans Supabase (Layers 1-2), Edge Functions with Claude API (Layers 3-4), Make.com orchestration (Layer 5), Row-Level Security (Layer 6), and a React frontend deployed at commons.id/app (Layer 7). Each layer presupposes the one below it. That dependency chain is not a suggestion -- it is a structural law.

The architecture decision that defines commons.id is the extraction pipeline. A participant submits raw text. A Supabase Edge Function sends that text to Claude for structured extraction -- dimension tags, artifact type, relationships, entity identification. The extracted artifacts land in a knowledge graph backed by Supabase tables with real-time subscriptions. The entire round trip happens in seconds, and the result is a queryable, traversable graph that grows with every contribution.

This is REA ontology in practice. Participants are Agents. Contributions are Events. Artifacts are Resources. The relationships between them are first-class data, not afterthoughts.

## Architecture Decisions That Generalize

Three architectural choices make commons.id viable as a white-label platform:

**Namespace isolation.** The /c/{event} convergence namespace scopes all data -- artifacts, participants, threads, contributions -- to a single event context. Adding a new convergence does not require a new database or a new deployment. It requires a row in a configuration table. That is the foundation of multi-tenancy.

**Extraction as a composable pipeline.** The Claude extraction step is not hardcoded to ETHBoulder's domain. The prompt, the dimension set, and the artifact taxonomy are all configurable per convergence. Cycle 2 of the roadmap (Sprints 21-24) makes this explicit by extracting convergence configuration into its own data model. Cycle 15 (Sprints 121-124) takes it further with a plugin architecture that lets convergence operators customize extraction behavior without touching core code.

**The Seven Progressive Design Patterns as build sequence.** We built commons.id the same way we build everything: Identity first, then State, then Relationship, then Event, then Flow, then Constraint, then View. The platform foundation (Sprints 1-8) followed this sequence, and it is why we shipped a working system in days rather than months. The pattern stack is not just architecture theory -- it is a construction method that any team adopting commons.id can follow.

## What the Roadmap Demands

The 160-sprint roadmap moves through phases that each stress-test a different part of the architecture. Cycles 1-6 harden what exists and add depth. Cycles 7-10 introduce the communication layer, which is the most architecturally significant addition -- it transforms commons.id from a contribution tool into a coordination platform. Cycles 11-14 tackle federation, which is where the dependency tree gets genuinely complex: cross-instance identity, artifact sync, conflict resolution, trust models.

I am most attentive to the federation phase. Getting identity portability right (Sprint 112) and conflict resolution right (Sprint 114) will determine whether commons.id can be a true peer-to-peer network of convergence archives or whether it remains a centralized platform with white-label theming. The difference matters enormously for the communities we serve.

The ebb-flow cadence -- optimize then build -- is the Technical Lead's best friend. It means every capability we add has a hardening cycle before the next capability lands on top of it. Layer N-1 stays solid. That is how you build systems that last.
