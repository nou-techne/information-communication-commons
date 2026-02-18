/**
 * Patronage Formula Engine — Ported from habitat, adapted for chain-based commons.id
 * 
 * Sprint Q48: Port PatronageFormulaEngine from habitat (variable weights)
 * Author: TIO Sprint Runner
 * Date: 2026-02-18
 * Source: habitat/packages/shared/src/engine/patronage-formula.ts
 * 
 * Changes from habitat:
 * - Reads approved contributions from chain entries (not raw ContributionInput[])
 * - Records formula inputs/outputs as chain entries for auditability
 * - Uses commons.id type system (ChainEntry, ContributionView)
 * - Adds chain-native verification (formula results are chain entries, not ephemeral)
 * - Integrates with double-entry engine for posting allocations
 * 
 * Formula (unchanged from habitat):
 * 1. Raw patronage = monetary value of contribution (from chain: creditAmount)
 * 2. Weighted patronage = raw × type weight
 * 3. Member share = member weighted / total weighted
 * 4. Member allocation = allocable surplus × member share
 * 5. Cash distribution = allocation × cash rate (min 20% per IRC 1385)
 * 6. Retained allocation = allocation × (1 - cash rate)
 */

import { queryChain, getContributionsByState, appendEntry } from './chain-engine'
import { accountId, postTransaction } from './double-entry'
import type {
  ChainEntry,
  ContributionView,
  AllocationCreatedPayload,
  AllocationApprovedPayload,
  TransactionPostedPayload,
} from '../types/chain'
import { v4 as uuidv4 } from 'uuid'

// ─── Types ───────────────────────────────────────────────────────────

export type ContributionCategory = 'labor' | 'expertise' | 'capital' | 'relationship'

export interface PatronageWeights {
  labor: number
  expertise: number
  capital: number
  relationship: number
}

export const DEFAULT_WEIGHTS: PatronageWeights = {
  labor: 1.0,
  expertise: 1.5,
  capital: 1.0,
  relationship: 0.5,
}

export interface MemberPatronage {
  memberId: string
  byCategory: Map<ContributionCategory, {
    rawPatronage: number
    weight: number
    weightedPatronage: number
    contributionCount: number
    contributionIds: string[]
  }>
  totalRaw: number
  totalWeighted: number
}

export interface AllocationResult {
  memberId: string
  memberShare: number         // 0.0 - 1.0
  totalAllocation: number
  cashDistribution: number    // min 20% per IRC 1385
  retainedAllocation: number
  byCategory: Array<{
    category: ContributionCategory
    rawPatronage: number
    weight: number
    weightedPatronage: number
    allocation: number
  }>
}

export interface PatronageRunResult {
  periodId?: string
  allocableSurplus: number
  cashRate: number
  weights: PatronageWeights
  totalRawPatronage: number
  totalWeightedPatronage: number
  memberCount: number
  contributionCount: number
  allocations: AllocationResult[]
  verification: { valid: boolean; violations: string[] }
}

// ─── Category Mapping ────────────────────────────────────────────────

/**
 * Map a contribution's extracted category to a patronage category.
 * 
 * Contribution categories (from NL parser): code, research, coordination, design, documentation, community, governance, other
 * Patronage categories (from formula): labor, expertise, capital, relationship
 */
function mapToPatronageCategory(contributionCategory?: string): ContributionCategory {
  switch (contributionCategory) {
    case 'code':
    case 'design':
      return 'labor'
    case 'research':
    case 'documentation':
      return 'expertise'
    case 'capital':
      return 'capital'
    case 'coordination':
    case 'community':
    case 'governance':
    case 'relationship':
      return 'relationship'
    default:
      return 'labor' // default to labor for unmapped categories
  }
}

// ─── Engine ──────────────────────────────────────────────────────────

export class PatronageFormulaEngine {
  private weights: PatronageWeights

  constructor(weights?: Partial<PatronageWeights>) {
    this.weights = { ...DEFAULT_WEIGHTS, ...weights }
  }

