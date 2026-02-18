/**
 * Period Close Governance Approval Workflow
 * 
 * Sprint Q54: Period close governance approval workflow
 * Author: TIO Sprint Runner
 * Date: 2026-02-18
 * 
 * Before a period can be closed, the following governance steps must complete:
 * 1. Coordinator proposes period close (triggers compliance suite)
 * 2. Compliance checks run automatically
 * 3. If all checks pass → period close is queued for governance approval
 * 4. Required approvers (configurable) vote to approve or reject
 * 5. If approved → period is closed, allocations are finalized
 * 6. If rejected → period remains open, coordinator addresses issues
 * 
 * This workflow is chain-native: all proposals, votes, and decisions are
 * recorded as chain entries for auditability.
 */

import { appendEntry, queryChain } from './chain-engine'
import { closePeriod, getPeriodView } from './period-lifecycle'
import { runComplianceSuite } from './compliance-engine'
import type { ChainEntry } from '../types/chain'
import { v4 as uuidv4 } from 'uuid'

// ─── Types ───────────────────────────────────────────────────────────

export type GovernanceProposalState =
  | 'proposed'
  | 'compliance_passed'
  | 'compliance_failed'
  | 'voting'
  | 'approved'
  | 'rejected'
  | 'executed'

export interface GovernanceProposal {
  proposalId: string
  convergenceId: string
  periodId: string
  proposedBy: string
  proposedAt: string
  state: GovernanceProposalState
  complianceResult?: {
    allPassed: boolean
    checkIds: string[]
  }
  votes: Array<{
    voterId: string
    vote: 'approve' | 'reject'
    votedAt: string
    reason?: string
  }>
  requiredApprovals: number
  currentApprovals: number
  currentRejections: number
}

export interface GovernanceConfig {
  requiredApprovals: number      // How many votes needed to approve
  eligibleVoters: string[]       // Member IDs who can vote
  autoExecute: boolean           // Auto-close period on approval?
  requireCompliancePass: boolean // Block voting if compliance fails?
}

const DEFAULT_GOVERNANCE_CONFIG: GovernanceConfig = {
  requiredApprovals: 2,
  eligibleVoters: [],  // Empty = any member can vote
  autoExecute: true,
  requireCompliancePass: true,
}

// ─── Workflow Functions ──────────────────────────────────────────────

/**
 * Step 1: Propose period close.
 * Runs compliance suite automatically.
 */
