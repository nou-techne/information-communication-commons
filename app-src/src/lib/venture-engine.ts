/**
 * Venture Engine — Registry, Revenue, and Royalty Operations
 * 
 * Sprints Q56–Q59: Chain operations for the venture royalties system.
 * 
 * Provides:
 * - Venture CRUD (create, update, status change, archive)
 * - Royalty agreement lifecycle (create, activate, modify, terminate)
 * - Revenue recording and allocation
 * - Vesting computation and event emission
 * - Double-entry integration for royalty distributions
 */

import { appendEntry, queryChain, getChainHead } from './chain-engine'
import { postTransaction, accountId } from './double-entry'
import type { ChainEntry } from '../types/chain'
import type {
  VentureCreatedPayload,
  VentureUpdatedPayload,
  VentureStatusChangedPayload,
  VentureArchivedPayload,
  VentureView,
  VentureStatus,
  RoyaltyAgreementCreatedPayload,
  RoyaltyAgreementActivatedPayload,
  RoyaltyAgreementTerminatedPayload,
  RevenueReceivedPayload,
  RevenueAllocatedPayload,
  RevenueDistributedPayload,
  RoyaltyVestedPayload,
  CliffReachedPayload,
  RoyaltyShare,
  computeVestedPercent,
  computeVestedAmount,
  checkMilestones,
} from '../types/venture'

// ─── Venture Registry (Q56) ─────────────────────────────────────────

export async function createVenture(params: {
  convergenceId: string
  payload: VentureCreatedPayload
  actorId: string
}): Promise<ChainEntry> {
  return appendEntry({
    convergenceId: params.convergenceId,
    eventType: 'venture.created',
    aggregateId: params.payload.ventureId,
    aggregateType: 'venture',
    payload: params.payload as unknown as Record<string, unknown>,
    patternLayer: 1,  // Identity
    actorId: params.actorId,
  })
}

export async function updateVenture(params: {
  convergenceId: string
  ventureId: string
  payload: VentureUpdatedPayload
  actorId: string
}): Promise<ChainEntry> {
  return appendEntry({
    convergenceId: params.convergenceId,
    eventType: 'venture.updated',
    aggregateId: params.ventureId,
    aggregateType: 'venture',
    payload: params.payload as unknown as Record<string, unknown>,
    patternLayer: 2,  // State
    actorId: params.actorId,
  })
}

export async function changeVentureStatus(params: {
  convergenceId: string
  ventureId: string
  payload: VentureStatusChangedPayload
  actorId: string
}): Promise<ChainEntry> {
  return appendEntry({
    convergenceId: params.convergenceId,
    eventType: 'venture.statusChanged',
    aggregateId: params.ventureId,
    aggregateType: 'venture',
    payload: params.payload as unknown as Record<string, unknown>,
    patternLayer: 2,
    actorId: params.actorId,
  })
}

export async function archiveVenture(params: {
  convergenceId: string
  ventureId: string
  payload: VentureArchivedPayload
  actorId: string
}): Promise<ChainEntry> {
  return appendEntry({
    convergenceId: params.convergenceId,
    eventType: 'venture.archived',
    aggregateId: params.ventureId,
    aggregateType: 'venture',
    payload: params.payload as unknown as Record<string, unknown>,
    patternLayer: 2,
    actorId: params.actorId,
  })
}

/**
 * Build a venture view by projecting chain entries.
 */