  /**
   * Calculate patronage from approved contributions in the chain.
   * 
   * Reads all approved contributions for a convergence and computes
   * weighted patronage per member per category.
   */
  calculatePatronageFromChain(
    contributions: ContributionView[]
  ): Map<string, MemberPatronage> {
    const patronageByMember = new Map<string, MemberPatronage>()

    // Only process approved contributions with credit amounts
    const approved = contributions.filter(
      c => c.currentState === 'approved' && c.creditAmount && c.creditAmount > 0
    )

    for (const contribution of approved) {
      const memberId = contribution.contributorId
      const category = mapToPatronageCategory(contribution.category)
      const rawValue = contribution.creditAmount!

      if (!patronageByMember.has(memberId)) {
        patronageByMember.set(memberId, {
          memberId,
          byCategory: new Map(),
          totalRaw: 0,
          totalWeighted: 0,
        })
      }

      const member = patronageByMember.get(memberId)!

      if (!member.byCategory.has(category)) {
        member.byCategory.set(category, {
          rawPatronage: 0,
          weight: this.weights[category],
          weightedPatronage: 0,
          contributionCount: 0,
          contributionIds: [],
        })
      }

      const catEntry = member.byCategory.get(category)!
      catEntry.rawPatronage += rawValue
      catEntry.weightedPatronage = catEntry.rawPatronage * catEntry.weight
      catEntry.contributionCount++
      catEntry.contributionIds.push(contribution.id)
    }

    // Compute totals
    for (const member of patronageByMember.values()) {
      let totalRaw = 0
      let totalWeighted = 0
      for (const cat of member.byCategory.values()) {
        totalRaw += cat.rawPatronage
        totalWeighted += cat.weightedPatronage
      }
      member.totalRaw = totalRaw
      member.totalWeighted = totalWeighted
    }

    return patronageByMember
  }

  /**
   * Calculate allocations from patronage.
   * 
   * @param patronageByMember - Output from calculatePatronageFromChain
   * @param allocableSurplus - Total surplus to distribute
   * @param cashRate - Cash distribution rate (min 0.20 per IRC 1385)
   */
  calculateAllocations(
    patronageByMember: Map<string, MemberPatronage>,
    allocableSurplus: number,
    cashRate: number = 0.20
  ): AllocationResult[] {
    // Validate cash rate (IRC 1385)
    if (cashRate < 0.20) {
      throw new Error('Cash distribution rate must be at least 20% (IRC 1385)')
    }
    if (cashRate > 1.0 || cashRate < 0) {
      throw new Error('Cash distribution rate must be between 0 and 1')
    }

    // Total weighted patronage across all members
    let totalWeighted = 0
    for (const member of patronageByMember.values()) {
      totalWeighted += member.totalWeighted
    }

    if (totalWeighted === 0) return []

    const allocations: AllocationResult[] = []

    for (const member of patronageByMember.values()) {
      const memberShare = member.totalWeighted / totalWeighted
      const totalAllocation = round2(allocableSurplus * memberShare)
      const cashDistribution = round2(totalAllocation * cashRate)
      const retainedAllocation = round2(totalAllocation * (1 - cashRate))

      const byCategory: AllocationResult['byCategory'] = []
      for (const [category, catEntry] of member.byCategory.entries()) {
        const catShare = member.totalWeighted > 0
          ? catEntry.weightedPatronage / member.totalWeighted
          : 0
        byCategory.push({
          category,
          rawPatronage: catEntry.rawPatronage,
          weight: catEntry.weight,
          weightedPatronage: catEntry.weightedPatronage,
          allocation: round2(totalAllocation * catShare),
        })
      }

      allocations.push({
        memberId: member.memberId,
        memberShare,
        totalAllocation,
        cashDistribution,
        retainedAllocation,
        byCategory,
      })
    }

    return allocations
  }

  /**
   * Full run: read chain → compute patronage → compute allocations → verify
   */
  run(
    contributions: ContributionView[],
    allocableSurplus: number,
    cashRate: number = 0.20,
    periodId?: string
  ): PatronageRunResult {
    const patronageByMember = this.calculatePatronageFromChain(contributions)
    const allocations = this.calculateAllocations(patronageByMember, allocableSurplus, cashRate)
    const verification = verifyAllocations(allocations, allocableSurplus, cashRate)

    let totalRaw = 0
    let totalWeighted = 0
    let contributionCount = 0
    for (const member of patronageByMember.values()) {
      totalRaw += member.totalRaw
      totalWeighted += member.totalWeighted
      for (const cat of member.byCategory.values()) {
        contributionCount += cat.contributionCount
      }
    }

    return {
      periodId,
      allocableSurplus,
      cashRate,
      weights: { ...this.weights },
      totalRawPatronage: totalRaw,
      totalWeightedPatronage: totalWeighted,
      memberCount: patronageByMember.size,
      contributionCount,
      allocations,
      verification,
    }
  }

