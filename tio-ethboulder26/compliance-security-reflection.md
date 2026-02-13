# Compliance and Security Engineer -- Reflections on commons.id/app

**Role:** Compliance and Security Engineer | **Layer 6: Constraint**

---

## Governing Valid States and Transitions

Layer 6 exists because not everything that is technically possible should be permitted. The Constraint layer defines the rules: what constitutes a valid contribution, who can see what data, how authentication works, and what guarantees the system makes about the integrity of its knowledge graph. In commons.id/app, these constraints protect both the participants and the archive itself.

The current constraint surface is focused on three areas. First, rate limiting and content validation (Sprint 10): a maximum of 10 contributions per IP per hour, content length between 20 and 10,000 characters. These are simple rules, but they prevent the most common abuse vectors during a live event where the contribution endpoint is publicly accessible. Second, authentication via magic link through Supabase Auth, providing passwordless access that scopes participant identity to a verified email address. Third, Row-Level Security policies on Supabase tables that enforce data visibility rules at the database level -- not just at the API level, not just at the UI level, but at the deepest layer of the stack.

Defense in depth is the operating principle. If the UI fails to enforce a visibility rule, the API catches it. If the API fails, RLS catches it. This is not paranoia. It is the minimum standard for a system where participants trust their contributions to be attributed correctly and their data to be handled respectfully.

## The Convergence Chain as Constraint

The Convergence Chain -- the append-only hash chain on contributions -- is a Layer 6 concept even though it touches Layers 2 and 4 in implementation. An append-only data structure is a constraint: once a contribution enters the chain, it cannot be silently modified or deleted. The hash chain provides verifiable history -- any participant can verify that the archive has not been tampered with by checking the hash continuity.

This is particularly important for the white-label offering. When an organization hosts a convergence on commons.id, they need assurance that the knowledge archive is trustworthy. The Convergence Chain provides that assurance cryptographically, not just procedurally. It is the same principle that makes blockchain useful for record integrity, applied to knowledge archives without the overhead of consensus mechanisms.

## Constraints That Enable Trust at Scale

The roadmap introduces increasingly sophisticated constraint requirements. Auth flow hardening (Sprint 26) addresses session expiry and token refresh. The security audit (Sprint 99) covers RLS policies, API endpoints, XSS vectors, and file upload risks. Privacy controls (Sprint 100) implement GDPR-compliant data export, account deletion, and contribution anonymization.

Channel permissions (Sprint 74) and message moderation (Sprint 73) are communication-layer constraints that balance openness with safety. A convergence needs public channels where anyone can contribute, but it also needs the ability to create members-only spaces and to handle abusive content without destroying the discussion context.

The federation trust model (Sprint 113) is where constraint work becomes most consequential. When commons.id instances federate, content flows between them. The Compliance Engineer must define trust levels -- untrusted, verified, trusted -- and ensure that content from untrusted instances is visibly marked and filterable. Without this constraint layer, federation becomes a vector for misinformation or spam that undermines the integrity of every connected instance.

Agent rate limiting and abuse prevention (Sprint 84) apply the same principles to AI participants. An agent that floods a convergence with low-quality contributions degrades the knowledge graph for everyone. Per-agent rate limits, spam pattern detection, and reputation scoring are constraints that protect the commons from its most enthusiastic participants, human or otherwise.

For any organization considering commons.id as a service, the constraint layer is what earns trust. Not the features, not the UI, not the extraction quality -- the rules that govern how data is protected, how access is controlled, and how integrity is verified.
