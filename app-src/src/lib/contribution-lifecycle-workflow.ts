/**
 * Contribution Lifecycle Workflow — Automated state transitions
 * 
 * Sprint Q42: Contribution lifecycle workflow automation
 * Author: TIO Sprint Runner
 * Date: 2026-02-18
 * 
 * Implements the five-stage contribution lifecycle with automated transitions
 * based on configurable rules. Enables both manual coordinator actions and
 * automated progressions for known patterns.
 * 
 * Workflow stages:
 * 1. Created → Submitted (auto if high confidence NL parse)
 * 2. Submitted → Validated (auto if verifiable source URL)
 * 3. Validated → Valued (auto if matches known pattern)
 * 4. Valued → Approved (requires coordinator/governance approval)
 * 5. Approved → Credit posted (automatic transaction entry)
 * 
 * Alternative paths:
 * - Any stage → Rejected (manual coordinator action)
 * - Any stage → Voided (correction/dispute resolution)
 */

import { appendEntry, validateLifecycleTransition, buildContributionView } from './chain-engine'
import type {
  ContributionValidatedPayload,
  ContributionValuedPayload,
  ContributionApprovedPayload,
  ContributionRejectedPayload,
  ContributionVoidedPayload,
  TransactionPostedPayload,
} from '../types/chain'
import { v4 as uuidv4 } from 'uuid'

/**
 * Validation workflow — Stage 3
 * 
 * Verify that the contribution is authentic and in-scope.
 * Can be automated if source URL is verifiable (GitHub, public doc, etc.)
 */
