# Webhook Events

**Sprint 54** — Real-time event notifications for external integrations

## Status

**Deferred to post-ETHBoulder.** Webhooks enable third-party integrations to receive real-time notifications when events occur in the knowledge graph. Not critical for Feb 13-16 event since no external integrations are configured. Becomes valuable post-event when tools want to build on the commons.

## Rationale

- **Event priority:** ETHBoulder starts in ~36 hours. Focus on participant-facing features
- **No webhook subscribers:** No external tools configured to receive webhooks
- **Dependency on Sprint 53:** Public API should exist before webhooks (provides canonical event schemas)
- **Post-event value:** After event, can identify which events external tools actually need

## Use Cases

**Discord/Slack bot integration:**
- New contribution → post to #convergence channel
- Artifact extracted → notify stewards for review
- Session created → announce in event server

**Analytics platforms:**
- Stream events to data warehouse for analysis
- Build dashboards from real-time event feed
- Track participation patterns

**Email notifications:**
- Participant mentioned → send notification
- Contribution approved → notify author
- Artifact linked to yours → notify steward

**External automation:**
- New pattern artifact → add to pattern library
- Commitment artifact → create calendar event
- Question artifact → route to support team

## Event Types

### contribution.created

**Fired when:** New contribution submitted

**Payload:**
```json
{
  "event": "contribution.created",
  "timestamp": "2026-02-13T10:30:00Z",
  "convergence_id": "uuid",
  "data": {
    "id": "uuid",
    "content": "Observation text...",
    "participant": {
      "id": "uuid",
      "name": "Alice"
    },
    "session_id": "uuid",
    "status": "pending"
  },
  "url": "https://ethboulder.commons.id/app/contribution/{id}"
}
```

### contribution.processed

**Fired when:** Contribution extraction complete

**Payload:**
```json
{
  "event": "contribution.processed",
  "timestamp": "2026-02-13T10:30:15Z",
  "convergence_id": "uuid",
  "data": {
    "id": "uuid",
    "status": "complete",
    "processing_time_ms": 15234,
    "artifacts_extracted": 3,
    "dimensions": [
      {"key": "hlamt:H", "weight": 0.8}
    ]
  }
}
```

### artifact.created

**Fired when:** New artifact extracted or manually created

**Payload:**
```json
{
  "event": "artifact.created",
  "timestamp": "2026-02-13T10:30:15Z",
  "convergence_id": "uuid",
  "data": {
    "id": "uuid",
    "title": "Pattern: Knowledge Graphs",
    "type": "pattern",
    "rea_role": "resource",
    "steward": {
      "id": "uuid",
      "name": "Alice"
    },
    "source_contribution_id": "uuid"
  },
  "url": "https://ethboulder.commons.id/app/artifact/{id}"
}
```

### artifact.updated

**Fired when:** Artifact edited

**Payload:**
```json
{
  "event": "artifact.updated",
  "timestamp": "2026-02-13T12:00:00Z",
  "convergence_id": "uuid",
  "data": {
    "id": "uuid",
    "changes": {
      "title": {
        "old": "Pattern: Graphs",
        "new": "Pattern: Knowledge Graphs"
      }
    },
    "updated_by": {
      "id": "uuid",
      "name": "Bob"
    }
  }
}
```

### relationship.created

**Fired when:** Relationship created between artifacts

**Payload:**
```json
{
  "event": "relationship.created",
  "timestamp": "2026-02-13T11:00:00Z",
  "convergence_id": "uuid",
  "data": {
    "from_artifact_id": "uuid",
    "to_artifact_id": "uuid",
    "relationship_type": "extends",
    "weight": 0.8,
    "created_by": {
      "id": "uuid",
      "name": "Alice"
    }
  }
}
```

### session.created

**Fired when:** New session created

**Payload:**
```json
{
  "event": "session.created",
  "timestamp": "2026-02-13T09:00:00Z",
  "convergence_id": "uuid",
  "data": {
    "id": "uuid",
    "title": "Opening Keynote",
    "track": "main",
    "session_type": "talk",
    "speakers": ["Alice", "Bob"],
    "scheduled_at": "2026-02-13T10:00:00Z"
  }
}
```

### participant.joined

**Fired when:** New participant creates account or makes first contribution

**Payload:**
```json
{
  "event": "participant.joined",
  "timestamp": "2026-02-13T10:00:00Z",
  "convergence_id": "uuid",
  "data": {
    "id": "uuid",
    "name": "Charlie",
    "affiliation": "Techne",
    "first_contribution_id": "uuid"
  }
}
```

