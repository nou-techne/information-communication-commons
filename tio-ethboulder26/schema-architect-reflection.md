# Schema Architect -- Reflections on commons.id/app

**Role:** Schema Architect | **Layer 1: Identity**

---

## Defining What Exists

Before anything can be stored, queried, displayed, or secured, it must first be distinguished. That is the work of Layer 1 -- Identity -- and it is the foundation everything else rests on. In commons.id/app, the Schema Architect's contribution begins with a single question: what are the things that exist in a convergence, and how do we tell them apart?

The answer is a namespace architecture with four primary entity types. Artifacts live at /a/{id} -- the extracted knowledge objects with types, dimension tags, and relationships. Participants live at /p/{name} -- the agents who contribute, discuss, and connect. Convergences live at /c/{event} -- the scoping container that isolates one gathering from another. Tents live at /t/{tent} -- the physical or thematic spaces within a convergence where activity happens.

Each of these maps cleanly to the REA ontology that serves as our grammatical backbone. Participants are Agents. Contributions are Events. Artifacts are Resources. This is not decorative taxonomy. When the Integration Engineer (Layer 3) builds traversal queries, and when the Event Systems Engineer (Layer 4) designs the extraction pipeline, they inherit a data model where the relationships between things are structurally coherent because the identities of things were defined correctly from the start.

## The Dimension Schema

The seven-dimensional framework -- e/H-LAM/T/S (ecological, Human, Language, Artifact, Methodology, Training, Sessions) -- is a schema-level design decision. Each contribution receives dimension tags during Claude extraction, and those tags map to a controlled vocabulary defined at Layer 1. The dimension counters on the Explore page, the filtering in the knowledge graph, the scoping of search results -- all of these depend on a dimension schema that is both expressive enough to capture diverse knowledge and constrained enough to be queryable.

Sprint 30 on the roadmap introduces dimension weighting (0-1 continuous values instead of binary tags). This is a schema evolution I find particularly important. Binary dimension tags force a flattening: a contribution either is or is not about Language. Weighted dimensions capture intensity and allow the View layer to show graduated relevance. The migration path from binary to weighted is clean because the identity of each dimension does not change -- only its state representation does. Layer 1 stays stable while Layer 2 evolves.

## Generalizing for White-Label

The schema decisions that make commons.id work for ETHBoulder are the same decisions that make it work for any convergence. The convergence configuration model (Sprint 21) is a Layer 1 artifact: it defines what a convergence is, what dimensions it uses, what artifact types it recognizes, and what namespace it occupies. A hackathon might emphasize Artifact and Methodology dimensions. A research conference might weight Language and Training. The schema accommodates both because the identity layer is parameterized, not hardcoded.

Looking further ahead, the federation work in Cycles 11-14 introduces instance identity (Sprint 89) and cross-instance artifact formats (Sprint 90). These are deep schema questions: how does an artifact maintain its identity when it moves between commons.id instances? The answer involves content hashing, origin attestation, and canonical JSON-LD formats -- all Layer 1 concerns that must be settled before any federation protocol can function.

Artifact lineage (Sprint 96) is where the schema work becomes genuinely exciting. Tracking an idea as it evolves from a sketch at ETHBoulder to a prototype at a future hackathon to a launched project at a third event -- that is identity continuity across convergences. It requires the kind of careful entity modeling that makes the Schema Architect's work foundational in the most literal sense.