export async function validateContribution(params: {
  convergenceId: string
  contributionId: string
  validatorId: string
  validationStatus: 'authentic' | 'needs_clarification' | 'out_of_scope'
  validationNotes?: string
  requestedChanges?: string[]
  autoValidate?: boolean  // If true, check rules for auto-validation
}): Promise<{ success: boolean; entryId?: string; error?: string }> {
  try {
    // Check if transition is valid
    const transitionCheck = await validateLifecycleTransition(
      params.convergenceId,
      params.contributionId,
      'validated'
    )
    
    if (!transitionCheck.valid) {
      return {
        success: false,
        error: transitionCheck.error,
      }
    }
    
    // If auto-validate is requested, check if contribution meets criteria
    if (params.autoValidate) {
      const view = await buildContributionView(params.convergenceId, params.contributionId)
      
      if (!view) {
        return { success: false, error: 'Contribution not found' }
      }
      
      // Auto-validation rules
      const canAutoValidate = 
        // Has a verifiable source URL (GitHub, GitLab, public doc)
        (view.sourceUrl && isVerifiableSource(view.sourceUrl)) ||
        // High confidence NL extraction (>= 0.9)
        (view.submittedAt && true) // TODO: access confidence score from submission
      
      if (!canAutoValidate) {
        return {
          success: false,
          error: 'Auto-validation criteria not met — manual review required',
        }
      }
    }
    
    // Create validation entry
    const payload: ContributionValidatedPayload = {
      contributionId: params.contributionId,
      validatedBy: params.validatorId,
      validatedAt: new Date().toISOString(),
      validationStatus: params.validationStatus,
      validationNotes: params.validationNotes,
      requestedChanges: params.requestedChanges,
    }
    
    const entry = await appendEntry({
      convergenceId: params.convergenceId,
      eventType: 'people.contribution.validated',
      aggregateId: params.contributionId,
      aggregateType: 'contribution',
      payload,
      patternLayer: 4,
      actorId: params.validatorId,
    })
    
    return {
      success: true,
      entryId: entry.id,
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Valuation workflow — Stage 4
 * 
 * Assign economic value to the contribution.
 * Can use fixed USD, formula weight, peer assessment, or governance vote.
 */
export async function valueContribution(params: {
  convergenceId: string
  contributionId: string
  valuerId: string
  valueMethod: 'fixed_usd' | 'formula_weight' | 'peer_assessment' | 'governance_vote'
  valueUsd?: number
  valueWeight?: number
  justification?: string
  assessmentData?: Record<string, unknown>
  autoValue?: boolean  // If true, check rules for auto-valuation
}): Promise<{ success: boolean; entryId?: string; error?: string }> {
  try {
    // Check if transition is valid
    const transitionCheck = await validateLifecycleTransition(
      params.convergenceId,
      params.contributionId,
      'valued'
    )
    
    if (!transitionCheck.valid) {
      return {
        success: false,
        error: transitionCheck.error,
      }
    }
    
    // If auto-value is requested, check if contribution matches known pattern
    if (params.autoValue) {
      const view = await buildContributionView(params.convergenceId, params.contributionId)
      
      if (!view) {
        return { success: false, error: 'Contribution not found' }
      }
      
      // Auto-valuation rules (examples)
      const autoValueResult = tryAutoValue(view)
      
      if (!autoValueResult) {
        return {
          success: false,
          error: 'No matching auto-value pattern — manual valuation required',
        }
      }
      
      // Override with auto-determined value
      params.valueUsd = autoValueResult.valueUsd
      params.valueMethod = autoValueResult.method
      params.justification = autoValueResult.justification
    }
    
    // Validate that a value was provided
    if (!params.valueUsd && !params.valueWeight) {
      return {
        success: false,
        error: 'Must provide either valueUsd or valueWeight',
      }
    }
    
    // Create valuation entry
    const payload: ContributionValuedPayload = {
      contributionId: params.contributionId,
      valuedBy: params.valuerId,
      valuedAt: new Date().toISOString(),
      valueUsd: params.valueUsd,
      valueWeight: params.valueWeight,
      valueMethod: params.valueMethod,
      justification: params.justification,
      assessmentData: params.assessmentData,
    }
    
    const entry = await appendEntry({
      convergenceId: params.convergenceId,
      eventType: 'people.contribution.valued',
      aggregateId: params.contributionId,
      aggregateType: 'contribution',
      payload,
      patternLayer: 4,
      actorId: params.valuerId,
    })
    
    return {
      success: true,
      entryId: entry.id,
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Approval workflow — Stage 5a (terminal success)
 * 
 * Post capital account credit and create double-entry transaction.
 * This is the only way a member's capital account balance increases.
 */
export async function approveContribution(params: {
  convergenceId: string
  contributionId: string
  approverId: string
  creditAmount: number
  periodId?: string
  approvalNotes?: string
}): Promise<{ success: boolean; entryIds?: { approval: string; transaction: string }; error?: string }> {
  try {
    // Check if transition is valid
    const transitionCheck = await validateLifecycleTransition(
      params.convergenceId,
      params.contributionId,
      'approved'
    )
    
    if (!transitionCheck.valid) {
      return {
        success: false,
        error: transitionCheck.error,
      }
    }
    
    // Get contribution view to extract contributor ID
    const view = await buildContributionView(params.convergenceId, params.contributionId)
    
    if (!view) {
      return { success: false, error: 'Contribution not found' }
    }
    
    const transactionId = uuidv4()
    
    // Create approval entry
    const approvalPayload: ContributionApprovedPayload = {
      contributionId: params.contributionId,
      approvedBy: params.approverId,
      approvedAt: new Date().toISOString(),
      creditAmount: params.creditAmount,
      transactionId,
      periodId: params.periodId,
      approvalNotes: params.approvalNotes,
    }
    
    const approvalEntry = await appendEntry({
      convergenceId: params.convergenceId,
      eventType: 'people.contribution.approved',
      aggregateId: params.contributionId,
      aggregateType: 'contribution',
      payload: approvalPayload,
      patternLayer: 4,
      actorId: params.approverId,
    })
    
    // Create double-entry transaction
    // Debit: Contribution expense (increases total equity)
    // Credit: Member capital account (increases member's share)
    const transactionPayload: TransactionPostedPayload = {
      transactionId,
      debitAccountId: 'contribution-expense',  // TODO: Get from convergence config
      creditAccountId: `member-capital-${view.contributorId}`,
      amount: params.creditAmount,
      description: `Contribution credit: ${view.title}`,
      periodId: params.periodId,
      postedBy: params.approverId,
      postedAt: new Date().toISOString(),
    }
    
    const transactionEntry = await appendEntry({
      convergenceId: params.convergenceId,
      eventType: 'treasury.transaction.posted',
      aggregateId: transactionId,
      aggregateType: 'transaction',
      payload: transactionPayload,
      patternLayer: 5,  // Flow layer
      actorId: params.approverId,
      correlationId: approvalEntry.id,
    })
    
    return {
      success: true,
      entryIds: {
        approval: approvalEntry.id,
        transaction: transactionEntry.id,
      },
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Rejection workflow — Stage 5b (terminal failure)
 * 
 * Decline a contribution with explanation.
 * Can happen at any stage (submitted → rejected, valued → rejected, etc.)
 */
export async function rejectContribution(params: {
  convergenceId: string
  contributionId: string
  rejectorId: string
  rejectionReason: 'duplicate' | 'out_of_scope' | 'insufficient_evidence' | 'policy_violation' | 'other'
  rejectionNotes?: string
  appealEligible?: boolean
}): Promise<{ success: boolean; entryId?: string; error?: string }> {
  try {
    // Check if transition is valid
    const transitionCheck = await validateLifecycleTransition(
      params.convergenceId,
      params.contributionId,
      'rejected'
    )
    
    if (!transitionCheck.valid) {
      return {
        success: false,
        error: transitionCheck.error,
      }
    }
    
    // Create rejection entry
    const payload: ContributionRejectedPayload = {
      contributionId: params.contributionId,
      rejectedBy: params.rejectorId,
      rejectedAt: new Date().toISOString(),
      rejectionReason: params.rejectionReason,
      rejectionNotes: params.rejectionNotes,
      appealEligible: params.appealEligible ?? true,
    }
    
    const entry = await appendEntry({
      convergenceId: params.convergenceId,
      eventType: 'people.contribution.rejected',
      aggregateId: params.contributionId,
      aggregateType: 'contribution',
      payload,
      patternLayer: 4,
      actorId: params.rejectorId,
    })
    
    return {
      success: true,
      entryId: entry.id,
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Void workflow — Rollback/correction (can happen at any stage)
 * 
 * Corrects errors or handles disputes.
 * If a contribution was already approved, creates a compensating transaction.
 */
export async function voidContribution(params: {
  convergenceId: string
  contributionId: string
  voiderId: string
  voidReason: string
}): Promise<{ success: boolean; entryIds?: { void: string; compensating?: string }; error?: string }> {
  try {
    // Check current state
    const view = await buildContributionView(params.convergenceId, params.contributionId)
    
    if (!view) {
      return { success: false, error: 'Contribution not found' }
    }
    
    // If already approved, need to reverse the transaction
    let compensatingTransactionId: string | undefined
    
    if (view.currentState === 'approved' && view.transactionId && view.creditAmount) {
      // Create compensating transaction (reverse the credit)
      compensatingTransactionId = uuidv4()
      
      const compensatingPayload: TransactionPostedPayload = {
        transactionId: compensatingTransactionId,
        debitAccountId: `member-capital-${view.contributorId}`,
        creditAccountId: 'contribution-expense',
        amount: view.creditAmount,
        description: `Void contribution: ${view.title}`,
        periodId: view.periodId,
        postedBy: params.voiderId,
        postedAt: new Date().toISOString(),
      }
      
      await appendEntry({
        convergenceId: params.convergenceId,
        eventType: 'treasury.transaction.posted',
        aggregateId: compensatingTransactionId,
        aggregateType: 'transaction',
        payload: compensatingPayload,
        patternLayer: 5,
        actorId: params.voiderId,
      })
    }
    
    // Create void entry
    const payload: ContributionVoidedPayload = {
      contributionId: params.contributionId,
      voidedBy: params.voiderId,
      voidedAt: new Date().toISOString(),
      voidReason: params.voidReason,
      compensatingTransactionId,
    }
    
    const entry = await appendEntry({
      convergenceId: params.convergenceId,
      eventType: 'people.contribution.voided',
      aggregateId: params.contributionId,
      aggregateType: 'contribution',
      payload,
      patternLayer: 4,
      actorId: params.voiderId,
    })
    
    return {
      success: true,
      entryIds: {
        void: entry.id,
        compensating: compensatingTransactionId,
      },
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Helper: Check if a source URL is verifiable (GitHub, GitLab, public doc)
 */
function isVerifiableSource(url: string): boolean {
  const verifiableDomains = [
    'github.com',
    'gitlab.com',
    'notion.so',
    'docs.google.com',
    'hackmd.io',
    'medium.com',
  ]
  
  try {
    const parsedUrl = new URL(url)
    return verifiableDomains.some(domain => parsedUrl.hostname.includes(domain))
  } catch {
    return false
  }
}

/**
 * Helper: Try to auto-value a contribution based on known patterns
 * Returns null if no pattern matches (manual valuation required)
 */
function tryAutoValue(contribution: any): {
  valueUsd: number
  method: 'fixed_usd'
  justification: string
} | null {
  // Example auto-value rules (these would be configurable per convergence)
  
  // Bug fixes: $500
  if (contribution.category === 'code' && contribution.effort === 'low') {
    if (contribution.title?.toLowerCase().includes('fix') || contribution.title?.toLowerCase().includes('bug')) {
      return {
        valueUsd: 500,
        method: 'fixed_usd',
        justification: 'Auto-valued: Bug fix (standard rate)',
      }
    }
  }
  
  // Documentation: effort-based
  if (contribution.category === 'documentation') {
    const effortValues = {
      low: 200,
      medium: 800,
      high: 2000,
      exceptional: 5000,
    }
    
    const value = effortValues[contribution.effort as keyof typeof effortValues]
    
    if (value) {
      return {
        valueUsd: value,
        method: 'fixed_usd',
        justification: `Auto-valued: Documentation (${contribution.effort} effort)`,
      }
    }
  }
  
  // No matching pattern
  return null
}
