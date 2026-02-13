# Schema Architect -- Visual: commons.id Entity-Relationship Model

The core entity model for commons.id mapped to REA ontology, showing how the four namespace types relate and how dimensions attach to artifacts.

```mermaid
erDiagram
    CONVERGENCE ||--o{ ARTIFACT : contains
    CONVERGENCE ||--o{ PARTICIPANT : hosts
    CONVERGENCE ||--o{ TENT : organizes
    CONVERGENCE ||--o{ SESSION : schedules
    CONVERGENCE {
        uuid id PK
        string name
        string slug
        jsonb theme
        jsonb dimensions
        date start_date
        date end_date
    }

    PARTICIPANT ||--o{ CONTRIBUTION : submits
    PARTICIPANT {
        uuid id PK
        string name
        string affiliation
        text bio
        string namespace_path
    }

    CONTRIBUTION ||--o{ ARTIFACT : produces
    CONTRIBUTION {
        uuid id PK
        uuid participant_id FK
        uuid convergence_id FK
        text raw_content
        string status
        timestamp created_at
    }

    ARTIFACT ||--o{ ARTIFACT_DIMENSION : tagged_with
    ARTIFACT ||--o{ ARTIFACT_RELATIONSHIP : source
    ARTIFACT {
        uuid id PK
        uuid convergence_id FK
        uuid contribution_id FK
        string type
        string title
        text content
        string namespace_path
    }

    ARTIFACT_DIMENSION {
        uuid artifact_id FK
        string dimension
        float weight
    }

    ARTIFACT_RELATIONSHIP {
        uuid source_id FK
        uuid target_id FK
        string relationship_type
    }

    TENT ||--o{ SESSION : hosts
    TENT {
        uuid id PK
        uuid convergence_id FK
        string name
        string namespace_path
    }

    SESSION ||--o{ CONTRIBUTION : scopes
    SESSION {
        uuid id PK
        uuid tent_id FK
        string title
        timestamp start_time
        timestamp end_time
    }
```
