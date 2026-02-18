/**
 * Chain Entry Types — Perpetual Convergence Merkle Chain
 * 
 * Sprint Q33: TypeScript types for append-only economic event chain
 * Author: TIO Sprint Runner
 * Date: 2026-02-18
 * 
 * Each entry is an immutable, hash-linked record of a cooperative economic event.
 * Capital accounts, balances, and member states are computed views over the chain,
 * not stored independently.
 */

export interface ChainEntry {
  id: string
  chain_index: number
  convergence_id: string
  
  // Event identity
  event_type: ChainEventType
  aggregate_id: string
  aggregate_type: AggregateType
  
  // Payload (event-specific, validated per event_type)
  payload: Record<string, unknown>
  
  // Seven-layer classification
  pattern_layer: PatternLayer
  
  // Merkle chain
  content_hash: string
  prev_hash: string     // 'genesis' for entry #0
  
  // Metadata
  actor_id?: string
  correlation_id?: string
  causation_id?: string
  nl_source?: string
  schema_version: string
  
  created_at: string
}

export type PatternLayer = 1 | 2 | 3 | 4 | 5 | 6 | 7

export const PATTERN_LAYER_NAMES: Record<PatternLayer, string> = {
  1: 'Identity',
  2: 'State',
  3: 'Relationship',
  4: 'Event',
  5: 'Flow',
  6: 'Constraint',
  7: 'View',
}

export const PATTERN_LAYER_COLORS: Record<PatternLayer, string> = {
  1: '#c4956a',  // copper - Identity
  2: '#7ccfb8',  // mint - State
  3: '#5b9de4',  // sky - Relationship
  4: '#f4d9a0',  // gold - Event
  5: '#a8d4f0',  // pale blue - Flow
  6: '#c4b5fd',  // violet - Constraint
  7: '#fca5a5',  // rose - View
}

export type AggregateType = 
  | 'convergence'
  | 'member'
  | 'contribution'
  | 'period'
  | 'allocation'
  | 'distribution'
  | 'account'
  | 'transaction'
  | 'venture'
  | 'royalty_agreement'
  | 'revenue'
  | 'education'

/**
 * Chain event types — REA-based, ported from habitat event registry
 * Format: domain.entity.action
 */
export type ChainEventType =
  // Convergence lifecycle
  | 'convergence.created'
  | 'convergence.updated'
  | 'convergence.archived'
  // People
  | 'people.member.created'
  | 'people.member.updated'
  | 'people.member.suspended'
  | 'people.member.reactivated'
  // Contributions (five-stage lifecycle from Sprint Q40)
  | 'people.contribution.created'
  | 'people.contribution.submitted'
  | 'people.contribution.validated'
  | 'people.contribution.valued'
  | 'people.contribution.approved'
  | 'people.contribution.rejected'
  | 'people.contribution.voided'
  // Treasury (double-entry accounting)
  | 'treasury.period.opened'
  | 'treasury.period.closed'
  | 'treasury.transaction.posted'
  | 'treasury.transaction.voided'
  | 'treasury.account.created'
  | 'treasury.account.updated'
  // Agreements (patronage allocations)
  | 'agreements.allocation.created'
  | 'agreements.allocation.proposed'
  | 'agreements.allocation.approved'
  | 'agreements.allocation.rejected'
  | 'agreements.distribution.scheduled'
  | 'agreements.distribution.completed'
  | 'agreements.capitalAccount.updated'
  // Ventures (Sprint Q56)
  | 'venture.created'
  | 'venture.updated'
  | 'venture.archived'
  | 'venture.statusChanged'
  // Royalty agreements (Sprint Q57)
  | 'agreements.royalty.created'
  | 'agreements.royalty.activated'
  | 'agreements.royalty.modified'
  | 'agreements.royalty.terminated'
  | 'agreements.royalty.vested'
  | 'agreements.royalty.cliff_reached'
  // Revenue events (Sprint Q58)
  | 'treasury.revenue.received'
  | 'treasury.revenue.allocated'
  | 'treasury.revenue.distributed'
  // Compliance (704b, double-entry verification)
  | 'compliance.check.passed'
  | 'compliance.check.failed'
  | 'compliance.check.remediated'

