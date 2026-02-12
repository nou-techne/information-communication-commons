// Webhook Payload Serializer & HMAC Signature

import type { WebhookEvent, WebhookEventType, WebhookEventPayload } from '../types/webhooks'

/**
 * Serialize an event into a webhook payload
 */
export function serializeEvent<T extends WebhookEventType>(
  type: T,
  data: WebhookEventPayload[T],
  convergenceId?: string
): WebhookEvent<WebhookEventPayload[T]> {
  return {
    id: generateEventId(),
    type,
    created_at: new Date().toISOString(),
    data,
    convergence_id: convergenceId,
  }
}

/**
 * Sign a webhook payload using HMAC-SHA256
 * @param payload - JSON string or object to sign
 * @param secret - Webhook secret
 * @returns Hex-encoded HMAC signature
 */
export async function signPayload(payload: string | object, secret: string): Promise<string> {
  const message = typeof payload === 'string' ? payload : JSON.stringify(payload)
  
  // Convert secret and message to Uint8Array
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(message)

  // Import key for HMAC
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  // Generate signature
  const signature = await crypto.subtle.sign('HMAC', key, messageData)

  // Convert to hex string
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Verify a webhook signature
 * @param payload - Original payload
 * @param signature - Signature to verify
 * @param secret - Webhook secret
 * @returns True if signature is valid
 */
export async function verifySignature(
  payload: string | object,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedSignature = await signPayload(payload, secret)
  return expectedSignature === signature
}

/**
 * Prepare a webhook delivery (payload + headers)
 */
export async function prepareDelivery(
  event: WebhookEvent,
  secret: string
): Promise<{
  body: string
  headers: Record<string, string>
}> {
  const body = JSON.stringify(event)
  const signature = await signPayload(body, secret)

  return {
    body,
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Event': event.type,
      'X-Webhook-Id': event.id,
      'X-Webhook-Timestamp': event.created_at,
    },
  }
}

/**
 * Generate a unique event ID
 */
function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Example: Create a webhook delivery from an app event
 */
export async function createWebhookDelivery<T extends WebhookEventType>(
  eventType: T,
  eventData: WebhookEventPayload[T],
  webhookSecret: string,
  convergenceId?: string
) {
  const event = serializeEvent(eventType, eventData, convergenceId)
  return prepareDelivery(event, webhookSecret)
}