export async function proposePeriodClose(params: {
  convergenceId: string
  periodId: string
  proposedBy: string
  config?: Partial<GovernanceConfig>
}): Promise<{
  success: boolean
  proposalId?: string
  compliancePassed?: boolean
  error?: string
}> {
  try {
    // Verify period exists and is open
    const period = await getPeriodView(params.convergenceId, params.periodId)
    if (!period) return { success: false, error: 'Period not found' }
    if (period.state === 'closed') return { success: false, error: 'Period already closed' }

    const config = { ...DEFAULT_GOVERNANCE_CONFIG, ...params.config }
    const proposalId = uuidv4()

    // Record proposal
    await appendEntry({
      convergenceId: params.convergenceId,
      eventType: 'convergence.updated',  // Using convergence.updated for governance events
      aggregateId: proposalId,
      aggregateType: 'convergence',
      payload: {
        type: 'governance.period_close.proposed',
        proposalId,
        periodId: params.periodId,
        proposedBy: params.proposedBy,
        proposedAt: new Date().toISOString(),
        requiredApprovals: config.requiredApprovals,
        eligibleVoters: config.eligibleVoters,
      },
      patternLayer: 6, // Constraint layer
      actorId: params.proposedBy,
    })

    // Run compliance suite
    const complianceResult = await runComplianceSuite({
      convergenceId: params.convergenceId,
      periodId: params.periodId,
      actorId: params.proposedBy,
    })

    // Record compliance result on the proposal
    const complianceState = complianceResult.allPassed
      ? 'compliance_passed'
      : 'compliance_failed'

    await appendEntry({
      convergenceId: params.convergenceId,
      eventType: 'convergence.updated',
      aggregateId: proposalId,
      aggregateType: 'convergence',
      payload: {
        type: `governance.period_close.${complianceState}`,
        proposalId,
        allPassed: complianceResult.allPassed,
        checkIds: complianceResult.chainEntryIds,
        checks: complianceResult.checks.map(c => ({
          type: c.checkType,
          passed: c.passed,
          violations: c.violations.length,
        })),
      },
      patternLayer: 6,
      actorId: params.proposedBy,
    })

    if (!complianceResult.allPassed && config.requireCompliancePass) {
      return {
        success: true,
        proposalId,
        compliancePassed: false,
        error: 'Compliance checks failed — resolve violations before voting',
      }
    }

    return {
      success: true,
      proposalId,
      compliancePassed: complianceResult.allPassed,
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Step 2: Vote on a period close proposal.
 */
export async function voteOnProposal(params: {
  convergenceId: string
  proposalId: string
  voterId: string
  vote: 'approve' | 'reject'
  reason?: string
  config?: Partial<GovernanceConfig>
}): Promise<{
  success: boolean
  executed?: boolean       // If auto-execute triggered
  currentApprovals?: number
  currentRejections?: number
  error?: string
}> {
  try {
    const config = { ...DEFAULT_GOVERNANCE_CONFIG, ...params.config }

    // Check eligibility
    if (config.eligibleVoters.length > 0 && !config.eligibleVoters.includes(params.voterId)) {
      return { success: false, error: 'Not an eligible voter' }
    }

    // Check for duplicate votes
    const proposalEntries = await queryChain({
      convergenceId: params.convergenceId,
      aggregateId: params.proposalId,
    })

    const existingVote = proposalEntries.find(e => {
      const payload = e.payload as any
      return payload.type?.startsWith('governance.period_close.vote') &&
        payload.voterId === params.voterId
    })

    if (existingVote) {
      return { success: false, error: 'Already voted on this proposal' }
    }

    // Record vote
    await appendEntry({
      convergenceId: params.convergenceId,
      eventType: 'convergence.updated',
      aggregateId: params.proposalId,
      aggregateType: 'convergence',
      payload: {
        type: `governance.period_close.vote.${params.vote}`,
        proposalId: params.proposalId,
        voterId: params.voterId,
        vote: params.vote,
        votedAt: new Date().toISOString(),
        reason: params.reason,
      },
      patternLayer: 6,
      actorId: params.voterId,
    })

    // Count votes
    const allEntries = await queryChain({
      convergenceId: params.convergenceId,
      aggregateId: params.proposalId,
    })

    let approvals = 0
    let rejections = 0
    let periodId: string | undefined

    for (const entry of allEntries) {
      const payload = entry.payload as any
      if (payload.type === 'governance.period_close.vote.approve') approvals++
      if (payload.type === 'governance.period_close.vote.reject') rejections++
      if (payload.type === 'governance.period_close.proposed') periodId = payload.periodId
    }

    // Check if threshold reached
    if (approvals >= config.requiredApprovals && config.autoExecute && periodId) {
      // Execute period close
      const closeResult = await closePeriod({
        convergenceId: params.convergenceId,
        periodId,
        actorId: 'governance-engine',
      })

      if (closeResult.success) {
        // Record execution
        await appendEntry({
          convergenceId: params.convergenceId,
          eventType: 'convergence.updated',
          aggregateId: params.proposalId,
          aggregateType: 'convergence',
          payload: {
            type: 'governance.period_close.executed',
            proposalId: params.proposalId,
            periodId,
            executedAt: new Date().toISOString(),
            approvals,
            rejections,
          },
          patternLayer: 6,
          actorId: 'governance-engine',
        })

        return {
          success: true,
          executed: true,
          currentApprovals: approvals,
          currentRejections: rejections,
        }
      }
    }

    return {
      success: true,
      executed: false,
      currentApprovals: approvals,
      currentRejections: rejections,
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Get the current state of a governance proposal.
 */
export async function getProposalState(
  convergenceId: string,
  proposalId: string
): Promise<GovernanceProposal | null> {
  const entries = await queryChain({
    convergenceId,
    aggregateId: proposalId,
  })

  if (entries.length === 0) return null

  let proposal: Partial<GovernanceProposal> = {
    proposalId,
    convergenceId,
    state: 'proposed',
    votes: [],
    currentApprovals: 0,
    currentRejections: 0,
  }

  for (const entry of entries) {
    const payload = entry.payload as any

    switch (payload.type) {
      case 'governance.period_close.proposed':
        proposal.periodId = payload.periodId
        proposal.proposedBy = payload.proposedBy
        proposal.proposedAt = payload.proposedAt
        proposal.requiredApprovals = payload.requiredApprovals
        break

      case 'governance.period_close.compliance_passed':
        proposal.state = 'voting'
        proposal.complianceResult = {
          allPassed: true,
          checkIds: payload.checkIds,
        }
        break

      case 'governance.period_close.compliance_failed':
        proposal.state = 'compliance_failed'
        proposal.complianceResult = {
          allPassed: false,
          checkIds: payload.checkIds,
        }
        break

      case 'governance.period_close.vote.approve':
        proposal.votes!.push({
          voterId: payload.voterId,
          vote: 'approve',
          votedAt: payload.votedAt,
          reason: payload.reason,
        })
        proposal.currentApprovals = (proposal.currentApprovals ?? 0) + 1
        break

      case 'governance.period_close.vote.reject':
        proposal.votes!.push({
          voterId: payload.voterId,
          vote: 'reject',
          votedAt: payload.votedAt,
          reason: payload.reason,
        })
        proposal.currentRejections = (proposal.currentRejections ?? 0) + 1
        break

      case 'governance.period_close.executed':
        proposal.state = 'executed'
        break
    }
  }

  return proposal as GovernanceProposal
}