export async function buildVentureView(
  convergenceId: string,
  ventureId: string
): Promise<VentureView | null> {
  const entries = await queryChain({
    convergenceId,
    aggregateType: 'venture',
    aggregateId: ventureId,
  })
  
  if (entries.length === 0) return null
  
  const view: Partial<VentureView> = { id: ventureId, convergenceId }
  
  for (const entry of entries) {
    const p = entry.payload as any
    switch (entry.event_type) {
      case 'venture.created':
        view.name = p.name
        view.description = p.description
        view.status = p.status
        view.revenueModel = p.revenueModel
        view.foundedAt = p.foundedAt
        view.foundingMembers = p.foundingMembers
        view.websiteUrl = p.websiteUrl
        view.repoUrl = p.repoUrl
        view.tags = p.tags
        break
      case 'venture.updated':
        if (p.changes) Object.assign(view, p.changes)
        break
      case 'venture.statusChanged':
        view.status = p.newStatus
        break
      case 'venture.archived':
        view.status = 'archived'
        break
    }
    view.lastModified = entry.created_at
  }
  
  // Get revenue totals
  const revenueEntries = await queryChain({
    convergenceId,
    eventType: 'treasury.revenue.received',
  })
  const ventureRevenue = revenueEntries.filter(e => (e.payload as any).ventureId === ventureId)
  view.totalRevenue = ventureRevenue.reduce((sum, e) => sum + ((e.payload as any).amountUsd || 0), 0)
  
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString()
  view.ytdRevenue = ventureRevenue
    .filter(e => e.created_at >= yearStart)
    .reduce((sum, e) => sum + ((e.payload as any).amountUsd || 0), 0)
  
  if (ventureRevenue.length > 0) {
    view.lastRevenueDate = ventureRevenue[ventureRevenue.length - 1].created_at
  }
  
  // Get active agreements
  const agreements = await queryChain({
    convergenceId,
    eventType: 'agreements.royalty.created',
  })
  const ventureAgreements = agreements.filter(e => (e.payload as any).ventureId === ventureId)
  view.activeAgreements = ventureAgreements.length
  view.totalSharesAllocated = ventureAgreements.reduce((sum, e) => {
    const shares = (e.payload as any).shares || []
    return sum + shares.reduce((s: number, sh: any) => s + (sh.sharePercent || 0), 0)
  }, 0)
  
  // Derive current members from agreements
  const memberSet = new Set<string>()
  ventureAgreements.forEach(e => {
    const shares = (e.payload as any).shares || []
    shares.forEach((s: any) => memberSet.add(s.memberId))
  })
  view.currentMembers = Array.from(memberSet)
  
  return view as VentureView
}

/**
 * List all ventures for a convergence.
 */
export async function listVentures(
  convergenceId: string
): Promise<VentureView[]> {
  const created = await queryChain({
    convergenceId,
    eventType: 'venture.created',
  })
  
  const views: VentureView[] = []
  for (const entry of created) {
    const view = await buildVentureView(convergenceId, entry.aggregate_id)
    if (view) views.push(view)
  }
  return views
}

// ─── Royalty Agreements (Q57) ────────────────────────────────────────

export async function createRoyaltyAgreement(params: {
  convergenceId: string
  payload: RoyaltyAgreementCreatedPayload
  actorId: string
}): Promise<ChainEntry> {
  // Validate total shares ≤ 100%
  const totalShares = params.payload.shares.reduce((s, sh) => s + sh.sharePercent, 0)
  if (totalShares > 100) {
    throw new Error(`Total shares (${totalShares}%) exceed 100%`)
  }
  
  return appendEntry({
    convergenceId: params.convergenceId,
    eventType: 'agreements.royalty.created',
    aggregateId: params.payload.agreementId,
    aggregateType: 'royalty_agreement',
    payload: params.payload as unknown as Record<string, unknown>,
    patternLayer: 6,  // Constraint (agreement)
    actorId: params.actorId,
  })
}

export async function activateRoyaltyAgreement(params: {
  convergenceId: string
  agreementId: string
  payload: RoyaltyAgreementActivatedPayload
  actorId: string
}): Promise<ChainEntry> {
  return appendEntry({
    convergenceId: params.convergenceId,
    eventType: 'agreements.royalty.activated',
    aggregateId: params.agreementId,
    aggregateType: 'royalty_agreement',
    payload: params.payload as unknown as Record<string, unknown>,
    patternLayer: 6,
    actorId: params.actorId,
  })
}

export async function terminateRoyaltyAgreement(params: {
  convergenceId: string
  agreementId: string
  payload: RoyaltyAgreementTerminatedPayload
  actorId: string
}): Promise<ChainEntry> {
  return appendEntry({
    convergenceId: params.convergenceId,
    eventType: 'agreements.royalty.terminated',
    aggregateId: params.agreementId,
    aggregateType: 'royalty_agreement',
    payload: params.payload as unknown as Record<string, unknown>,
    patternLayer: 6,
    actorId: params.actorId,
  })
}

// ─── Revenue Events (Q58) ───────────────────────────────────────────