/**
 * Typed payloads for Sprint 1 event types (genesis)
 */
export interface ConvergenceCreatedPayload {
  name: string
  type: 'perpetual' | 'bounded'
  description?: string
  location?: string
  startDate: string  // ISO 8601
  endDate?: string   // only for bounded convergences
}

export interface MemberCreatedPayload {
  memberNumber: string
  displayName: string
  tier: 'cooperative' | 'community'
  ensName?: string
  walletAddress?: string
  email?: string
  joinedAt: string  // ISO 8601
}

/**
 * Typed payloads for contribution lifecycle (Sprint Q40)
 * 
 * Five-stage lifecycle:
 * 1. Created — Initial capture of contribution intent
 * 2. Submitted — Ready for review (may include LLM-extracted structured data)
 * 3. Validated — Verified by coordinator/steward (authenticity + scope)
 * 4. Valued — Economic value assigned (can be $ or formula-based weight)
 * 5a. Approved → Capital account credit posted (terminal success state)
 * 5b. Rejected → Returned with feedback (terminal failure state)
 * 
 * Voided — Can happen at any stage (rollback/correction)
 */

// Stage 1: Creation
export interface ContributionCreatedPayload {
  title: string
  description: string
  contributorId: string
  createdAt: string
  nlSource?: string  // original natural language input
  sourceUrl?: string // link to external artifact (GitHub PR, doc, etc.)
  tags?: string[]
}

// Stage 2: Submission (structured data ready for review)
export interface ContributionSubmittedPayload {
  contributionId: string
  submittedBy: string
  submittedAt: string
  extractedData?: {
    category?: string      // e.g., 'code', 'research', 'coordination'
    effort?: string        // e.g., 'low', 'medium', 'high', 'exceptional'
    impact?: string        // e.g., 'local', 'convergence', 'ecosystem'
    relatedArtifactIds?: string[]
    relatedMemberIds?: string[]
  }
  submissionNotes?: string
}

// Stage 3: Validation (authenticity + scope verified)
export interface ContributionValidatedPayload {
  contributionId: string
  validatedBy: string
  validatedAt: string
  validationStatus: 'authentic' | 'needs_clarification' | 'out_of_scope'
  validationNotes?: string
  requestedChanges?: string[] // if needs_clarification
}

// Stage 4: Valuation (economic value assigned)
export interface ContributionValuedPayload {
  contributionId: string
  valuedBy: string
  valuedAt: string
  valueUsd?: number      // direct USD value
  valueWeight?: number   // formula weight (0.0-1.0)
  valueMethod: 'fixed_usd' | 'formula_weight' | 'peer_assessment' | 'governance_vote'
  justification?: string
  assessmentData?: Record<string, unknown>  // method-specific details
}

// Stage 5a: Approval (capital account credit)
export interface ContributionApprovedPayload {
  contributionId: string
  approvedBy: string
  approvedAt: string
  creditAmount: number      // final capital account credit
  transactionId: string     // double-entry transaction reference
  periodId?: string         // patronage period if applicable
  approvalNotes?: string
}

// Stage 5b: Rejection (terminal failure)
export interface ContributionRejectedPayload {
  contributionId: string
  rejectedBy: string
  rejectedAt: string
  rejectionReason: 'duplicate' | 'out_of_scope' | 'insufficient_evidence' | 'policy_violation' | 'other'
  rejectionNotes?: string
  appealEligible: boolean
}

// Rollback/correction (can happen at any stage)
export interface ContributionVoidedPayload {
  contributionId: string
  voidedBy: string
  voidedAt: string
  voidReason: string
  compensatingTransactionId?: string  // if credit needs reversal
}

/**
 * Contribution lifecycle state machine
 */
export type ContributionLifecycleState = 
  | 'created'
  | 'submitted'
  | 'validated'
  | 'valued'
  | 'approved'
  | 'rejected'
  | 'voided'

export const CONTRIBUTION_LIFECYCLE_TRANSITIONS: Record<
  ContributionLifecycleState,
  ContributionLifecycleState[]
