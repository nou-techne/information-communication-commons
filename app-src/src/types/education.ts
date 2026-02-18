/**
 * Education Content Types — Member Accessibility System
 * 
 * Sprint Q64: Schema for education content, glossary, learning paths.
 * 
 * The system must teach as it operates. Every interface should make
 * the *why* as clear as the *what*.
 */

// ─── Content Types ───────────────────────────────────────────────────

export type ContentType = 
  | 'glossary_term'      // single term definition
  | 'explainer'          // feature/concept explanation
  | 'walkthrough'        // step-by-step guide
  | 'faq'               // question + answer
  | 'tooltip'           // brief contextual help text

export type Topic =
  | 'patronage'         // patronage accounting, contributions, allocations
  | 'royalties'         // venture royalties, vesting, revenue share
  | 'governance'        // voting, proposals, period close
  | 'rea'              // REA ontology, events, agents, resources
  | 'cooperative_law'   // LCA, Subchapter K, 704(b), K-1
  | 'chain'            // merkle chain, hash verification, anchoring
  | 'membership'       // tiers, onboarding, participation
  | 'treasury'         // accounts, double-entry, transactions
  | 'general'          // cooperative economics, Techne model

export type ComplexityLevel =
  | 'newcomer'         // no prior knowledge assumed
  | 'practitioner'     // has basic understanding, wants depth
  | 'steward'          // governance-level understanding needed

// ─── Content Schema ──────────────────────────────────────────────────

export interface EducationContent {
  id: string
  type: ContentType
  title: string
  
  // Content body (Markdown)
  briefText: string           // tooltip-length (≤ 280 chars)
  fullText: string            // full explanation (Markdown)
  
  // Classification
  topic: Topic
  topics?: Topic[]            // can belong to multiple topics
  complexity: ComplexityLevel
  
  // UI context linkage
  helpContexts: string[]      // e.g., ['capital-account-balance', 'dashboard-ytd']
  
  // Relationships
  relatedTermIds?: string[]   // links to other education content
  prerequisiteIds?: string[]  // must read these first
  
  // Metadata
  version: number
  author: string              // TIO role or member
  createdAt: string
  updatedAt: string
  published: boolean
  
  // Analytics (tracked separately)
  viewCount?: number
  helpfulCount?: number
}

// ─── Glossary Term ───────────────────────────────────────────────────

export interface GlossaryTerm extends EducationContent {
  type: 'glossary_term'
  
  // Glossary-specific fields
  plainDefinition: string     // plain English, no jargon
  formalDefinition: string    // precise/legal definition
  example: string             // concrete example
  relatedTerms: string[]      // term names (not IDs)
  
  // Etymology / context
  origin?: string             // where this term comes from
  commonMisunderstandings?: string[]
}

// ─── Learning Path ───────────────────────────────────────────────────

export interface LearningPath {
  id: string
  name: string
  description: string
  topic: Topic
  complexity: ComplexityLevel
  
  // Ordered steps
  steps: LearningStep[]
  
  // Completion
  estimatedMinutes: number
  completionUnlocks?: string[]  // governance tiers, features, etc.
  
  createdAt: string
  updatedAt: string
  published: boolean
}

export interface LearningStep {
  order: number
  contentId: string           // references EducationContent.id
  title: string
  description: string
  interactiveElement?: string // e.g., 'show-my-capital-account', 'submit-test-contribution'
  
  // Checkpoint (optional quiz/verification)
  checkpointQuestion?: string
  checkpointAnswer?: string
}

// ─── Member Learning Progress ────────────────────────────────────────

export interface MemberLearningProgress {
  memberId: string
  pathId: string
  
  completedSteps: number[]    // step order numbers completed
  startedAt: string
  lastAccessedAt: string
  completedAt?: string
  
  // Quiz/checkpoint results
  checkpointResults?: Array<{
    stepOrder: number
    passed: boolean
    attemptedAt: string
  }>
}

// ─── Chain Event Payloads ────────────────────────────────────────────

export interface EducationArticleCreatedPayload {
  contentId: string
  type: ContentType
  title: string
  topic: Topic
  complexity: ComplexityLevel
  author: string
  createdAt: string
  helpContexts: string[]
}

export interface GlossaryUpdatedPayload {
  termId: string
  term: string
  updatedBy: string
  updatedAt: string
  version: number
  changes: string   // human-readable summary
}

export interface LearningPathCreatedPayload {
  pathId: string
  name: string
  topic: Topic
  stepCount: number
  estimatedMinutes: number
  createdBy: string
  createdAt: string
}

// ─── Predefined Learning Paths ───────────────────────────────────────

export const LEARNING_PATHS = {
  NEW_MEMBER_ONBOARDING: 'path-new-member-onboarding',
  UNDERSTANDING_CONTRIBUTIONS: 'path-understanding-contributions',
  HOW_ROYALTIES_WORK: 'path-how-royalties-work',
  GOVERNANCE_PARTICIPATION: 'path-governance-participation',
  READING_YOUR_K1: 'path-reading-your-k1',
} as const

// ─── Predefined Help Contexts ────────────────────────────────────────

/**
 * Help context tags map to UI elements.
 * Format: page-component-element
 */
export const HELP_CONTEXTS = {
  // Dashboard
  'dashboard-capital-balance': 'Your capital account balance',
  'dashboard-ytd-credits': 'Year-to-date credits',
  'dashboard-pending': 'Pending contribution credits',
  
  // Contributions
  'contribute-nl-input': 'Natural language contribution input',
  'contribute-category': 'Contribution category',
  'contribute-effort': 'Effort level',
  'contribute-impact': 'Impact scope',
  
  // Ventures
  'venture-status': 'Venture lifecycle status',
  'venture-revenue': 'Venture revenue',
  'venture-royalty-share': 'Your royalty share percentage',
  'venture-vesting': 'Vesting schedule',
  'venture-dilution': 'Dilution rules',
  
  // Governance
  'governance-quorum': 'Voting quorum requirement',
  'governance-threshold': 'Approval threshold',
  'governance-period-close': 'Period close process',
  
  // K-1
  'k1-ordinary-income': 'Ordinary business income (Box 1)',
  'k1-capital-account': 'Capital account changes',
  'k1-distributions': 'Distributions received',
  'k1-self-employment': 'Self-employment earnings (Box 14)',
  
  // Chain
  'chain-hash': 'Content hash verification',
  'chain-anchor': 'On-chain hash anchoring',
  'chain-integrity': 'Chain integrity verification',
} as const