/**
 * Record revenue received by a venture.
 */
export async function recordRevenue(params: {
  convergenceId: string
  payload: RevenueReceivedPayload
  actorId: string
}): Promise<ChainEntry> {
  return appendEntry({
    convergenceId: params.convergenceId,
    eventType: 'treasury.revenue.received',
    aggregateId: params.payload.revenueId,
    aggregateType: 'revenue',
    payload: params.payload as unknown as Record<string, unknown>,
    patternLayer: 4,  // Event
    actorId: params.actorId,
  })
}

/**
 * Allocate revenue to members per royalty agreement.
 * Reads the active agreement, computes vested shares, records allocation.
 */
export async function allocateRevenue(params: {
  convergenceId: string
  revenueId: string
  ventureId: string
  agreementId: string
  allocationId: string
  actorId: string
}): Promise<ChainEntry> {
  // Get the revenue entry
  const revenueEntries = await queryChain({
    convergenceId: params.convergenceId,
    aggregateId: params.revenueId,
  })
  const revenueEntry = revenueEntries.find(e => e.event_type === 'treasury.revenue.received')
  if (!revenueEntry) throw new Error(`Revenue ${params.revenueId} not found`)
  
  const revenuePayload = revenueEntry.payload as unknown as RevenueReceivedPayload
  
  // Get the royalty agreement
  const agreementEntries = await queryChain({
    convergenceId: params.convergenceId,
    aggregateId: params.agreementId,
  })
  const agreementEntry = agreementEntries.find(e => e.event_type === 'agreements.royalty.created')
  if (!agreementEntry) throw new Error(`Agreement ${params.agreementId} not found`)
  
  const agreement = agreementEntry.payload as unknown as RoyaltyAgreementCreatedPayload
  const { computeVestedPercent } = await import('../types/venture')
  
  const now = new Date()
  const memberAllocations = agreement.shares.map(share => {
    const vestedPercent = computeVestedPercent(share, now)
    const grossAmount = revenuePayload.amountUsd * (share.sharePercent / 100)
    const vestedAmount = grossAmount * (vestedPercent / 100)
    const unvestedAmount = grossAmount - vestedAmount
    
    return {
      memberId: share.memberId,
      sharePercent: share.sharePercent,
      vestedPercent,
      grossAmount,
      vestedAmount,
      unvestedAmount,
    }
  })
  
  const payload: RevenueAllocatedPayload = {
    allocationId: params.allocationId,
    revenueId: params.revenueId,
    ventureId: params.ventureId,
    agreementId: params.agreementId,
    allocatedAt: now.toISOString(),
    memberAllocations,
    totalDistributable: memberAllocations.reduce((s, m) => s + m.vestedAmount, 0),
    totalHeld: memberAllocations.reduce((s, m) => s + m.unvestedAmount, 0),
  }
  
  return appendEntry({
    convergenceId: params.convergenceId,
    eventType: 'treasury.revenue.allocated',
    aggregateId: params.allocationId,
    aggregateType: 'revenue',
    payload: payload as unknown as Record<string, unknown>,
    patternLayer: 5,  // Flow
    actorId: params.actorId,
    correlationId: params.revenueId,
  })
}

/**
 * Distribute allocated revenue to member accounts (double-entry).
 * Creates one transaction per member: debit venture revenue, credit member royalty account.
 */