  /**
   * Run and record to chain.
   * 
   * Creates two chain entries:
   * 1. `agreements.allocation.created` — records inputs (formula version, weights, surplus)
   * 2. `agreements.allocation.approved` — records outputs (member allocations)
   * 
   * Optionally posts double-entry transactions for each member's allocation.
   */
  async runAndRecord(params: {
    convergenceId: string
    contributions: ContributionView[]
    allocableSurplus: number
    cashRate?: number
    periodId: string
    actorId: string
    postTransactions?: boolean  // If true, post double-entry transactions
  }): Promise<{ result: PatronageRunResult; chainEntries: ChainEntry[] }> {
    const cashRate = params.cashRate ?? 0.20
    const result = this.run(
      params.contributions,
      params.allocableSurplus,
      cashRate,
      params.periodId
    )

    if (!result.verification.valid) {
      throw new Error(
        `Allocation verification failed: ${result.verification.violations.join('; ')}`
      )
    }

    const allocationId = uuidv4()
    const chainEntries: ChainEntry[] = []

    // Record allocation creation (inputs)
    const createdPayload: AllocationCreatedPayload = {
      allocationId,
      periodId: params.periodId,
      formulaVersion: '1.0-commons-id',
      inputParameters: {
        weights: this.weights,
        allocableSurplus: params.allocableSurplus,
        cashRate,
        contributionCount: result.contributionCount,
        memberCount: result.memberCount,
      },
      createdBy: params.actorId,
      createdAt: new Date().toISOString(),
    }

    const createdEntry = await appendEntry({
      convergenceId: params.convergenceId,
      eventType: 'agreements.allocation.created',
      aggregateId: allocationId,
      aggregateType: 'allocation',
      payload: createdPayload as unknown as Record<string, unknown>,
      patternLayer: 5,
      actorId: params.actorId,
    })
    chainEntries.push(createdEntry)

    // Record allocation approval (outputs)
    const approvedPayload: AllocationApprovedPayload = {
      allocationId,
      approvedBy: params.actorId,
      approvedAt: new Date().toISOString(),
      memberAllocations: result.allocations.map(a => ({
        memberId: a.memberId,
        amount: a.totalAllocation,
        share: a.memberShare,
      })),
    }

    const approvedEntry = await appendEntry({
      convergenceId: params.convergenceId,
      eventType: 'agreements.allocation.approved',
      aggregateId: allocationId,
      aggregateType: 'allocation',
      payload: approvedPayload as unknown as Record<string, unknown>,
      patternLayer: 5,
      actorId: params.actorId,
      correlationId: createdEntry.id,
    })
    chainEntries.push(approvedEntry)

    // Optionally post double-entry transactions for each allocation
    if (params.postTransactions) {
      for (const allocation of result.allocations) {
        if (allocation.totalAllocation <= 0) continue

        const txId = uuidv4()
        const txEntry = await postTransaction({
          convergenceId: params.convergenceId,
          transactionId: txId,
          debitAccountId: accountId('patronage_expense', params.convergenceId),
          creditAccountId: accountId('capital', allocation.memberId),
          amount: allocation.totalAllocation,
          description: `Patronage allocation for period ${params.periodId}`,
          periodId: params.periodId,
          postedBy: params.actorId,
          correlationId: approvedEntry.id,
        })
        chainEntries.push(txEntry)
      }
    }

    return { result, chainEntries }
  }

  setWeights(weights: Partial<PatronageWeights>): void {
    this.weights = { ...this.weights, ...weights }
  }

  getWeights(): PatronageWeights {
    return { ...this.weights }
  }
}

// ─── Multi-Period Accumulator ────────────────────────────────────────

/**
 * Tracks patronage across multiple accounting periods.
 * Ported from habitat MultiPeriodPatronageAccumulator, adapted for chain types.
 */
