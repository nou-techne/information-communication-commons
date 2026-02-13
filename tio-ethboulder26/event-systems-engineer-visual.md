# Event Systems Engineer -- Visual: Extraction Pipeline Sequence

The event sequence for a single contribution, from participant submission through Claude extraction to real-time client notification.

```mermaid
sequenceDiagram
    participant P as Participant
    participant UI as React Frontend
    participant SB as Supabase
    participant EF as Edge Function
    participant CL as Claude API
    participant RT as Realtime Subscriptions
    participant WH as Webhook Listeners

    P->>UI: Submit contribution text
    UI->>SB: INSERT contribution (status: submitted)
    SB-->>RT: Realtime: new contribution
    RT-->>UI: Progress indicator shown

    SB->>EF: Database trigger fires
    EF->>EF: Validate content (length, rate limit)
    EF->>SB: UPDATE status: processing
    SB-->>RT: Realtime: status change
    RT-->>UI: "Extracting..." shown

    EF->>CL: POST structured extraction prompt
    CL-->>EF: JSON: artifacts, dimensions, relationships

    EF->>SB: BEGIN TRANSACTION
    EF->>SB: INSERT artifacts
    EF->>SB: INSERT dimension tags (with weights)
    EF->>SB: INSERT relationships
    EF->>SB: UPDATE contribution status: complete
    EF->>SB: COMMIT

    SB-->>RT: Realtime: new artifacts
    RT-->>UI: Artifacts appear in Explore
    RT-->>UI: Dimension counters update
    RT-->>UI: Graph adds new nodes

    SB-->>WH: Webhook: extraction_complete
```