export async function distributeRevenue(params: {
  convergenceId: string
  allocationId: string
  distributionId: string
  distributedBy: string
}): Promise<ChainEntry> {
  // Get allocation
  const allocationEntries = await queryChain({
    convergenceId: params.convergenceId,
    aggregateId: params.allocationId,
  })
  const allocationEntry = allocationEntries.find(e => e.event_type === 'treasury.revenue.allocated')
  if (!allocationEntry) throw new Error(`Allocation ${params.allocationId} not found`)
  
  const allocation = allocationEntry.payload as unknown as RevenueAllocatedPayload
  
  // Create double-entry transactions for each distributable member
  const distributions: Array<{
    memberId: string
    amount: number
    transactionId: string
    accountId: string
  }> = []
  
  for (const memberAlloc of allocation.memberAllocations) {
    if (memberAlloc.vestedAmount <= 0) continue
    
    const txnId = `royalty-dist-${params.distributionId}-${memberAlloc.memberId}`
    const memberAccount = `royalty:${memberAlloc.memberId}`
    
    await postTransaction({
      convergenceId: params.convergenceId,
      transactionId: txnId,
      debitAccountId: `revenue:venture:${allocation.ventureId}`,
      creditAccountId: memberAccount,
      amount: memberAlloc.vestedAmount,
      description: `Royalty distribution: ${allocation.ventureId} → ${memberAlloc.memberId}`,
      postedBy: params.distributedBy,
      correlationId: params.allocationId,
    })
    
    distributions.push({
      memberId: memberAlloc.memberId,
      amount: memberAlloc.vestedAmount,
      transactionId: txnId,
      accountId: memberAccount,
    })
  }
  
  const payload: RevenueDistributedPayload = {
    distributionId: params.distributionId,
    allocationId: params.allocationId,
    ventureId: allocation.ventureId,
    distributedBy: params.distributedBy,
    distributedAt: new Date().toISOString(),
    distributions,
    totalDistributed: distributions.reduce((s, d) => s + d.amount, 0),
  }
  
  return appendEntry({
    convergenceId: params.convergenceId,
    eventType: 'treasury.revenue.distributed',
    aggregateId: params.distributionId,
    aggregateType: 'revenue',
    payload: payload as unknown as Record<string, unknown>,
    patternLayer: 5,
    actorId: params.distributedBy,
    correlationId: params.allocationId,
  })
}

// ─── Vesting Engine (Q59) ───────────────────────────────────────────

/**
 * Process vesting for all active agreements.
 * Checks time-based vesting and milestones, emits vesting events.
 * Designed to run periodically (cron or heartbeat).
 */
export async function processVesting(
  convergenceId: string,
  actorId: string
): Promise<ChainEntry[]> {
  const { computeVestedPercent, checkMilestones } = await import('../types/venture')
  const entries: ChainEntry[] = []
  
  // Get all active agreements
  const agreements = await queryChain({
    convergenceId,
    eventType: 'agreements.royalty.created',
  })
  
  // Get existing vesting events (to avoid duplicates)
  const existingVesting = await queryChain({
    convergenceId,
    eventType: 'agreements.royalty.vested',
  })
  
  const now = new Date()
  
  for (const agEntry of agreements) {
    const agreement = agEntry.payload as unknown as RoyaltyAgreementCreatedPayload
    
    // Get total revenue for the venture (for milestone checks)
    const revenueEntries = await queryChain({
      convergenceId,
      eventType: 'treasury.revenue.received',
    })
    const ventureRevenue = revenueEntries
      .filter(e => (e.payload as any).ventureId === agreement.ventureId)
      .reduce((sum, e) => sum + ((e.payload as any).amountUsd || 0), 0)
    
    for (const share of agreement.shares) {
      const currentVested = computeVestedPercent(share, now)
      
      // Find last recorded vested % for this member+agreement
      const lastVesting = existingVesting
        .filter(e => {
          const p = e.payload as any
          return p.agreementId === agreement.agreementId && p.memberId === share.memberId
        })
        .sort((a, b) => b.chain_index - a.chain_index)[0]
      
      const lastVestedPercent = lastVesting 
        ? (lastVesting.payload as any).newVestedPercent || 0 
        : 0
      
      // Emit vesting event if vested % has increased significantly (>1%)
      if (currentVested - lastVestedPercent >= 1) {
        const payload: RoyaltyVestedPayload = {
          agreementId: agreement.agreementId,
          memberId: share.memberId,
          vestedAt: now.toISOString(),
          previousVestedPercent: lastVestedPercent,
          newVestedPercent: currentVested,
          vestedAmount: 0,  // would compute from total accrued royalties
          vestingType: share.vesting,
          reason: `${share.vesting} vesting: ${currentVested.toFixed(1)}% vested`,
        }
        
        const entry = await appendEntry({
          convergenceId,
          eventType: 'agreements.royalty.vested',
          aggregateId: agreement.agreementId,
          aggregateType: 'royalty_agreement',
          payload: payload as unknown as Record<string, unknown>,
          patternLayer: 5,
          actorId,
        })
        entries.push(entry)
      }
      
      // Check milestones
      const newMilestones = checkMilestones(share, ventureRevenue, now)
      for (const milestone of newMilestones) {
        const payload: CliffReachedPayload = {
          agreementId: agreement.agreementId,
          memberId: share.memberId,
          cliffReachedAt: now.toISOString(),
          cliffMonths: share.cliffMonths || 0,
          vestedPercent: milestone.vestedPercent,
          vestedAmount: 0,
        }
        
        const entry = await appendEntry({
          convergenceId,
          eventType: 'agreements.royalty.cliff_reached',
          aggregateId: agreement.agreementId,
          aggregateType: 'royalty_agreement',
          payload: payload as unknown as Record<string, unknown>,
          patternLayer: 5,
          actorId,
        })
        entries.push(entry)
      }
    }
  }
  
  return entries
}