export class MultiPeriodAccumulator {
  private periods: Map<string, Map<string, MemberPatronage>> = new Map()

  addPeriod(periodId: string, patronage: Map<string, MemberPatronage>): void {
    this.periods.set(periodId, patronage)
  }

  getCumulativePatronage(memberId: string): MemberPatronage {
    const cumulative: MemberPatronage = {
      memberId,
      byCategory: new Map(),
      totalRaw: 0,
      totalWeighted: 0,
    }

    for (const periodMap of this.periods.values()) {
      const pd = periodMap.get(memberId)
      if (!pd) continue

      for (const [cat, catData] of pd.byCategory.entries()) {
        if (!cumulative.byCategory.has(cat)) {
          cumulative.byCategory.set(cat, {
            rawPatronage: 0,
            weight: catData.weight,
            weightedPatronage: 0,
            contributionCount: 0,
            contributionIds: [],
          })
        }

        const c = cumulative.byCategory.get(cat)!
        c.rawPatronage += catData.rawPatronage
        c.weightedPatronage += catData.weightedPatronage
        c.contributionCount += catData.contributionCount
        c.contributionIds.push(...catData.contributionIds)
      }
    }

    let totalRaw = 0
    let totalWeighted = 0
    for (const cat of cumulative.byCategory.values()) {
      totalRaw += cat.rawPatronage
      totalWeighted += cat.weightedPatronage
    }
    cumulative.totalRaw = totalRaw
    cumulative.totalWeighted = totalWeighted

    return cumulative
  }

  getAllCumulativePatronage(): Map<string, MemberPatronage> {
    const allMembers = new Set<string>()
    for (const periodMap of this.periods.values()) {
      for (const memberId of periodMap.keys()) {
        allMembers.add(memberId)
      }
    }

    const result = new Map<string, MemberPatronage>()
    for (const memberId of allMembers) {
      result.set(memberId, this.getCumulativePatronage(memberId))
    }
    return result
  }
}

// ─── Verification ────────────────────────────────────────────────────

/**
 * Verify allocation correctness (ported from habitat).
 * 
 * Invariants:
 * 1. Sum of allocations ≈ allocable surplus (within $0.01 rounding)
 * 2. Cash + retained = total for each member
 * 3. Cash rate matches expected rate
 * 4. Member shares sum to 1.0
 */
export function verifyAllocations(
  allocations: AllocationResult[],
  allocableSurplus: number,
  cashRate: number
): { valid: boolean; violations: string[] } {
  const violations: string[] = []

  // Invariant 1: Sum ≈ surplus
  let totalAllocated = 0
  for (const a of allocations) {
    totalAllocated += a.totalAllocation
  }
  if (Math.abs(totalAllocated - allocableSurplus) > 0.01) {
    violations.push(
      `Total allocated ($${totalAllocated.toFixed(2)}) ≠ surplus ($${allocableSurplus.toFixed(2)})`
    )
  }

  // Invariant 2: Cash + retained = total
  for (const a of allocations) {
    const sum = a.cashDistribution + a.retainedAllocation
    if (Math.abs(sum - a.totalAllocation) > 0.01) {
      violations.push(
        `Member ${a.memberId}: cash+retained ($${sum.toFixed(2)}) ≠ total ($${a.totalAllocation.toFixed(2)})`
      )
    }
  }

  // Invariant 3: Cash rate
  for (const a of allocations) {
    if (a.totalAllocation === 0) continue
    const actual = a.cashDistribution / a.totalAllocation
    if (Math.abs(actual - cashRate) > 0.001) {
      violations.push(
        `Member ${a.memberId}: cash rate ${(actual * 100).toFixed(1)}% ≠ expected ${(cashRate * 100).toFixed(1)}%`
      )
    }
  }

  // Invariant 4: Shares sum to 1.0
  let totalShare = 0
  for (const a of allocations) {
    totalShare += a.memberShare
  }
  if (Math.abs(totalShare - 1.0) > 0.0001 && allocations.length > 0) {
    violations.push(`Total shares (${totalShare.toFixed(4)}) ≠ 1.0`)
  }

  return { valid: violations.length === 0, violations }
}

// ─── Helpers ─────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
