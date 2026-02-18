/**
 * Contribution Lifecycle Workflow — State Machine Operations
 * 
 * Sprint Q42: Orchestrates the five-stage contribution lifecycle.
 * Each stage transition appends a chain entry and validates the transition.
 * 
 * Flow: created → submitted → validated → valued → approved/rejected
 * Any stage can transition to voided.
 * 
 * Depends on: chain-engine (Q34), chain types (Q33/Q40), parser (Q41)
 */

import { appendEntry, validateLifecycleTransition } from './chain-engine'
import { parseContribution, toChainPayloads, type ParseResult } from './contribution-parser'
import type {
  ContributionCreatedPayload,
  ContributionSubmittedPayload,
  ContributionValidatedPayload,
  ContributionValuedPayload,
  ContributionApprovedPayload,
  ContributionRejectedPayload,
  ContributionVoidedPayload,
  ChainEntry,
} from '../types/chain'

// ─── Workflow Error ──────────────────────────────────────────────────

export class WorkflowError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_TRANSITION' | 'MISSING_FIELD' | 'CHAIN_ERROR',
    public readonly details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'WorkflowError'
  }
}

// ─── Stage 1: Create ─────────────────────────────────────────────────

/**
 * Create a new contribution from natural language input.
 * Parses NL → creates chain entry. Returns the entry + parse result.
 */
export async function createContributionFromNL(params: {
  convergenceId: string
  contributorId: string
  contributionId: string
  nlInput: string
  actorId?: string
}): Promise<{ entry: ChainEntry; parseResult: ParseResult }> {
  const result = parseContribution(params.nlInput, params.contributorId)
  const { created } = toChainPayloads(
    result.parsed,
    params.contributorId,
    params.contributionId,
    result.warnings
  )

  const entry = await appendEntry({
    convergenceId: params.convergenceId,
    eventType: 'people.contribution.created',
    aggregateId: params.contributionId,
    aggregateType: 'contribution',
    payload: created as unknown as Record<string, unknown>,
    patternLayer: 4, // Event
    actorId: params.actorId ?? params.contributorId,
    nlSource: params.nlInput,
  })

  return { entry, parseResult: result }
}

/**
 * Create a contribution from pre-structured data (no NL parsing).
 */
export async function createContribution(params: {
  convergenceId: string
  contributionId: string
  payload: ContributionCreatedPayload
  actorId?: string
}): Promise<ChainEntry> {
  return appendEntry({
    convergenceId: params.convergenceId,
    eventType: 'people.contribution.created',
    aggregateId: params.contributionId,
    aggregateType: 'contribution',
    payload: params.payload as unknown as Record<string, unknown>,
    patternLayer: 4,
    actorId: params.actorId ?? params.payload.contributorId,
  })
}

// ─── Stage 2: Submit ─────────────────────────────────────────────────

/**
 * Submit a contribution for review (auto-submit after NL parse, or manual).
 */
export async function submitContribution(params: {
  convergenceId: string
  contributionId: string
  payload: ContributionSubmittedPayload
  actorId?: string
}): Promise<ChainEntry> {
  const validation = await validateLifecycleTransition(
    params.convergenceId,
    params.contributionId,
    'submitted'
  )

  if (!validation.valid) {
    throw new WorkflowError(
      validation.error ?? 'Invalid transition to submitted',
      'INVALID_TRANSITION',
      { currentState: validation.currentState }
    )
  }

  return appendEntry({
    convergenceId: params.convergenceId,
    eventType: 'people.contribution.submitted',
    aggregateId: params.contributionId,
    aggregateType: 'contribution',
    payload: params.payload as unknown as Record<string, unknown>,
    patternLayer: 4,
    actorId: params.actorId ?? params.payload.submittedBy,
    causationId: params.contributionId,
  })
}

// ─── Stage 3: Validate ──────────────────────────────────────────────

/**
 * Validate a submitted contribution (coordinator/steward action).
 */
export async function validateContribution(params: {
  convergenceId: string
  contributionId: string
  payload: ContributionValidatedPayload
  actorId?: string
}): Promise<ChainEntry> {
  const validation = await validateLifecycleTransition(
    params.convergenceId,
    params.contributionId,
    'validated'
  )

  if (!validation.valid) {
    throw new WorkflowError(
      validation.error ?? 'Invalid transition to validated',
      'INVALID_TRANSITION',
      { currentState: validation.currentState }
    )
  }

  return appendEntry({
    convergenceId: params.convergenceId,
    eventType: 'people.contribution.validated',
    aggregateId: params.contributionId,
    aggregateType: 'contribution',
    payload: params.payload as unknown as Record<string, unknown>,
    patternLayer: 4,
    actorId: params.actorId ?? params.payload.validatedBy,
    causationId: params.contributionId,
  })
}

// ─── Stage 4: Value ──────────────────────────────────────────────────

/**
 * Assign economic value to a validated contribution.
 */