## Database Schema

```sql
-- Webhook subscriptions per convergence
CREATE TABLE webhook_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convergence_id uuid REFERENCES convergences(id) ON DELETE CASCADE,
  url text NOT NULL,
  events text[] NOT NULL,  -- Array of event types to subscribe to
  secret text NOT NULL,    -- HMAC secret for signature verification
  active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_events CHECK (
    events <@ ARRAY[
      'contribution.created',
      'contribution.processed',
      'artifact.created',
      'artifact.updated',
      'relationship.created',
      'session.created',
      'participant.joined'
    ]
  )
);

CREATE INDEX idx_webhook_subs_convergence ON webhook_subscriptions(convergence_id) WHERE active = true;

-- Webhook delivery log
CREATE TABLE webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  response_status int,
  response_body text,
  error text,
  attempts int DEFAULT 0,
  next_retry_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_webhook_deliveries_retry ON webhook_deliveries(next_retry_at) 
  WHERE delivered_at IS NULL AND attempts < 5;
```

## Implementation

### Edge Function: webhook-dispatcher

**Triggered by:** Database triggers on event tables

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

interface WebhookEvent {
  event: string
  timestamp: string
  convergence_id: string
  data: any
  url?: string
}

async function dispatchWebhook(
  subscriptionId: string,
  webhookUrl: string,
  secret: string,
  event: WebhookEvent
): Promise<void> {
  const payload = JSON.stringify(event)
  
  // Generate HMAC signature
  const signature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event.event,
        'User-Agent': 'commons.id-webhooks/1.0'
      },
      body: payload,
      signal: AbortSignal.timeout(10000)  // 10s timeout
    })
    
    // Log delivery
    await supabase.from('webhook_deliveries').insert({
      subscription_id: subscriptionId,
      event_type: event.event,
      payload: event,
      response_status: response.status,
      response_body: await response.text(),
      delivered_at: response.ok ? new Date().toISOString() : null,
      attempts: 1,
      next_retry_at: response.ok ? null : new Date(Date.now() + 60000).toISOString()
    })
    
  } catch (error) {
    // Log failure
    await supabase.from('webhook_deliveries').insert({
      subscription_id: subscriptionId,
      event_type: event.event,
      payload: event,
      error: error.message,
      attempts: 1,
      next_retry_at: new Date(Date.now() + 60000).toISOString()
    })
  }
}

serve(async (req) => {
  const event: WebhookEvent = await req.json()
  
  // Find active subscriptions for this event type
  const { data: subscriptions } = await supabase
    .from('webhook_subscriptions')
    .select('*')
    .eq('convergence_id', event.convergence_id)
    .eq('active', true)
    .contains('events', [event.event])
  
  // Dispatch to all subscribers (parallel)
  await Promise.all(
    subscriptions.map(sub => 
      dispatchWebhook(sub.id, sub.url, sub.secret, event)
    )
  )
  
  return new Response('OK', { status: 200 })
})
```

### Database Trigger: Fire on contribution insert

```sql
CREATE OR REPLACE FUNCTION notify_contribution_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Fire webhook via pg_net (async HTTP request)
  PERFORM net.http_post(
    url := 'https://hvbdpgkdcdskhpbdeeim.supabase.co/functions/v1/webhook-dispatcher',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'event', 'contribution.created',
      'timestamp', now(),
      'convergence_id', NEW.convergence_id,
      'data', jsonb_build_object(
        'id', NEW.id,
        'content', NEW.content,
        'participant', jsonb_build_object(
          'id', p.id,
          'name', p.name
        ),
        'session_id', NEW.session_id,
        'status', NEW.status
      ),
      'url', 'https://ethboulder.commons.id/app/contribution/' || NEW.id
    )
  )
  FROM participants p
  WHERE p.id = NEW.participant_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contribution_created_webhook
  AFTER INSERT ON contributions
  FOR EACH ROW
  EXECUTE FUNCTION notify_contribution_created();
```

### Retry Logic

**Cron job to retry failed deliveries:**

```typescript
// Edge function: webhook-retry (runs every minute)
const { data: failedDeliveries } = await supabase
  .from('webhook_deliveries')
  .select('*, subscription:webhook_subscriptions(*)')
  .is('delivered_at', null)
  .lt('attempts', 5)
  .lte('next_retry_at', new Date().toISOString())
  .limit(100)

