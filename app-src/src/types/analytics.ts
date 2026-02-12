// Analytics Event Types

export type AnalyticsEventType =
  | 'page_view'
  | 'contribution_submitted'
  | 'contribution_processed'
  | 'thread_created'
  | 'thread_resolved'
  | 'message_sent'
  | 'graph_interaction'
  | 'graph_node_clicked'
  | 'graph_filtered'
  | 'graph_exported'
  | 'search_query'
  | 'dimension_explored'
  | 'artifact_created'
  | 'artifact_viewed'
  | 'webhook_registered'
  | 'api_key_created'

export interface PageViewEvent {
  type: 'page_view'
  path: string
  referrer?: string
  timestamp: string
}

export interface ContributionSubmittedEvent {
  type: 'contribution_submitted'
  contributionId: string
  contentLength: number
  timestamp: string
}

export interface ContributionProcessedEvent {
  type: 'contribution_processed'
  contributionId: string
  artifactsCreated: number
  processingTimeMs: number
  timestamp: string
}

export interface ThreadCreatedEvent {
  type: 'thread_created'
  threadId: string
  channelId: string
  hasInitialMessage: boolean
  timestamp: string
}

export interface ThreadResolvedEvent {
  type: 'thread_resolved'
  threadId: string
  reason: string
  messageCount: number
  timestamp: string
}

export interface MessageSentEvent {
  type: 'message_sent'
  threadId: string
  messageType: 'text' | 'image' | 'link' | 'file'
  contentLength: number
  timestamp: string
}

export interface GraphInteractionEvent {
  type: 'graph_interaction'
  action: 'zoom' | 'pan' | 'reset' | 'layout_change'
  timestamp: string
}

export interface GraphNodeClickedEvent {
  type: 'graph_node_clicked'
  nodeId: string
  nodeType: string
  timestamp: string
}

export interface GraphFilteredEvent {
  type: 'graph_filtered'
  nodeTypes: string[]
  edgeTypes: string[]
  dimensions: string[]
  minDegree: number
  timestamp: string
}

export interface GraphExportedEvent {
  type: 'graph_exported'
  format: 'json' | 'csv-nodes' | 'csv-edges' | 'dot'
  nodeCount: number
  edgeCount: number
  timestamp: string
}

export interface SearchQueryEvent {
  type: 'search_query'
  query: string
  resultCount: number
  filters?: {
    type?: string
    dimension?: string
  }
  timestamp: string
}

export interface DimensionExploredEvent {
  type: 'dimension_explored'
  dimension: string
  nodeCount: number
  timestamp: string
}

export interface ArtifactCreatedEvent {
  type: 'artifact_created'
  artifactId: string
  artifactType: string
  sourceType: 'contribution' | 'thread_consolidation' | 'manual'
  timestamp: string
}

export interface ArtifactViewedEvent {
  type: 'artifact_viewed'
  artifactId: string
  artifactType: string
  timestamp: string
}

export interface WebhookRegisteredEvent {
  type: 'webhook_registered'
  eventTypes: string[]
  timestamp: string
}

export interface ApiKeyCreatedEvent {
  type: 'api_key_created'
  keyType: 'live' | 'test'
  timestamp: string
}

// Discriminated union of all event types
export type AnalyticsEvent =
  | PageViewEvent
  | ContributionSubmittedEvent
  | ContributionProcessedEvent
  | ThreadCreatedEvent
  | ThreadResolvedEvent
  | MessageSentEvent
  | GraphInteractionEvent
  | GraphNodeClickedEvent
  | GraphFilteredEvent
  | GraphExportedEvent
  | SearchQueryEvent
  | DimensionExploredEvent
  | ArtifactCreatedEvent
  | ArtifactViewedEvent
  | WebhookRegisteredEvent
  | ApiKeyCreatedEvent

// Helper to create analytics event with automatic timestamp
export function createAnalyticsEvent<T extends AnalyticsEvent>(
  event: Omit<T, 'timestamp'>
): T {
  return {
    ...event,
    timestamp: new Date().toISOString(),
  } as T
}

// Analytics session metadata
export interface AnalyticsSession {
  sessionId: string
  userId?: string
  convergenceId?: string
  startTime: string
  lastActivity: string
  eventCount: number
}
