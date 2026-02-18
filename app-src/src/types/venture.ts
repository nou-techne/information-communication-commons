/**
 * Venture & Royalty Types — Parallel Revenue Share System
 * 
 * Sprints Q56–Q59: Types for venture registry, royalty agreements,
 * revenue events, and vesting mechanics.
 * 
 * Runs in parallel with patronage:
 * - Patronage: tracks cooperative contributions (labor, coordination, stewardship)
 * - Royalties: tracks future revenue share from co-created venture IP
 * Both feed into the same capital account infrastructure via distinct accounting streams.
 */

// ─── Venture Registry (Q56) ─────────────────────────────────────────

export type VentureStatus = 
  | 'ideation'     // concept stage
  | 'formation'    // team + plan forming
  | 'active'       // building / shipping
  | 'generating'   // producing revenue
  | 'sunset'       // winding down
  | 'archived'     // historical record only

export type RevenueModel =
  | 'saas'           // recurring subscription
  | 'license'        // per-seat or per-instance licensing
  | 'service'        // consulting/implementation revenue
  | 'marketplace'    // transaction fees
  | 'grant'          // grant funding
  | 'hybrid'         // multiple models
  | 'other'

export interface VentureCreatedPayload {
  ventureId: string
  name: string
  description: string
  convergenceId: string          // parent cooperative
  status: VentureStatus
  revenueModel: RevenueModel
  foundedAt: string              // ISO 8601
  foundingMembers: string[]      // member IDs
  websiteUrl?: string
  repoUrl?: string
  tags?: string[]
}

export interface VentureUpdatedPayload {
  ventureId: string
  updatedBy: string
  updatedAt: string
  changes: Partial<{
    name: string
    description: string
    revenueModel: RevenueModel
    websiteUrl: string
    repoUrl: string
    tags: string[]
  }>
}

export interface VentureStatusChangedPayload {
  ventureId: string
  previousStatus: VentureStatus
  newStatus: VentureStatus
  changedBy: string
  changedAt: string
  reason?: string
}

export interface VentureArchivedPayload {
  ventureId: string
  archivedBy: string
  archivedAt: string
  reason: string
  finalRevenue: number       // total revenue generated over lifetime
  lessonsLearned?: string
}

// ─── Venture View (computed from chain) ──────────────────────────────

export interface VentureView {
  id: string
  name: string
  description: string
  convergenceId: string
  status: VentureStatus
  revenueModel: RevenueModel
  foundedAt: string
  foundingMembers: string[]
  currentMembers: string[]       // derived from active royalty agreements
  websiteUrl?: string
  repoUrl?: string
  tags?: string[]
  
  // Revenue metrics (computed)
  totalRevenue: number
  ytdRevenue: number
  lastRevenueDate?: string
  
  // Agreement metrics
  activeAgreements: number
  totalSharesAllocated: number   // sum of all member shares (should ≤ 100%)
  
  lastModified: string
}

// ─── Royalty Agreements (Q57) ────────────────────────────────────────

export type VestingType = 
  | 'immediate'     // fully vested on activation
  | 'linear'        // linear over vestingMonths
  | 'cliff'         // cliff period then fully vested
  | 'cliff_linear'  // cliff then linear vesting
  | 'milestone'     // vests when milestones reached

export type DilutionRule =
  | 'none'           // existing shares remain fixed
  | 'proportional'   // all shares dilute proportionally when new member added
  | 'from_pool'      // new shares come from unallocated pool only
  | 'governance'     // dilution requires governance vote

export interface RoyaltyShare {
  memberId: string
  sharePercent: number        // 0-100 (e.g., 15.5 = 15.5%)
  vesting: VestingType
  vestingMonths?: number      // for linear/cliff_linear
  cliffMonths?: number        // for cliff/cliff_linear
  milestones?: VestingMilestone[]
  startDate: string           // when vesting clock starts
}

export interface VestingMilestone {
  id: string
  description: string
  vestedPercent: number       // % of this share that vests on milestone completion
  triggerType: 'revenue_threshold' | 'date' | 'manual_approval'
  triggerValue?: string       // "$50000" for revenue, ISO date, etc.
  completed: boolean
  completedAt?: string
}

export interface RoyaltyAgreementCreatedPayload {
  agreementId: string
  ventureId: string
  version: number              // 1 for initial, increments on modification
  prevAgreementId?: string     // links to previous version (immutable chain)
  
  createdBy: string
  createdAt: string
  effectiveDate: string
  
  shares: RoyaltyShare[]
  dilutionRule: DilutionRule
  
  // Revenue triggers
  minimumRevenueThreshold?: number  // don't distribute below this
  distributionFrequency: 'monthly' | 'quarterly' | 'annually' | 'on_demand'
  
  notes?: string
}

export interface RoyaltyAgreementActivatedPayload {
  agreementId: string
  activatedBy: string
  activatedAt: string
  governanceApprovalId?: string  // link to governance vote entry
}

export interface RoyaltyAgreementModifiedPayload {
  agreementId: string
  newAgreementId: string     // new version of the agreement
  modifiedBy: string
  modifiedAt: string
  reason: string
  changes: string            // human-readable summary of what changed
}

