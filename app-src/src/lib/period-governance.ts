/**
 * Period Close Governance Workflow
 * 
 * Sprint Q54: Governance approval process for period closures.
 * 
 * Flow:
 * 1. Coordinator proposes period close (after allocation calculation)
 * 2. Members review allocation, K-1 preview, compliance checks
 * 3. Members vote (approve/reject/abstain)
 * 4. Quorum + threshold reached → period closes (chain entry posted)
 * 5. K-1s become final, capital accounts updated
 * 
 * Governance model:
 * - Quorum: 50% of cooperative members
 * - Threshold: Simple majority (>50% of votes cast)
 * - Voting period: 7 days default
 * - Vote weight: 1 member = 1 vote (democratic, not plutocratic)
 */

import { appendEntry } from './chain-engine'
import type { ChainEntry } from '../types/chain'
import { supabase } from './supabase'

// ─── Types ───────────────────────────────────────────────────────────

export interface PeriodCloseProposal {
  proposalId: string
  periodId: string
  proposedBy: string
  proposedAt: string
  
  // Proposal content
  allocationId: string           // links to allocation calculation
  totalContributions: number
  totalAllocated: number
  memberCount: number
  
  // Governance
  votingDeadline: string
  quorumRequired: number         // count of members (e.g., 4 out of 8)
  thresholdRequired: number      // percentage (e.g., 0.5 = 50%)
  
  // Status
  status: 'open' | 'approved' | 'rejected' | 'expired'
  votesFor: number
  votesAgainst: number
  votesAbstain: number
  decidedAt?: string
}

export interface Vote {
  voteId: string
  proposalId: string
  memberId: string
  vote: 'approve' | 'reject' | 'abstain'
  reason?: string
  votedAt: string
}

export interface GovernanceResult {
  proposalId: string
  passed: boolean
  votesFor: number
  votesAgainst: number
  votesAbstain: number
  quorumMet: boolean
  thresholdMet: boolean
  decidedAt: string
}

// ─── Proposal Creation ───────────────────────────────────────────────

/**
 * Create a period close proposal.
 * Triggered after allocation calculation is complete.
 */
export async function proposePeriodClose(params: {
  convergenceId: string
  periodId: string
  allocationId: string
  proposedBy: string
  totalContributions: number
  totalAllocated: number
  memberCount: number
  votingDays?: number
}): Promise<ChainEntry> {
  const proposalId = `period-close-${params.periodId}`
  const votingDays = params.votingDays || 7
  const votingDeadline = new Date(
    Date.now() + votingDays * 24 * 60 * 60 * 1000
  ).toISOString()
  
  // Quorum: 50% of cooperative members
  const quorumRequired = Math.ceil(params.memberCount * 0.5)
  
  const payload = {
    proposalId,
    periodId: params.periodId,
    proposedBy: params.proposedBy,
    proposedAt: new Date().toISOString(),
    
    allocationId: params.allocationId,
    totalContributions: params.totalContributions,
    totalAllocated: params.totalAllocated,
    memberCount: params.memberCount,
    
    votingDeadline,
    quorumRequired,
    thresholdRequired: 0.5,  // simple majority
    
    status: 'open',
    votesFor: 0,
    votesAgainst: 0,
    votesAbstain: 0,
  }
  
  return appendEntry({
    convergenceId: params.convergenceId,
    eventType: 'agreements.allocation.proposed' as any,  // extends ChainEventType
    aggregateId: proposalId,
    aggregateType: 'allocation',
    payload: payload as unknown as Record<string, unknown>,
    patternLayer: 6,  // Constraint (governance)
    actorId: params.proposedBy,
  })
}

// ─── Voting ──────────────────────────────────────────────────────────

/**
 * Cast a vote on a period close proposal.
 */
export async function castVote(params: {
  convergenceId: string
  proposalId: string
  memberId: string
  vote: 'approve' | 'reject' | 'abstain'
  reason?: string
}): Promise<ChainEntry> {
  const voteId = `vote-${params.proposalId}-${params.memberId}`
  
  const payload = {
    voteId,
    proposalId: params.proposalId,
    memberId: params.memberId,
    vote: params.vote,
    reason: params.reason,
    votedAt: new Date().toISOString(),
  }
  
  return appendEntry({
    convergenceId: params.convergenceId,
    eventType: 'agreements.allocation.voted' as any,
    aggregateId: params.proposalId,
    aggregateType: 'allocation',
    payload: payload as unknown as Record<string, unknown>,
    patternLayer: 6,
    actorId: params.memberId,
  })
}

/**
 * Tally votes and determine if proposal should pass.
 * Returns governance result without finalizing (for preview).
 */
