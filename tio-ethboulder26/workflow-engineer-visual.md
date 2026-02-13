# Workflow Engineer -- Visual: Thread Resolution Workflow

The end-to-end flow from live discussion through thread resolution to knowledge graph artifact, showing how communication becomes structured knowledge.

```mermaid
flowchart TD
    subgraph DISCUSSION["Live Discussion"]
        M1[Message: Initial question]
        M2[Message: Perspective from Participant A]
        M3[Message: Counter-argument from Participant B]
        M4[Message: Synthesis from Participant C]
        M5[Message: Agreement and action items]
    end

    M1 --> M2 --> M3 --> M4 --> M5

    M5 --> RESOLVE{Resolve Thread?}
    RESOLVE -->|Yes| SUMMARY[Write Resolution Summary]
    RESOLVE -->|Not Yet| M1

    SUMMARY --> CREATE_ARTIFACT[Create Artifact from Resolution]
    CREATE_ARTIFACT --> TAG[Apply Dimension Tags]
    CREATE_ARTIFACT --> LINK_THREAD[Link to Source Thread]
    CREATE_ARTIFACT --> LINK_MESSAGES[Link to Key Messages]
    CREATE_ARTIFACT --> ATTRIBUTE[Attribute to All Participants]

    TAG --> GRAPH[Artifact in Knowledge Graph]
    LINK_THREAD --> GRAPH
    LINK_MESSAGES --> GRAPH
    ATTRIBUTE --> GRAPH

    GRAPH --> CHAIN[Append to Convergence Chain]

    subgraph CONSOLIDATION["Later: Consolidation"]
        GRAPH --> RELATED[Find Related Resolved Threads]
        RELATED --> MERGE[Consolidate into Summary Artifact]
        MERGE --> CHAIN2[Append to Convergence Chain]
    end

    subgraph ARCHIVAL["After Configurable Period"]
        GRAPH --> ARCHIVE[Archive Resolved Thread]
        ARCHIVE --> ACCESSIBLE[Accessible via Archive View]
    end
```