for (const delivery of failedDeliveries) {
  const backoffMs = Math.pow(2, delivery.attempts) * 60000  // Exponential backoff
  
  try {
    const response = await fetch(delivery.subscription.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': generateSignature(delivery.payload, delivery.subscription.secret),
        'X-Webhook-Retry': delivery.attempts.toString()
      },
      body: JSON.stringify(delivery.payload)
    })
    
    if (response.ok) {
      // Mark delivered
      await supabase.from('webhook_deliveries')
        .update({ 
          delivered_at: new Date().toISOString(),
          response_status: response.status 
        })
        .eq('id', delivery.id)
    } else {
      // Schedule next retry
      await supabase.from('webhook_deliveries')
        .update({ 
          attempts: delivery.attempts + 1,
          next_retry_at: new Date(Date.now() + backoffMs).toISOString(),
          response_status: response.status
        })
        .eq('id', delivery.id)
    }
  } catch (error) {
    // Schedule next retry
    await supabase.from('webhook_deliveries')
      .update({ 
        attempts: delivery.attempts + 1,
        next_retry_at: new Date(Date.now() + backoffMs).toISOString(),
        error: error.message
      })
      .eq('id', delivery.id)
  }
}
```

**Retry schedule:**
- Attempt 1: Immediate
- Attempt 2: +1 minute
- Attempt 3: +2 minutes
- Attempt 4: +4 minutes
- Attempt 5: +8 minutes
- After 5 attempts: Mark as permanently failed

## Security

**HMAC signature verification:**

```typescript
// Receiver side (external service)
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return signature === expectedSignature
}

// Example webhook receiver
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature']
  const payload = JSON.stringify(req.body)
  
  if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' })
  }
  
  // Process webhook event
  console.log('Received event:', req.body.event)
  
  res.status(200).json({ received: true })
})
```

## Management UI

**Create subscription (in app):**

```tsx
function WebhookSubscriptions() {
  const [url, setUrl] = useState('')
  const [events, setEvents] = useState<string[]>([])
  
  async function createSubscription() {
    const secret = generateRandomString(32)
    
    const { data } = await supabase
      .from('webhook_subscriptions')
      .insert({
        convergence_id: currentConvergence.id,
        url,
        events,
        secret,
        created_by: user.id
      })
      .select()
      .single()
    
    // Show secret once (user must save it)
    alert(`Webhook created! Secret: ${secret}\nSave this - it will not be shown again.`)
  }
  
  return (
    <div>
      <h2>Webhook Subscriptions</h2>
      <input 
        placeholder="Webhook URL"
        value={url}
        onChange={e => setUrl(e.target.value)}
      />
      <fieldset>
        <legend>Events</legend>
        {EVENT_TYPES.map(type => (
          <label key={type}>
            <input 
              type="checkbox"
              checked={events.includes(type)}
              onChange={e => {
                if (e.target.checked) {
                  setEvents([...events, type])
                } else {
                  setEvents(events.filter(t => t !== type))
                }
              }}
            />
            {type}
          </label>
        ))}
      </fieldset>
      <button onClick={createSubscription}>Create Subscription</button>
    </div>
  )
}
```

## Testing

**Webhook.site integration:**

1. Go to https://webhook.site
2. Copy unique URL
3. Create subscription with that URL
4. Trigger event (create contribution)
5. See webhook payload in webhook.site

**Local testing with ngrok:**

```bash
# Start local webhook receiver
node webhook-receiver.js  # Listening on :3000

# Expose via ngrok
ngrok http 3000

# Use ngrok URL in subscription
```

## Acceptance Criteria (Deferred)

- [x] Webhook events plan documented
- [ ] 7 event types implemented (contribution.created, contribution.processed, artifact.created, etc.)
- [ ] Webhooks fire within 5s of event
- [ ] HMAC signature verification
- [ ] Retry logic with exponential backoff (5 attempts max)
- [ ] Delivery log table with status tracking
- [ ] Management UI for creating/revoking subscriptions

**Target completion:** Post-ETHBoulder (Feb 17+)

## Priority

**Medium.** Webhooks become valuable when:
- External tools need real-time notifications
- Automation workflows trigger on events
- Analytics platforms stream data
- Chat bots post updates

For initial event capture, internal real-time (Supabase subscriptions in app) is sufficient.

## Notes

This sprint demonstrates the value of event-driven architecture. Once webhooks exist, external tools can build on the commons without polling APIs or custom integrations.

The implementation uses Supabase pg_net for async HTTP requests from database triggers, avoiding blocking on slow webhook receivers.