export async function valueContribution(params: {
  convergenceId: string
  contributionId: string
  payload: ContributionValuedPayload
  actorId?: string
}): Promise<ChainEntry> {
  const validation = await validateLifecycleTransition(
    params.convergenceId,
    params.contributionId,
    'valued'
  )

  if (!validation.valid) {
    throw new WorkflowError(
      validation.error ?? 'Invalid transition to valued',
      'INVALID_TRANSITION',
      { currentState: validation.currentState }
    )
  }

  return appendEntry({
    convergenceId: params.convergenceId,
    eventType: 'people.contribution.valued',
    aggregateId: params.contributionId,
    aggregateType: 'contribution',
    payload: params.payload as unknown as Record<string, unknown>,
    patternLayer: 5, // Flow (value assignment)
    actorId: params.actorId ?? params.payload.valuedBy,
    causationId: params.contributionId,
  })
}

// ─── Stage 5a: Approve ──────────────────────────────────────────────

/**
 * Approve a valued contribution → capital account credit.
 */
export async function approveContribution(params: {
  convergenceId: string
  contributionId: string
  payload: ContributionApprovedPayload
  actorId?: string
}): Promise<ChainEntry> {
  const validation = await validateLifecycleTransition(
    params.convergenceId,
    params.contributionId,
    'approved'
  )

  if (!validation.valid) {
    throw new WorkflowError(
      validation.error ?? 'Invalid transition to approved',
      'INVALID_TRANSITION',
      { currentState: validation.currentState }
    )
  }

  return appendEntry({
    convergenceId: params.convergenceId,
    eventType: 'people.contribution.approved',
    aggregateId: params.contributionId,
    aggregateType: 'contribution',
    payload: params.payload as unknown as Record<string, unknown>,
    patternLayer: 5, // Flow (capital credit)
    actorId: params.actorId ?? params.payload.approvedBy,
    causationId: params.contributionId,
  })
}

// ─── Stage 5b: Reject ───────────────────────────────────────────────

/**
 * Reject a contribution at any reviewable stage.
 */
export async function rejectContribution(params: {
  convergenceId: string
  contributionId: string
  payload: ContributionRejectedPayload
  actorId?: string
}): Promise<ChainEntry> {
  const validation = await validateLifecycleTransition(
    params.convergenceId,
    params.contributionId,
    'rejected'
  )

  if (!validation.valid) {
    throw new WorkflowError(
      validation.error ?? 'Invalid transition to rejected',
      'INVALID_TRANSITION',
      { currentState: validation.currentState }
    )
  }

  return appendEntry({
    convergenceId: params.convergenceId,
    eventType: 'people.contribution.rejected',
    aggregateId: params.contributionId,
    aggregateType: 'contribution',
    payload: params.payload as unknown as Record<string, unknown>,
    patternLayer: 6, // Constraint (governance decision)
    actorId: params.actorId ?? params.payload.rejectedBy,
    causationId: params.contributionId,
  })
}

// ─── Void (any stage) ───────────────────────────────────────────────

/**
 * Void a contribution at any non-terminal stage.
 */
export async function voidContribution(params: {
  convergenceId: string
  contributionId: string
  payload: ContributionVoidedPayload
  actorId?: string
}): Promise<ChainEntry> {
  const validation = await validateLifecycleTransition(
    params.convergenceId,
    params.contributionId,
    'voided'
  )

  if (!validation.valid) {
    throw new WorkflowError(
      validation.error ?? 'Invalid transition to voided',
      'INVALID_TRANSITION',
      { currentState: validation.currentState }
    )
  }

  return appendEntry({
    convergenceId: params.convergenceId,
    eventType: 'people.contribution.voided',
    aggregateId: params.contributionId,
    aggregateType: 'contribution',
    payload: params.payload as unknown as Record<string, unknown>,
    patternLayer: 6, // Constraint (correction)
    actorId: params.actorId ?? params.payload.voidedBy,
    causationId: params.contributionId,
  })
}

// ─── Convenience: Full NL Submit Flow ────────────────────────────────

/**
 * One-shot: parse NL → create → auto-submit.
 * Creates two chain entries (created + submitted) in sequence.
 * Returns both entries for UI display.
 */
export async function submitFromNL(params: {
  convergenceId: string
  contributorId: string
  contributionId: string
  nlInput: string
  actorId?: string
}): Promise<{
  createdEntry: ChainEntry
  submittedEntry: ChainEntry
  parseResult: ParseResult
}> {
  // Step 1: Create
  const { entry: createdEntry, parseResult } = await createContributionFromNL(params)

  // Step 2: Auto-submit with extracted data
  const { submitted } = toChainPayloads(
    parseResult.parsed,
    params.contributorId,
    params.contributionId,
    parseResult.warnings
  )

  const submittedEntry = await submitContribution({
    convergenceId: params.convergenceId,
    contributionId: params.contributionId,
    payload: submitted,
    actorId: params.actorId ?? params.contributorId,
  })

  return { createdEntry, submittedEntry, parseResult }
}