/**
 * Get royalty summary for a member across all ventures.
 */
export async function getMemberRoyaltySummary(
  convergenceId: string,
  memberId: string
): Promise<{
  ventures: Array<{
    ventureId: string
    ventureName: string
    sharePercent: number
    vestedPercent: number
    totalEarned: number
    totalDistributed: number
    pendingDistribution: number
  }>
  totalEarned: number
  totalDistributed: number
  totalPending: number
}> {
  const { computeVestedPercent } = await import('../types/venture')
  
  // Get all agreements involving this member
  const allAgreements = await queryChain({
    convergenceId,
    eventType: 'agreements.royalty.created',
  })
  
  const memberAgreements = allAgreements.filter(e => {
    const shares = (e.payload as any).shares || []
    return shares.some((s: any) => s.memberId === memberId)
  })
  
  const ventures: Array<{
    ventureId: string
    ventureName: string
    sharePercent: number
    vestedPercent: number
    totalEarned: number
    totalDistributed: number
    pendingDistribution: number
  }> = []
  
  for (const agEntry of memberAgreements) {
    const agreement = agEntry.payload as unknown as RoyaltyAgreementCreatedPayload
    const share = agreement.shares.find(s => s.memberId === memberId)
    if (!share) continue
    
    const vestedPercent = computeVestedPercent(share)
    
    // Get distributions to this member from this venture
    const distributions = await queryChain({
      convergenceId,
      eventType: 'treasury.revenue.distributed',
    })
    
    const memberDistributions = distributions.filter(e => {
      const p = e.payload as any
      return p.ventureId === agreement.ventureId &&
             p.distributions?.some((d: any) => d.memberId === memberId)
    })
    
    const totalDistributed = memberDistributions.reduce((sum, e) => {
      const dist = (e.payload as any).distributions?.find((d: any) => d.memberId === memberId)
      return sum + (dist?.amount || 0)
    }, 0)
    
    // Get venture name
    const ventureEntries = await queryChain({
      convergenceId,
      aggregateId: agreement.ventureId,
      eventType: 'venture.created',
    })
    const ventureName = ventureEntries.length > 0 
      ? (ventureEntries[0].payload as any).name 
      : agreement.ventureId
    
    // Total earned = all allocations for this member from this venture
    const allocations = await queryChain({
      convergenceId,
      eventType: 'treasury.revenue.allocated',
    })
    const memberAllocations = allocations.filter(e => {
      const p = e.payload as any
      return p.ventureId === agreement.ventureId &&
             p.memberAllocations?.some((m: any) => m.memberId === memberId)
    })
    const totalEarned = memberAllocations.reduce((sum, e) => {
      const alloc = (e.payload as any).memberAllocations?.find((m: any) => m.memberId === memberId)
      return sum + (alloc?.vestedAmount || 0)
    }, 0)
    
    ventures.push({
      ventureId: agreement.ventureId,
      ventureName,
      sharePercent: share.sharePercent,
      vestedPercent,
      totalEarned,
      totalDistributed,
      pendingDistribution: totalEarned - totalDistributed,
    })
  }
  
  return {
    ventures,
    totalEarned: ventures.reduce((s, v) => s + v.totalEarned, 0),
    totalDistributed: ventures.reduce((s, v) => s + v.totalDistributed, 0),
    totalPending: ventures.reduce((s, v) => s + v.pendingDistribution, 0),
  }
}