export interface RoyaltyAgreementTerminatedPayload {
  agreementId: string
  terminatedBy: string
  terminatedAt: string
  reason: string
  finalSettlement: boolean   // whether a final distribution was made
  settlementTransactionId?: string
}

// ─── Revenue Events (Q58) ───────────────────────────────────────────

export type RevenueSource = 
  | 'subscription'
  | 'license_sale'
  | 'service_fee'
  | 'marketplace_fee'
  | 'grant'
  | 'one_time'
  | 'other'

export interface RevenueReceivedPayload {
  revenueId: string
  ventureId: string
  amount: number
  currency: string           // 'USD', 'USDC', 'ETH', etc.
  amountUsd: number          // normalized to USD
  source: RevenueSource
  description: string
  receivedAt: string
  externalRef?: string       // Stripe ID, invoice #, grant #, etc.
  periodId?: string          // patronage period if applicable
}

export interface RevenueAllocatedPayload {
  allocationId: string
  revenueId: string          // links to revenue.received entry
  ventureId: string
  agreementId: string        // which royalty agreement governs this allocation
  allocatedAt: string
  
  memberAllocations: Array<{
    memberId: string
    sharePercent: number     // their % from agreement
    vestedPercent: number    // % of their share that's vested
    grossAmount: number      // share × revenue
    vestedAmount: number     // share × revenue × vested%
    unvestedAmount: number   // remainder (held until vesting)
  }>
  
  totalDistributable: number  // sum of vestedAmounts
  totalHeld: number           // sum of unvestedAmounts
}

export interface RevenueDistributedPayload {
  distributionId: string
  allocationId: string       // links to revenue.allocated entry
  ventureId: string
  distributedBy: string
  distributedAt: string
  
  distributions: Array<{
    memberId: string
    amount: number
    transactionId: string    // double-entry transaction reference
    accountId: string        // member royalty account
  }>
  
  totalDistributed: number
}

// ─── Vesting Mechanics (Q59) ────────────────────────────────────────

export interface RoyaltyVestedPayload {
  agreementId: string
  memberId: string
  vestedAt: string
  
  previousVestedPercent: number
  newVestedPercent: number
  vestedAmount: number       // USD value newly vested
  
  vestingType: VestingType
  reason: string             // "Linear vesting: month 6 of 24", "Milestone: revenue >$50K"
}

export interface CliffReachedPayload {
  agreementId: string
  memberId: string
  cliffReachedAt: string
  cliffMonths: number
  vestedPercent: number      // % that vests at cliff
  vestedAmount: number
}

// ─── Vesting Computation Helpers ─────────────────────────────────────

/**
 * Compute current vested percentage for a share.
 */
export function computeVestedPercent(
  share: RoyaltyShare,
  asOfDate: Date = new Date()
): number {
  const startDate = new Date(share.startDate)
  const monthsElapsed = (asOfDate.getTime() - startDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000)
  
  switch (share.vesting) {
    case 'immediate':
      return 100
      
    case 'linear':
      if (!share.vestingMonths) return 100
      return Math.min(100, (monthsElapsed / share.vestingMonths) * 100)
      
    case 'cliff':
      if (!share.cliffMonths) return 100
      return monthsElapsed >= share.cliffMonths ? 100 : 0
      
    case 'cliff_linear': {
      if (!share.cliffMonths || !share.vestingMonths) return 100
      if (monthsElapsed < share.cliffMonths) return 0
      const postCliffMonths = monthsElapsed - share.cliffMonths
      const remainingVestingMonths = share.vestingMonths - share.cliffMonths
      return Math.min(100, (postCliffMonths / remainingVestingMonths) * 100)
    }
    
    case 'milestone': {
      if (!share.milestones || share.milestones.length === 0) return 0
      return share.milestones
        .filter(m => m.completed)
        .reduce((sum, m) => sum + m.vestedPercent, 0)
    }
    
    default:
      return 0
  }
}

/**
 * Compute vested amount in USD for a share given total royalty value.
 */
export function computeVestedAmount(
  share: RoyaltyShare,
  totalRoyaltyValue: number,
  asOfDate: Date = new Date()
): { vested: number; unvested: number; vestedPercent: number } {
  const vestedPercent = computeVestedPercent(share, asOfDate)
  const grossAmount = totalRoyaltyValue * (share.sharePercent / 100)
  const vested = grossAmount * (vestedPercent / 100)
  const unvested = grossAmount - vested
  
  return { vested, unvested, vestedPercent }
}

/**
 * Check if any milestones are newly completed.
 * Returns milestones that should trigger vesting events.
 */
export function checkMilestones(
  share: RoyaltyShare,
  currentRevenue: number,
  asOfDate: Date = new Date()
): VestingMilestone[] {
  if (share.vesting !== 'milestone' || !share.milestones) return []
  
  return share.milestones.filter(m => {
    if (m.completed) return false  // already completed
    
    switch (m.triggerType) {
      case 'revenue_threshold':
        return currentRevenue >= parseFloat(m.triggerValue || '0')
      case 'date':
        return asOfDate >= new Date(m.triggerValue || '')
      case 'manual_approval':
        return false  // requires explicit approval
      default:
        return false
    }
  })
}
