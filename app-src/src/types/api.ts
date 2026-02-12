// API Request/Response Types for commons.id

// ===== Contributions =====
export interface CreateContributionRequest {
  content: string
  participant_id?: string
}

export interface CreateContributionResponse {
  contribution_id: string
  status: 'processing' | 'complete' | 'failed'
  artifacts?: string[]
}

export interface GetContributionRequest {
  id: string
}

export interface GetContributionResponse {
  id: string
  content: string
  participant_id: string | null
  status: string
  created_at: string
  artifacts: Array<{ id: string; title: string }>
}

// ===== Threads =====
export interface CreateThreadRequest {
  channel_id: string
  title: string
  initial_message?: string
}

export interface CreateThreadResponse {
  thread_id: string
  status: 'open'
}

export interface ListThreadsRequest {
  channel_id: string
  status?: 'open' | 'tagged' | 'resolved' | 'consolidated' | 'archived'
  limit?: number
  offset?: number
}

export interface ListThreadsResponse {
  threads: Array<{
    id: string
    title: string
    status: string
    message_count: number
    created_at: string
    updated_at: string
  }>
  total: number
}

// ===== Messages =====
export interface CreateMessageRequest {
  thread_id: string
  content: string
  type?: 'text' | 'contribution' | 'system'
}

export interface CreateMessageResponse {
  message_id: string
  created_at: string
}

export interface ListMessagesRequest {
  thread_id: string
  limit?: number
  offset?: number
}

export interface ListMessagesResponse {
  messages: Array<{
    id: string
    author_id: string | null
    content: string
    type: string
    created_at: string
    reactions?: Array<{ emoji: string; count: number }>
  }>
  total: number
}

// ===== Participants =====
export interface GetParticipantRequest {
  id: string
}

export interface GetParticipantResponse {
  id: string
  name: string
  affiliation?: string
  bio?: string
  contribution_count: number
  artifact_count: number
}

export interface ListParticipantsRequest {
  limit?: number
  offset?: number
}

export interface ListParticipantsResponse {
  participants: Array<{
    id: string
    name: string
    contribution_count: number
  }>
  total: number
}

// ===== Artifacts =====
export interface GetArtifactRequest {
  id: string
}

export interface GetArtifactResponse {
  id: string
  title: string
  description: string
  rea_role: 'resource' | 'event' | 'agent'
  type?: string
  created_at: string
  tags: string[]
  relationships: Array<{
    target_id: string
    type: string
  }>
}

export interface ListArtifactsRequest {
  dimension?: string
  rea_role?: 'resource' | 'event' | 'agent'
  limit?: number
  offset?: number
}

export interface ListArtifactsResponse {
  artifacts: Array<{
    id: string
    title: string
    rea_role: string
    created_at: string
  }>
  total: number
}

// ===== Graph =====
export interface GetGraphRequest {
  convergence_id?: string
  include_dimensions?: boolean
}

export interface GetGraphResponse {
  nodes: Array<{
    id: string
    title: string
    type: string
    rea_role: string
  }>
  links: Array<{
    source: string
    target: string
    type: string
  }>
}

// ===== Search =====
export interface SearchRequest {
  query: string
  type?: 'artifacts' | 'contributions' | 'messages' | 'participants' | 'all'
  limit?: number
  offset?: number
}

export interface SearchResponse {
  results: Array<{
    id: string
    type: 'artifact' | 'contribution' | 'message' | 'participant'
    title: string
    snippet: string
    score: number
  }>
  total: number
}

// ===== Tags =====
export interface AddTagRequest {
  thread_id: string
  tag_type: 'dimension' | 'topic' | 'artifact_type' | 'custom'
  tag_value: string
}

export interface AddTagResponse {
  tag_id: string
}

export interface SuggestTagsRequest {
  thread_id: string
}

export interface SuggestTagsResponse {
  suggestions: Array<{
    tag_type: string
    tag_value: string
    confidence: number
  }>
}

export type HLAMTDimension = 'e' | 'H' | 'L' | 'A' | 'M' | 'T' | 'ecology' | 'human' | 'language' | 'artifact' | 'methodology' | 'training'