export async function tallyVotes(
  convergenceId: string,
  proposalId: string
): Promise<GovernanceResult> {
  // Get proposal
  const { data: proposals } = await supabase
    .from('chain_entries')
    .select('*')
    .eq('convergence_id', convergenceId)
    .eq('aggregate_id', proposalId)
    .eq('event_type', 'agreements.allocation.proposed')
    .single()
  
  if (!proposals) {
    throw new Error(`Proposal ${proposalId} not found`)
  }
  
  const proposal = proposals.payload as unknown as PeriodCloseProposal
  
  // Get all votes
  const { data: votes } = await supabase
    .from('chain_entries')
    .select('*')
    .eq('convergence_id', convergenceId)
    .eq('aggregate_id', proposalId)
    .eq('event_type', 'agreements.allocation.voted')
  
  let votesFor = 0
  let votesAgainst = 0
  let votesAbstain = 0
  
  votes?.forEach(entry => {
    const vote = (entry.payload as any).vote
    if (vote === 'approve') votesFor++
    else if (vote === 'reject') votesAgainst++
    else if (vote === 'abstain') votesAbstain++
  })
  
  const totalVotes = votesFor + votesAgainst + votesAbstain
  const quorumMet = totalVotes >= proposal.quorumRequired
  
  // Threshold: % of non-abstain votes
  const decisiveVotes = votesFor + votesAgainst
  const thresholdMet = decisiveVotes > 0 && 
                       (votesFor / decisiveVotes) >= proposal.thresholdRequired
  
  const passed = quorumMet && thresholdMet
  
  return {
    proposalId,
    passed,
    votesFor,
    votesAgainst,
    votesAbstain,
    quorumMet,
    thresholdMet,
    decidedAt: new Date().toISOString(),
  }
}

/**
 * Finalize a proposal (approve or reject).
 * Creates chain entry recording the final decision.
 */
export async function finalizeProposal(params: {
  convergenceId: string
  proposalId: string
  result: GovernanceResult
  finalizedBy: string
}): Promise<ChainEntry> {
  const eventType = params.result.passed 
    ? 'agreements.allocation.approved'
    : 'agreements.allocation.rejected'
  
  const payload = {
    proposalId: params.proposalId,
    approved: params.result.passed,
    votesFor: params.result.votesFor,
    votesAgainst: params.result.votesAgainst,
    votesAbstain: params.result.votesAbstain,
    quorumMet: params.result.quorumMet,
    thresholdMet: params.result.thresholdMet,
    finalizedBy: params.finalizedBy,
    finalizedAt: params.result.decidedAt,
  }
  
  return appendEntry({
    convergenceId: params.convergenceId,
    eventType: eventType as any,
    aggregateId: params.proposalId,
    aggregateType: 'allocation',
    payload: payload as unknown as Record<string, unknown>,
    patternLayer: 6,
    actorId: params.finalizedBy,
    causationId: params.proposalId,
  })
}

/**
 * Complete workflow: tally votes and auto-finalize if criteria met.
 * Called on voting deadline or when quorum+threshold reached.
 */
export async function checkAndFinalizeProposal(params: {
  convergenceId: string
  proposalId: string
  finalizedBy: string
}): Promise<{ finalized: boolean; result?: GovernanceResult; entry?: ChainEntry }> {
  const result = await tallyVotes(params.convergenceId, params.proposalId)
  
  // Auto-finalize if decision is clear
  if (result.quorumMet && (result.thresholdMet || !result.thresholdMet)) {
    const entry = await finalizeProposal({
      convergenceId: params.convergenceId,
      proposalId: params.proposalId,
      result,
      finalizedBy: params.finalizedBy,
    })
    
    return { finalized: true, result, entry }
  }
  
  return { finalized: false, result }
}

/**
 * Get proposal status for UI display.
 */
export async function getProposalStatus(
  convergenceId: string,
  proposalId: string
): Promise<{
  proposal: PeriodCloseProposal
  currentTally: GovernanceResult
  canFinalize: boolean
  timeRemaining: number
}> {
  // Get proposal
  const { data: proposalEntry } = await supabase
    .from('chain_entries')
    .select('*')
    .eq('convergence_id', convergenceId)
    .eq('aggregate_id', proposalId)
    .eq('event_type', 'agreements.allocation.proposed')
    .single()
  
  if (!proposalEntry) {
    throw new Error(`Proposal ${proposalId} not found`)
  }
  
  const proposal = proposalEntry.payload as unknown as PeriodCloseProposal
  const currentTally = await tallyVotes(convergenceId, proposalId)
  
  const deadline = new Date(proposal.votingDeadline).getTime()
  const now = Date.now()
  const timeRemaining = Math.max(0, deadline - now)
  
  const canFinalize = currentTally.quorumMet && 
                      (timeRemaining === 0 || currentTally.thresholdMet)
  
  return {
    proposal,
    currentTally,
    canFinalize,
    timeRemaining,
  }
}
