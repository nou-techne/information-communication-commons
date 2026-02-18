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
 * Typed payloads for contribution lifecycle (Sprint Q40+)
 */
export interface ContributionCreatedPayload {
  title: string
  description: string
  contributorId: string
  submittedAt: string
  nlSource?: string  // original natural language input
}

export interface ContributionValuedPayload {
  contributionId: string
  valueUsd: number
  valuedBy: string
  valuedAt: string
  justification?: string
}

export interface ContributionApprovedPayload {
  contributionId: string
  approvedBy: string
  approvedAt: string
  creditAmount: number  // capital account credit
  transactionId: string // double-entry transaction reference
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
