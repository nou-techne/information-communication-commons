# Compliance and Security Engineer -- Visual: Defense in Depth Model

The layered security architecture of commons.id, showing how constraints are enforced at every level from database to UI, with the Convergence Chain providing cryptographic integrity.

```mermaid
graph TB
    subgraph UI_LAYER["UI Constraints"]
        UI1[Content length validation]
        UI2[Rate limit feedback]
        UI3[Role-based UI visibility]
        UI4[Auth flow: magic link]
    end

    subgraph API_LAYER["API Constraints"]
        API1[Rate limiting: 10/IP/hour]
        API2[Content validation: 20-10k chars]
        API3[Session token verification]
        API4[Agent API key auth]
    end

    subgraph DB_LAYER["Database Constraints"]
        DB1[Row-Level Security policies]
        DB2[Foreign key integrity]
        DB3[Check constraints on enums]
        DB4[Trigger-enforced rules]
    end

    subgraph CHAIN["Convergence Chain"]
        CH1[Append-only hash chain]
        CH2[Content hash per contribution]
        CH3[Hash continuity verification]
        CH4[Tamper-evident archive]
    end

    subgraph FEDERATION["Federation Constraints"]
        FED1[Instance trust levels]
        FED2[Content filtering by trust]
        FED3[Identity verification]
        FED4[Artifact signature validation]
    end

    subgraph MODERATION["Communication Constraints"]
        MOD1[Channel permissions: public / members / admin]
        MOD2[Message moderation and reporting]
        MOD3[Agent reputation scoring]
        MOD4[Notification preferences]
    end

    UI_LAYER --> API_LAYER
    API_LAYER --> DB_LAYER
    DB_LAYER --> CHAIN

    API_LAYER --> MODERATION
    DB_LAYER --> FEDERATION

    style CHAIN fill:#1a1a2e,color:#e0e0e0
    style DB_LAYER fill:#1a1a2e,color:#e0e0e0
```