> = {
  created: ['submitted', 'voided'],
  submitted: ['validated', 'rejected', 'voided'],
  validated: ['valued', 'rejected', 'voided'],
  valued: ['approved', 'rejected', 'voided'],
  approved: ['voided'],  // can only void after approval (requires compensating transaction)
  rejected: [],          // terminal state
  voided: [],            // terminal state
}

/**
 * Helper: Check if a lifecycle transition is valid
 */
export function isValidLifecycleTransition(
  from: ContributionLifecycleState,
  to: ContributionLifecycleState
): boolean {
  return CONTRIBUTION_LIFECYCLE_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Helper: Get current lifecycle state from chain entries
 */
export function deriveContributionState(
  entries: ChainEntry[]
): ContributionLifecycleState | null {
  if (entries.length === 0) return null
  
  // Find the latest lifecycle event (sorted by chain_index descending)
  const sorted = [...entries].sort((a, b) => b.chain_index - a.chain_index)
  
  for (const entry of sorted) {
    switch (entry.event_type) {
      case 'people.contribution.created':
        return 'created'
      case 'people.contribution.submitted':
        return 'submitted'
      case 'people.contribution.validated':
        return 'validated'
      case 'people.contribution.valued':
        return 'valued'
      case 'people.contribution.approved':
        return 'approved'
      case 'people.contribution.rejected':
        return 'rejected'
      case 'people.contribution.voided':
        return 'voided'
    }
  }
  
  return null
}

/**
 * Contribution aggregate view (computed from chain entries)
 */
export interface ContributionView {
  id: string
  convergenceId: string
  currentState: ContributionLifecycleState
  
  // From created event
  title: string
  description: string
  contributorId: string
  createdAt: string
  nlSource?: string
  sourceUrl?: string
  tags?: string[]
  
  // From submitted event (if reached)
  submittedAt?: string
  category?: string
  effort?: string
  impact?: string
  
  // From validated event (if reached)
  validatedAt?: string
  validatedBy?: string
  validationStatus?: string
  
  // From valued event (if reached)
  valuedAt?: string
  valuedBy?: string
  valueUsd?: number
  valueWeight?: number
  valueMethod?: string
  
  // From approved event (if reached)
  approvedAt?: string
  approvedBy?: string
  creditAmount?: number
  transactionId?: string
  periodId?: string
  
  // From rejected event (if terminal)
  rejectedAt?: string
  rejectedBy?: string
  rejectionReason?: string
  
  // Lifecycle metadata
  chainEntries: ChainEntry[]
  lastModified: string
}

/**
 * Typed payloads for treasury events (Sprint Q48+)
 */
export interface PeriodOpenedPayload {
  periodId: string
  startDate: string
  endDate: string
  openedBy: string
  openedAt: string
}

export interface PeriodClosedPayload {
  periodId: string
  closedBy: string
  closedAt: string
  totalContributions: number
  totalDistributions: number
  complianceChecks: string[] // IDs of compliance check entries
}

export interface TransactionPostedPayload {
  transactionId: string
  debitAccountId: string
  creditAccountId: string
  amount: number
  description: string
  periodId?: string
  postedBy: string
  postedAt: string
}

/**
 * Typed payloads for allocation events (Sprint Q48+)
 */
export interface AllocationCreatedPayload {
  allocationId: string
  periodId: string
  formulaVersion: string
  inputParameters: Record<string, unknown>  // weights, thresholds, etc.
  createdBy: string
  createdAt: string
}

export interface AllocationApprovedPayload {
  allocationId: string
  approvedBy: string
  approvedAt: string
  memberAllocations: Array<{
    memberId: string
    amount: number
    share: number  // percentage
  }>
}

/**
 * Helper types for chain queries
 */
export interface ChainQueryParams {
  convergenceId: string
  eventType?: ChainEventType
  aggregateType?: AggregateType
  aggregateId?: string
  patternLayer?: PatternLayer
  fromIndex?: number
  toIndex?: number
  limit?: number
}

export interface ChainVerificationResult {
  valid: boolean
  violations: string[]
  entriesChecked: number
}

/**
 * Helper for typed payload extraction
 */
export function extractPayload<T>(entry: ChainEntry): T {
  return entry.payload as T
}
