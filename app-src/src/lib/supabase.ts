import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hvbdpgkdcdskhpbdeeim.supabase.co'
const supabaseAnonKey = 'sb_publishable_kB69BlNpkNhOllwGMOE6xg_i4l1VHMv'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export type ArtifactType = 'idea' | 'proposal' | 'commitment' | 'pattern' | 'synthesis' | 'question' | 'reflection'
export type ArtifactState = 'seed' | 'discussed' | 'proposed' | 'committed' | 'active' | 'completed' | 'archived' | 'superseded'
export type ReaRole = 'resource' | 'event' | 'agent'
export type AgentType = 'human' | 'non-human'
export type CommitmentStatus = 'made' | 'in_progress' | 'fulfilled' | 'broken' | 'deferred'

export interface Artifact {
  id: string
  title: string
  summary: string | null
  body: string | null
  type: ArtifactType
  state: ArtifactState
  origin_convergence_id: string | null
  origin_session_id: string | null
  created_by: string | null
  created_by_agent: string | null
  rea_role: ReaRole | null
  agent_type: AgentType | null
  steward_id: string | null
  created_at: string
  updated_at: string
}

export interface Commitment {
  id: string
  artifact_id: string | null
  participant_id: string
  description: string
  status: CommitmentStatus
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  type: string
  entity_type: string
  entity_id: string
  actor_type: string
  actor_id: string | null
  data: Record<string, unknown>
  convergence_id: string | null
  created_at: string
}

export interface ArtifactRelationship {
  id: string
  from_artifact_id: string
  to_artifact_id: string
  type: string
  created_by: string | null
  created_at: string
}

export interface Participant {
  id: string
  auth_user_id: string | null
  name: string
  affiliation: string | null
  bio: string | null
  interests: string[]
  created_at: string
}

export const ARTIFACT_COLORS: Record<ArtifactType, string> = {
  idea: '#5b9de4',       // sky blue
  proposal: '#3d7cc9',   // bright blue
  commitment: '#f4d9a0', // warm gold
  pattern: '#7ccfb8',    // mint
  synthesis: '#a8d4f0',  // pale blue
  question: '#c4b5fd',   // violet
  reflection: '#fca5a5', // rose
}

export const REA_COLORS: Record<ReaRole, string> = {
  resource: '#4a8c6f',  // green — stocks of capacity
  event: '#c4956a',     // amber — transformations
  agent: '#8bbfff',     // blue — participants with agency
}

export const REA_LABELS: Record<ReaRole, string> = {
  resource: 'Resource',
  event: 'Event',
  agent: 'Agent',
}

export const AGENT_TYPE_COLORS: Record<AgentType, string> = {
  human: '#c4956a',      // warm amber
  'non-human': '#8bbfff', // cool blue
}

export const AGENT_TYPE_LABELS: Record<AgentType, string> = {
  human: 'Human',
  'non-human': 'Non-Human',
}

export const STATE_LABELS: Record<ArtifactState, string> = {
  seed: 'Seed',
  discussed: 'Discussed',
  proposed: 'Proposed',
  committed: 'Committed',
  active: 'Active',
  completed: 'Completed',
  archived: 'Archived',
  superseded: 'Superseded',
}
