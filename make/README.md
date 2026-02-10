# Make.com Scenarios — ICC Integration Block

## Webhooks (Live)

| Webhook | URL | Purpose |
|---------|-----|---------|
| Transcript Webhook | `https://hook.us1.make.com/n947p48o1t005yewobmlq479v0ggltb8` | Receives transcript text for extraction |
| Artifact Submission | `https://hook.us1.make.com/7s4yuoquixc9bclvwmv3dr0ywuuomfbq` | Manual artifact creation from forms |
| Agent Observation | `https://hook.us1.make.com/w80cj0qfyur7hf916ircz54xjanaeabl` | Agent-submitted observations |

## Scenarios (Live)

| ID | Name | Trigger | Flow |
|----|------|---------|------|
| 4553338 | ICC - Transcript Ingestion | Transcript Webhook | Webhook → Supabase Edge Function (extract-transcript) → Claude → knowledge graph |
| 4553345 | ICC - Artifact Submission | Artifact Submission Webhook | Webhook → Supabase create_artifact() |
| *TBD* | ICC - Scheduled Synthesis | Daily schedule | Fetch recent artifacts → Claude synthesis → Create synthesis artifact |
| *TBD* | ICC - Commitment Tracker | Weekly schedule | Query open commitments → Send reminder emails |

## Architecture

The extraction pipeline runs as a **Supabase Edge Function** (`extract-transcript`), not inline in Make.com. This is cleaner:
- Atomic: extraction + DB writes happen in one function
- Testable: can call the Edge Function directly without Make.com
- Secrets stay in Supabase environment, not duplicated in Make.com modules

## Environment

Secrets stored in `.env` (gitignored):
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — database access
- `ANTHROPIC_API_KEY` — Claude extraction
- `MAKE_API_KEY` — scenario management

## Testing

```bash
# Test transcript webhook
curl -X POST https://hook.us1.make.com/n947p48o1t005yewobmlq479v0ggltb8 \
  -H "Content-Type: application/json" \
  -d '{"transcript": "Sample transcript text...", "session_title": "Test Session", "convergence_id": "00000000-0000-0000-0000-000000000100"}'

# Test artifact submission
curl -X POST https://hook.us1.make.com/7s4yuoquixc9bclvwmv3dr0ywuuomfbq \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Artifact", "summary": "A test.", "type": "idea", "created_by": "00000000-0000-0000-0000-000000001001", "convergence_id": "00000000-0000-0000-0000-000000000100", "tags": ["test"]}'
```
