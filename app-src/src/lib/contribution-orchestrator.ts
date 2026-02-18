/**
 * Contribution Orchestrator — High-level workflow coordination
 * 
 * Sprint Q42: Contribution lifecycle workflow (continued)
 * Author: TIO Sprint Runner
 * Date: 2026-02-18
 * 
 * Provides coordinator-friendly functions that orchestrate multiple
 * workflow steps in common patterns.
 * 
 * Example: "Fast-track approve" = validate + value + approve in one call
 * Example: "Process submission queue" = batch validate pending contributions
 */

import {
  validateContribution,
  valueContribution,
  approveContribution,
  rejectContribution,
} from './contribution-lifecycle-workflow'
import { buildContributionView, getContributionsByState } from './chain-engine'

/**
 * Fast-track approval — Validate, value, and approve in one step
 * 
 * Use for contributions that clearly meet criteria:
 * - Verifiable source (GitHub commit, published article)
 * - Matches known pattern (bug fix, standard documentation)
 * - Coordinator has authority to approve
 */
export async function fastTrackApprove(params: {
  convergenceId: string
  contributionId: string
  coordinatorId: string
  creditAmount: number
  valueMethod?: 'fixed_usd' | 'formula_weight'
  justification?: string
  periodId?: string
}): Promise<{
  success: boolean
  entryIds?: { validation: string; valuation: string; approval: string; transaction: string }
  error?: string
  stage?: string
}> {
  try {
    // Step 1: Validate
    const validationResult = await validateContribution({
      convergenceId: params.convergenceId,
      contributionId: params.contributionId,
      validatorId: params.coordinatorId,
      validationStatus: 'authentic',
      validationNotes: 'Fast-tracked by coordinator',
    })
    
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error,
        stage: 'validation',
      }
    }
    
    // Step 2: Value
    const valuationResult = await valueContribution({
      convergenceId: params.convergenceId,
      contributionId: params.contributionId,
      valuerId: params.coordinatorId,
      valueMethod: params.valueMethod || 'fixed_usd',
      valueUsd: params.creditAmount,
      justification: params.justification || 'Fast-tracked by coordinator',
    })
    
    if (!valuationResult.success) {
      return {
        success: false,
        error: valuationResult.error,
        stage: 'valuation',
      }
    }
    
    // Step 3: Approve
    const approvalResult = await approveContribution({
      convergenceId: params.convergenceId,
      contributionId: params.contributionId,
      approverId: params.coordinatorId,
      creditAmount: params.creditAmount,
      periodId: params.periodId,
      approvalNotes: 'Fast-tracked',
    })
    
    if (!approvalResult.success) {
      return {
        success: false,
        error: approvalResult.error,
        stage: 'approval',
      }
    }
    
    return {
      success: true,
      entryIds: {
        validation: validationResult.entryId!,
        valuation: valuationResult.entryId!,
        approval: approvalResult.entryIds!.approval,
        transaction: approvalResult.entryIds!.transaction,
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
 * Batch validate all submitted contributions
 * 
 * Returns results for each contribution with auto-validation where possible.
 */
export async function batchValidateSubmitted(params: {
  convergenceId: string
  validatorId: string
  autoValidate?: boolean  // Try to auto-validate verifiable sources
}): Promise<{
  total: number
  validated: number
  needsReview: number
  results: Array<{
    contributionId: string
    title: string
    success: boolean
    entryId?: string
    error?: string
    needsManualReview?: boolean
  }>
}> {
  // Get all submitted contributions
  const contributions = await getContributionsByState(params.convergenceId, 'submitted')
  
  const results = []
  let validated = 0
  let needsReview = 0
  
  for (const contribution of contributions) {
    const result = await validateContribution({
      convergenceId: params.convergenceId,
      contributionId: contribution.id,
      validatorId: params.validatorId,
      validationStatus: 'authentic',
      autoValidate: params.autoValidate,
    })
    
    if (result.success) {
      validated++
      results.push({
        contributionId: contribution.id,
        title: contribution.title,
        success: true,
        entryId: result.entryId,
      })
    } else {
      needsReview++
      results.push({
        contributionId: contribution.id,
        title: contribution.title,
        success: false,
        error: result.error,
        needsManualReview: true,
      })
    }
  }
  
  return {
    total: contributions.length,
    validated,
    needsReview,
    results,
  }
}

/**
 * Batch value all validated contributions using auto-valuation rules
 * 
 * Returns results for each contribution, flagging those that need manual valuation.
 */
export async function batchValueValidated(params: {
  convergenceId: string
  valuerId: string
  autoValue?: boolean  // Try to auto-value based on patterns
}): Promise<{
  total: number
  valued: number
  needsReview: number
  results: Array<{
    contributionId: string
    title: string
    success: boolean
    entryId?: string
    error?: string
    needsManualValuation?: boolean
  }>
}> {
  // Get all validated contributions
  const contributions = await getContributionsByState(params.convergenceId, 'validated')
  
  const results = []
  let valued = 0
  let needsReview = 0
  
  for (const contribution of contributions) {
    const result = await valueContribution({
      convergenceId: params.convergenceId,
      contributionId: contribution.id,
      valuerId: params.valuerId,
      valueMethod: 'fixed_usd',  // Default method
      autoValue: params.autoValue,
    })
    
    if (result.success) {
      valued++
      results.push({
        contributionId: contribution.id,
        title: contribution.title,
        success: true,
        entryId: result.entryId,
      })
    } else {
      needsReview++
      results.push({
        contributionId: contribution.id,
        title: contribution.title,
        success: false,
        error: result.error,
        needsManualValuation: true,
      })
    }
  }
  
  return {
    total: contributions.length,
    valued,
    needsReview,
    results,
  }
}

/**
 * Review queue — Get all contributions that need manual review
 * 
 * Returns contributions organized by stage and reason for review.
 */
export async function getReviewQueue(params: {
  convergenceId: string
}): Promise<{
  submitted: Array<{ id: string; title: string; submittedAt: string; category?: string }>
  validated: Array<{ id: string; title: string; validatedAt: string; needsClarification: boolean }>
  valued: Array<{ id: string; title: string; valuedAt: string; valueUsd?: number }>
  total: number
}> {
  const [submitted, validated, valued] = await Promise.all([
    getContributionsByState(params.convergenceId, 'submitted'),
    getContributionsByState(params.convergenceId, 'validated'),
    getContributionsByState(params.convergenceId, 'valued'),
  ])
  
  return {
    submitted: submitted.map(c => ({
      id: c.id,
      title: c.title,
      submittedAt: c.submittedAt || '',
      category: c.category,
    })),
    validated: validated.map(c => ({
      id: c.id,
      title: c.title,
      validatedAt: c.validatedAt || '',
      needsClarification: c.validationStatus === 'needs_clarification',
    })),
    valued: valued.map(c => ({
      id: c.id,
      title: c.title,
      valuedAt: c.valuedAt || '',
      valueUsd: c.valueUsd,
    })),
    total: submitted.length + validated.length + valued.length,
  }
}

/**
 * Contribution summary — Get high-level stats for dashboard
 */
export async function getContributionStats(params: {
  convergenceId: string
  memberId?: string  // Optional: stats for a specific member
}): Promise<{
  byState: Record<string, number>
  totalCredits: number
  averageValue: number
  pendingReview: number
}> {
  // This would query the chain and aggregate stats
  // For now, returning a placeholder structure
  
  return {
    byState: {
      created: 0,
      submitted: 0,
      validated: 0,
      valued: 0,
      approved: 0,
      rejected: 0,
      voided: 0,
    },
    totalCredits: 0,
    averageValue: 0,
    pendingReview: 0,
  }
}

/**
 * Helper: Determine if a contribution can be fast-tracked
 * 
 * Checks if the contribution meets criteria for automated approval.
 */
export async function canFastTrack(params: {
  convergenceId: string
  contributionId: string
}): Promise<{
  canFastTrack: boolean
  reason?: string
  suggestedValue?: number
}> {
  const view = await buildContributionView(params.convergenceId, params.contributionId)
  
  if (!view) {
    return {
      canFastTrack: false,
      reason: 'Contribution not found',
    }
  }
  
  // Check criteria
  const hasVerifiableSource = view.sourceUrl && /github\.com|gitlab\.com|notion\.so/.test(view.sourceUrl)
  const hasCategory = !!view.category
  const hasEffort = !!view.effort
  
  if (!hasVerifiableSource) {
    return {
      canFastTrack: false,
      reason: 'No verifiable source URL',
    }
  }
  
  if (!hasCategory || !hasEffort) {
    return {
      canFastTrack: false,
      reason: 'Missing category or effort metadata',
    }
  }
  
  // Suggest value based on effort
  const effortValues = {
    low: 500,
    medium: 2000,
    high: 8000,
    exceptional: 20000,
  }
  
  const suggestedValue = effortValues[view.effort as keyof typeof effortValues]
  
  return {
    canFastTrack: true,
    suggestedValue,
  }
}
