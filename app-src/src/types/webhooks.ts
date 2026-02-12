// Webhook Event Types & Payloads

export type WebhookEventType =
  | 'contribution.created'
  | 'contribution.processed'
  | 'thread.created'
  | 'thread.resolved'
  | 'thread.consolidated'
  | 'thread.archived'
  | 'message.sent'
  | 'message.edited'
  | 'artifact.created'
  | 'artifact.tagged'
  | 'participant.joined'
  | 'reaction.added'

export type DeliveryStatus = 'pending' | 'sent' | 'failed' | 'retrying'

export interface WebhookEvent<T = unknown> {
  id: string
  type: WebhookEventType
  created_at: string
  data: T
  convergence_id?: string
}

// Contribution Events
export interface ContributionCreatedPayload {
  contribution_id: string
  content: string
  participant_id: string | null
  created_at: string
}

export interface ContributionProcessedPayload {
  contribution_id: string
  status: 'complete' | 'failed'
  artifacts_created: number
  error?: string
}

// Thread Events
export interface ThreadCreatedPayload {
  thread_id: string
  channel_id: string
  title: string
  created_by: string | null
  created_at: string
}

export interface ThreadResolvedPayload {
  thread_id: string
  reason: string
  summary: string
  resolved_by: string
  resolved_at: string
}

export interface ThreadConsolidatedPayload {
  thread_id: string
  artifact_id: string
  consolidated_at: string
}

export interface ThreadArchivedPayload {
  thread_id: string
  archived_at: string
}

// Message Events
export interface MessageSentPayload {
  message_id: string
  thread_id: string
  author_id: string | null
  content: string
  type: 'text' | 'contribution' | 'system'
  created_at: string
}

export interface MessageEditedPayload {
  message_id: string
  thread_id: string
  old_content: string
  new_content: string
  edited_at: string
}

// Artifact Events
export interface ArtifactCreatedPayload {
  artifact_id: string
  title: string
  rea_role: 'resource' | 'event' | 'agent'
  contribution_id?: string
  created_at: string
}

export interface ArtifactTaggedPayload {
  artifact_id: string
  tag: string
  tagged_by: string
  tagged_at: string
}

// Participant Events
export interface ParticipantJoinedPayload {
  participant_id: string
  name: string
  joined_at: string
}

// Reaction Events
export interface ReactionAddedPayload {
  message_id: string
  participant_id: string
  emoji: string
  created_at: string
}

// Webhook Subscription
export interface WebhookSubscription {
  id: string
  url: string
  events: WebhookEventType[]
  secret: string
  active: boolean
  created_at: string
  updated_at: string
}

// Webhook Delivery Log
export interface WebhookDelivery {
  id: string
  subscription_id: string
  event_id: string
  event_type: WebhookEventType
  url: string
  status: DeliveryStatus
  attempts: number
  last_attempt_at?: string
  next_retry_at?: string
  response_status?: number
  response_body?: string
  created_at: string
}

// Type-safe event payload map
export type WebhookEventPayload = {
  'contribution.created': ContributionCreatedPayload
  'contribution.processed': ContributionProcessedPayload
  'thread.created': ThreadCreatedPayload
  'thread.resolved': ThreadResolvedPayload
  'thread.consolidated': ThreadConsolidatedPayload
  'thread.archived': ThreadArchivedPayload
  'message.sent': MessageSentPayload
  'message.edited': MessageEditedPayload
  'artifact.created': ArtifactCreatedPayload
  'artifact.tagged': ArtifactTaggedPayload
  'participant.joined': ParticipantJoinedPayload
  'reaction.added': ReactionAddedPayload
}
