# Frontend and DevOps Engineer -- Reflections on commons.id/app

**Role:** Frontend and DevOps Engineer | **Layer 7: View**

---

## Making the Invisible Visible

Layer 7 is where everything below becomes real to the people who use it. The Schema Architect's entity model, the Backend Engineer's state management, the Integration Engineer's relationship graph, the Event Systems Engineer's real-time subscriptions, the Workflow Engineer's process orchestration, the Compliance Engineer's security rules -- all of it converges in what a participant actually sees when they open commons.id/app in their browser.

The current frontend is React with Vite, TypeScript, and Tailwind, deployed as a single-page application. The design language follows ETHBoulder's theming: lime (#c3fd50) against dark grey (#0f0f0f), clean typography, no emoji anywhere in the interface. The Explore page presents dimension cards (e/H-LAM/T/S) with live counters fed by Supabase real-time subscriptions. The contribution form accepts raw text and shows a progress indicator through the extraction pipeline. The artifact detail view displays relationships, tags, and source attribution.

Sprint 6 of the platform foundation was dedicated entirely to mobile responsiveness at 375px and 390px breakpoints. This is not a minor concern for a live event -- participants contribute from their phones while sitting in talks, standing in hallways, or crowded around whiteboards. If the contribution form does not work on a phone, it does not work.

## The Live Event Dashboard

Sprint 14 delivers the live event dashboard -- a large-screen projection view designed for 1080p projectors at ETHBoulder. Auto-refreshing artifact feeds, knowledge graph visualization, dimension counters, minimal chrome. This is the public face of commons.id during the event: a screen that shows the collective knowledge of the convergence growing in real time.

The knowledge graph visualization (Sprint 13) uses D3-force to render artifacts as nodes and relationships as edges, colored by type and filterable by dimension. Sprint 38 evolves this into a full interactive graph explorer with zoom, pan, node selection, and click-to-detail. Sprint 40 adds compound filters and a persistent legend. These are Layer 7 features, but they depend entirely on the relationship data the Integration Engineer provides and the event signals the Event Systems Engineer delivers.

## Operations and Deployment

The DevOps half of this role is equally critical. Sprint 12 establishes monitoring and observability: Edge Function metrics for success rate, latency, and error rates, with alerts on greater than 20 percent failure rates. Sprint 33 sets up CI/CD via GitHub Actions with lint, typecheck, and build on every pull request. Sprint 44 adds React error boundaries and client-side error logging.

For white-label deployment, the operational story must be clean enough that a non-expert can deploy and maintain a commons.id instance. Docker images (Sprint 33 onward), deployment runbooks, and infrastructure-as-code are Layer 7 deliverables aimed at this goal. Sprint 150 is the landing page at commons.id itself, and Sprint 151 is the hosted offering where a new user can sign up and have a working convergence in under five minutes.

## Where the View Layer Evolves

The PWA work (Sprint 129) makes commons.id installable on mobile devices with offline caching. Push notifications (Sprint 131) keep participants engaged between sessions. The React Native shell (Sprint 133) with native camera integration (Sprint 134) enables a mode of contribution that the web cannot match: photograph a whiteboard, OCR the text, and submit it as a contribution that gets extracted into structured knowledge.

The embed widget (Sprint 55) lets external sites show live convergence activity -- a conference website displaying a real-time feed of what participants are discovering and discussing. This is Layer 7 as distribution channel: the View is not just the application itself, but every surface where convergence knowledge appears.

Accessibility is non-negotiable. Sprint 42 establishes the baseline with axe-core. Sprint 137 conducts a full WCAG 2.1 AA audit. Sprint 138 optimizes for screen readers. The knowledge that emerges from a convergence should be accessible to everyone, not just those with perfect vision and a mouse.
