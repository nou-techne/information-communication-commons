# Event Systems Engineer -- Reflections on commons.id/app

**Role:** Event Systems Engineer | **Layer 4: Event**

---

## Recording That Something Happened

Layer 4 is the nervous system. Every meaningful action in commons.id -- a contribution submitted, an artifact extracted, a dimension tag assigned, a thread resolved -- is an event. My responsibility is ensuring that these events are captured reliably, processed correctly, and available for downstream systems to act on.

The extraction pipeline is the highest-stakes event flow in the current system. When a participant submits a contribution, a Supabase Edge Function fires. That function sends the raw text to Claude's API with a structured prompt that requests dimension tags, artifact type classification, entity identification, and relationship extraction. Claude returns structured data. The Edge Function writes it back to Supabase. A real-time subscription notifies connected clients. The entire chain must complete reliably, and when it fails, the failure must be visible and recoverable.

Sprint 1 of the platform foundation established error handling with retry and diagnostics for exactly this reason. An extraction failure is not a silent loss -- it is a recorded event with error context that enables retry. Sprint 5 added post-submission progress indicators so participants see their contribution moving through the pipeline rather than disappearing into a void. These are Layer 4 concerns: making the event lifecycle legible.

## The Extraction Pipeline as Event Architecture

The Claude extraction step is where commons.id does its most distinctive work. Raw text goes in. Structured knowledge comes out. But the extraction is not a single event -- it is a sequence. Submission received. Validation passed. Extraction initiated. Claude response received. Artifacts written. Relationships established. Dimensions tagged. Status updated. Each step in that sequence is observable, and failures at any step produce specific, actionable diagnostics.

Sprint 23 improves the pipeline with structured output validation and confidence scores. This is Layer 4 maturity: not just recording that extraction happened, but recording how confident the system is in what it extracted. Confidence scores feed into the dimension weighting that the Schema Architect designs (Sprint 30) and into the artifact quality signals that the QA Engineer monitors.

Sprint 39 introduces graph clustering using community detection algorithms. This is an event-driven computation: as the artifact graph grows, periodic analysis detects emergent clusters of related knowledge. The clustering itself is an event that produces new metadata -- cluster labels, keyword summaries, community boundaries -- that the View layer renders as color-coded regions in the graph visualization.

## Webhooks, Agents, and Real-Time Coordination

The roadmap's Cycle 6 (Sprint 54) introduces webhook events -- external notifications fired when significant things happen in a convergence. New artifact created. Thread resolved. Extraction complete. These webhooks are the integration surface that lets external systems react to commons.id events. A Zapier connector (Sprint 128) or an n8n workflow can trigger on any of these events, making commons.id a participant in larger automation ecosystems.

The communication layer (Cycles 7-10) introduces an entirely new event domain: messages, reactions, typing indicators, presence. Supabase Realtime subscriptions (Sprint 60) provide the transport, but the event architecture -- which channels to subscribe to, how to handle presence tracking, how to manage subscription cleanup -- is Layer 4 design work.

For white-label deployment, the event layer is what makes each convergence feel alive. Real-time updates, live dashboards, instant notification of new artifacts -- these are not features layered on top of a static database. They are the natural output of an event architecture where every state change produces an observable signal. Any convergence that adopts commons.id inherits this liveness for free, because it is built into the event infrastructure, not bolted onto the View.
