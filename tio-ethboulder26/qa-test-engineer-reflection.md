# QA and Test Engineer -- Reflections on commons.id/app

**Role:** QA and Test Engineer | **Layer:** Cross-Cutting (All Seven Layers)

---

## The View From Everywhere

The QA Engineer is the only role that spans all seven layers of the pattern stack. Where the Schema Architect sees entities, the Backend Engineer sees queries, and the Frontend Engineer sees components, I see the seams between them. My job is to verify that each layer's contract with the layers below is honored, and that the whole system composes into correct, reliable behavior.

In commons.id/app, the most critical seam is between the extraction pipeline (Layers 2-4) and the knowledge graph display (Layer 7). When a participant submits a contribution, does the extraction produce correctly typed artifacts? Do the dimension tags match the content? Are the relationships semantically valid? Does the real-time subscription deliver the result to connected clients within the expected timeframe? Sprint 2 of the platform foundation was an end-to-end smoke test: five diverse contributions pushed through the pipeline, each verified for extraction quality across all layers.

Sprint 3 focused on extraction accuracy tuning for edge cases -- contributions that are very short, very long, ambiguous, or span multiple dimensions. These are the inputs that expose brittle assumptions in the extraction prompt. The QA Engineer's role is to generate these adversarial inputs systematically and verify that the system degrades gracefully rather than producing garbage output.

## Testing the Knowledge Graph's Integrity

The knowledge graph is a living data structure that grows with every contribution. Graph integrity means several things simultaneously: every artifact has a valid type and at least one dimension tag; every relationship connects two existing artifacts with a valid relationship type; every contribution links to its producing participant; no orphaned nodes exist after a failed extraction.

Sprint 19 is a dedicated extraction accuracy audit -- reviewing 20 random extractions for dimension tagging accuracy, type correctness, and relationship quality. This is not automated testing; it is human judgment applied to machine output. The results feed back into prompt improvements (Sprint 23) and schema refinements. The QA Engineer's audit is the calibration mechanism that keeps extraction quality honest.

Sprint 34 establishes the automated testing framework with Vitest, covering extraction parsing, dimension mapping, and RLS policy verification. Sprint 43 adds Playwright integration tests for core flows: contribute, explore, search, graph, profile. Sprint 76 builds the communication test suite. Each testing phase follows the layer it validates, respecting the dependency order that the Technical Lead maintains.

## Quality at Scale

Sprint 108 is the load test: 100 concurrent users, 50 messages per second, 10 contributions per second. For a live event like ETHBoulder, this is the realistic stress scenario. Can the extraction pipeline handle a burst of contributions during a popular talk? Can the real-time subscriptions keep 100 graph visualizations updated without degradation? Can the search index return results under 100ms while writes are happening?

The compliance verification work matters here too, though commons.id's compliance concerns differ from Habitat's accounting focus. In commons.id, compliance means the Convergence Chain maintains hash continuity, the archive is tamper-evident, participant attribution is correct, and privacy controls (Sprint 100) actually work -- data export produces complete data, account deletion removes the right records, and anonymization genuinely de-identifies contributions.

For the white-label platform, the QA Engineer's contribution is a test suite that any convergence operator can run against their deployment. If the tests pass, the system is working correctly. If they fail, the failures identify exactly which layer has a problem. This is the test pyramid applied to the Seven Progressive Design Patterns: unit tests per layer, integration tests across layers, and end-to-end tests that verify the complete contribution-to-knowledge-graph lifecycle. The pattern stack is not just an architecture -- it is a testing strategy.
