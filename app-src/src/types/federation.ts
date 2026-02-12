// Federation Protocol Types

export type ContentHash = string // SHA-256 hash in hex format

export interface PeerNode {
  id: string // peer node ID (public key hash or domain)
  name: string
  endpoint: string // URL for federation endpoint
  publicKey?: string // For signature verification
  lastSeen?: string // ISO 8601 timestamp
  status: 'online' | 'offline' | 'unknown'
  capabilities: PeerCapability[]
  metadata?: {
    version?: string
    description?: string
    convergences?: string[]
  }
}

export type PeerCapability =
  | 'sync'
  | 'search'
  | 'publish'
  | 'subscribe'
  | 'resolve'
  | 'webhook'

export type FederationMessageType =
  | 'announce'
  | 'sync-request'
  | 'sync-response'
  | 'share'
  | 'query'
  | 'query-response'
  | 'subscribe'
  | 'unsubscribe'
  | 'ping'
  | 'pong'

export interface FederationMessage<T = any> {
  id: string
  type: FederationMessageType
  from: string // peer ID
  to?: string // peer ID (optional, null for broadcast)
  timestamp: string // ISO 8601
  payload: T
  signature?: string // Message signature for verification
  contentHash?: ContentHash // Hash of payload for integrity check
}

// Announce: Peer declares presence and capabilities
export interface AnnouncePayload {
  peer: PeerNode
  convergences: string[] // List of convergence IDs this peer hosts
}

// Sync Request: Ask for data since timestamp
export interface SyncRequestPayload {
  convergenceId: string
  since?: string // ISO 8601 timestamp
  entityTypes?: ('contributions' | 'threads' | 'artifacts' | 'participants')[]
  maxItems?: number
}

// Sync Response: Return requested data
export interface SyncResponsePayload {
  convergenceId: string
  contributions: any[]
  threads: any[]
  artifacts: any[]
  participants: any[]
  hasMore: boolean
  continuationToken?: string
}

// Share: Publish new content to network
export interface SharePayload {
  convergenceId: string
  entityType: 'contribution' | 'thread' | 'artifact' | 'participant'
  entityId: string
  contentHash: ContentHash
  data: any
}

// Query: Search across federated nodes
export interface QueryPayload {
  query: string
  convergenceId?: string
  filters?: {
    type?: string
    dimension?: string
    dateRange?: { start: string; end: string }
  }
  limit?: number
}

// Query Response: Search results
export interface QueryResponsePayload {
  query: string
  results: Array<{
    contentHash: ContentHash
    entityType: string
    entityId: string
    convergenceId: string
    snippet?: string
    score?: number
  }>
  totalResults: number
}

// Content addressable entity (base interface)
export interface ContentAddressable {
  contentHash: ContentHash
  data: any
  metadata: {
    created_at: string
    created_by?: string
    convergence_id?: string
  }
}

// Federation sync state
export interface FederationSyncState {
  peerId: string
  convergenceId: string
  lastSyncTime: string
  lastSyncHash?: ContentHash
  itemCount: number
  status: 'synced' | 'syncing' | 'error'
  errorMessage?: string
}

// Helper functions

/**
 * Create a federation message
 */
export function createFederationMessage<T>(
  type: FederationMessageType,
  from: string,
  payload: T,
  to?: string
): FederationMessage<T> {
  return {
    id: generateMessageId(),
    type,
    from,
    to,
    timestamp: new Date().toISOString(),
    payload,
  }
}

/**
 * Generate unique message ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Compute SHA-256 hash of data (placeholder - requires crypto API)
 */
export async function computeContentHash(data: any): Promise<ContentHash> {
  const json = JSON.stringify(data)
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(json)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Verify content hash
 */
export async function verifyContentHash(data: any, hash: ContentHash): Promise<boolean> {
  const computed = await computeContentHash(data)
  return computed === hash
}

/**
 * Check if peer has capability
 */
export function hasCapability(peer: PeerNode, capability: PeerCapability): boolean {
  return peer.capabilities.includes(capability)
}
