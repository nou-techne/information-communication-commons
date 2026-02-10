# Sprint 22: Workflow Orchestration

## Mode Switching Based on Convergence State

The Make.com scenarios adapt their behavior based on the current convergence state.

### Pre-Event Mode (`pre`)
- **Context Packages**: Daily scenario queries artifacts related to upcoming convergence themes and generates briefing documents
- **Participant Onboarding**: When new participants register, send welcome email with relevant artifact summaries
- Trigger: Convergence state = 'pre' AND date_start within 14 days

### During-Event Mode (`live`)  
- **Real-time Ingestion**: Transcript ingestion scenario runs continuously (already ACTIVE)
- **Live Extraction**: Incoming transcripts processed immediately for artifacts, connections, commitments
- **Event Feed**: All new artifacts pushed to real-time feed
- Trigger: Convergence state = 'live'

### Post-Event Mode (`post`)
- **Synthesis Generation**: Daily synthesis scenario activated — aggregates new artifacts into synthesis documents
- **Commitment Tracking**: Commitment tracker scenario sends weekly status checks
- **Follow-up Connections**: Identify cross-artifact patterns and suggest connections
- Trigger: Convergence state = 'post'

## Implementation

Each Make.com scenario includes a convergence state check at the start:
1. HTTP GET to Supabase: `/rest/v1/convergences?state=eq.{expected_state}&select=id`
2. If no matching convergence, scenario exits early
3. If matching, proceed with mode-specific logic

### Scenario IDs (us1.make.com, org 1480245)
- Transcript Ingestion: Already active
- Artifact Submission: Runs in all modes
- Daily Synthesis: Post-event only
- Commitment Tracker: Post-event only

# Sprint 23: Notifications

## Notification Scenario

### Daily Digest
- Runs daily at 09:00 UTC
- Queries new artifacts from last 24h
- Groups by participant interest areas (from `participants.interests[]`)
- Sends email digest via SendGrid/Resend

### Commitment Reminders
- Runs weekly on Mondays
- Queries commitments with status = 'made' or 'in_progress'
- If due_date approaching (< 7 days) or overdue, send reminder
- Updates `reminder_count` and `last_reminded_at`

### Connection Notifications
- Triggered by webhook when new `artifact_relationships` inserted
- Notifies stewards of both connected artifacts
- Includes relationship type and context

## Webhook Endpoints
- POST `/webhooks/notification/digest` — trigger daily digest
- POST `/webhooks/notification/commitment-reminder` — trigger commitment check
- Artifact relationship INSERT → automatic notification via Supabase webhook → Make.com
