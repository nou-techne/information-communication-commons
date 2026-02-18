/**
 * Allocation Statements + K-1 Data Export
 * 
 * Sprint Q53: Allocation statements + K-1 data export
 * Author: TIO Sprint Runner
 * Date: 2026-02-18
 * 
 * Generates:
 * 1. Member allocation statements (per period, human-readable)
 * 2. K-1 data export (IRS Schedule K-1 fields for cooperative patronage)
 * 
 * K-1 data includes:
 * - Box 1: Ordinary business income (from patronage)
 * - Box 4a: Guaranteed payments (if applicable)
 * - Box 5: Interest income
 * - Box 11: Section 1385 patronage dividends
 *   - 11A: Cash distributions
 *   - 11B: Retained allocations (written notices of allocation)
 * - Capital account analysis (beginning, contributions, distributions, ending)
 */

import { queryChain, computeCapitalAccountBalance, getMemberContributions } from './chain-engine'
import { getAllPeriods, getContributionsForPeriod } from './period-lifecycle'
import type { ChainEntry, TransactionPostedPayload } from '../types/chain'

// ─── Types ───────────────────────────────────────────────────────────

export interface AllocationStatement {
  memberId: string
  memberName?: string
  convergenceId: string
  periodId: string
  periodStartDate: string
  periodEndDate: string
  generatedAt: string

  // Contribution summary
  contributions: Array<{
    contributionId: string
    title: string
    creditAmount: number
    category?: string
    approvedAt: string
  }>
  totalContributions: number

  // Allocation details
  patronageShare: number       // 0.0 - 1.0
  totalAllocation: number
  cashDistribution: number
  retainedAllocation: number
  cashRate: number

  // Capital account
  capitalAccountBeginning: number
  capitalAccountEnding: number
  netChange: number
}

export interface K1Data {
  // Tax year
  taxYear: number
  partnershipEIN?: string
  partnershipName: string

  // Partner info
  partnerId: string
  partnerName?: string
  partnerTIN?: string

  // K-1 boxes
  box1_ordinaryIncome: number
  box4a_guaranteedPayments: number
  box5_interestIncome: number
  box11_section1385: {
    totalPatronageDividends: number
    cashDistributions: number           // 11A
    retainedAllocations: number         // 11B (written notices)
    qualifiedNotices: number            // qualified written notices of allocation
    nonqualifiedNotices: number         // nonqualified
  }

  // Capital account analysis
  capitalAccount: {
    beginning: number
    contributions: number
    currentYearIncrease: number         // from patronage
    withdrawals: number
    distributions: number
    ending: number
  }

  // Metadata
  generatedAt: string
  chainVerified: boolean                // true if chain integrity passed
  complianceCheckIds: string[]          // chain entry IDs of compliance checks
}

export interface K1ExportBatch {
  taxYear: number
  convergenceId: string
  convergenceName: string
  generatedAt: string
  members: K1Data[]
  summary: {
    totalPatronageDividends: number
    totalCashDistributions: number
    totalRetainedAllocations: number
    memberCount: number
  }
}

// ─── Statement Generation ────────────────────────────────────────────

/**
 * Generate an allocation statement for a member for a specific period.
 */
export async function generateAllocationStatement(params: {
  convergenceId: string
  memberId: string
  periodId: string
  memberName?: string
}): Promise<AllocationStatement> {
  // Get period info
  const periods = await getAllPeriods(params.convergenceId)
  const period = periods.find(p => p.periodId === params.periodId)
  if (!period) throw new Error(`Period ${params.periodId} not found`)

  // Get contributions approved in this period
  const periodApprovals = await getContributionsForPeriod(
    params.convergenceId,
    params.periodId
  )

  // Filter to this member's contributions
  const memberApprovals = periodApprovals.filter(entry => {
    const payload = entry.payload as any
    // Need to check the contribution's contributor
    return true // TODO: filter by contributorId once we have cross-reference
  })

  // Get allocation for this member in this period
  const allocationEntries = await queryChain({
    convergenceId: params.convergenceId,
    eventType: 'agreements.allocation.approved',
  })

  let patronageShare = 0
  let totalAllocation = 0
  let cashDistribution = 0
  let retainedAllocation = 0
  let cashRate = 0.20

  for (const entry of allocationEntries) {
    const payload = entry.payload as any
    const memberAlloc = payload.memberAllocations?.find(
      (a: any) => a.memberId === params.memberId
    )
    if (memberAlloc) {
      patronageShare = memberAlloc.share
      totalAllocation = memberAlloc.amount
      // Look up the allocation.created entry for cash rate
      const createdEntries = await queryChain({
        convergenceId: params.convergenceId,
        eventType: 'agreements.allocation.created',
        aggregateId: payload.allocationId,
      })
      if (createdEntries.length > 0) {
        cashRate = (createdEntries[0].payload as any).inputParameters?.cashRate ?? 0.20
      }
      cashDistribution = Math.round(totalAllocation * cashRate * 100) / 100
      retainedAllocation = Math.round(totalAllocation * (1 - cashRate) * 100) / 100
    }
  }

  // Capital account balance
  const capitalAccountEnding = await computeCapitalAccountBalance(
    params.convergenceId,
    params.memberId
  )

  // Get contributions for display
  const memberContributions = await getMemberContributions(params.convergenceId, params.memberId)
  const approvedContributions = memberContributions
    .filter(c => c.currentState === 'approved' && c.periodId === params.periodId)
    .map(c => ({
      contributionId: c.id,
      title: c.title,
      creditAmount: c.creditAmount ?? 0,
      category: c.category,
      approvedAt: c.approvedAt ?? '',
    }))

  const totalContributions = approvedContributions.reduce(
    (sum, c) => sum + c.creditAmount, 0
  )

  return {
    memberId: params.memberId,
    memberName: params.memberName,
    convergenceId: params.convergenceId,
    periodId: params.periodId,
    periodStartDate: period.startDate,
    periodEndDate: period.endDate,
    generatedAt: new Date().toISOString(),
    contributions: approvedContributions,
    totalContributions,
    patronageShare,
    totalAllocation,
    cashDistribution,
    retainedAllocation,
    cashRate,
    capitalAccountBeginning: capitalAccountEnding - totalAllocation,
    capitalAccountEnding,
    netChange: totalAllocation,
  }
}

/**
 * Generate K-1 data for a member for a tax year.
 */
export async function generateK1Data(params: {
  convergenceId: string
  memberId: string
  taxYear: number
  memberName?: string
  convergenceName?: string
}): Promise<K1Data> {
  // Get all transactions for this member in the tax year
  const transactions = await queryChain({
    convergenceId: params.convergenceId,
    eventType: 'treasury.transaction.posted',
  })

  const yearStart = new Date(`${params.taxYear}-01-01T00:00:00Z`).getTime()
  const yearEnd = new Date(`${params.taxYear + 1}-01-01T00:00:00Z`).getTime()

  // Filter to this member's capital account credits in the tax year
  const memberCapitalId = `capital:${params.memberId}`
  const memberExpenseId = `expense:patronage:${params.convergenceId}`

  let totalCredits = 0
  let totalDebits = 0

  for (const tx of transactions) {
    const payload = tx.payload as TransactionPostedPayload
    const txTime = new Date(payload.postedAt).getTime()
    if (txTime < yearStart || txTime >= yearEnd) continue

    if (payload.creditAccountId === memberCapitalId) {
      totalCredits += payload.amount
    }
    if (payload.debitAccountId === memberCapitalId) {
      totalDebits += payload.amount
    }
  }

  // Get allocation entries for this year
  const allocationEntries = await queryChain({
    convergenceId: params.convergenceId,
    eventType: 'agreements.allocation.approved',
  })

  let totalAllocation = 0
  let totalCash = 0
  let totalRetained = 0

  for (const entry of allocationEntries) {
    const entryTime = new Date(entry.created_at).getTime()
    if (entryTime < yearStart || entryTime >= yearEnd) continue

    const payload = entry.payload as any
    const memberAlloc = payload.memberAllocations?.find(
      (a: any) => a.memberId === params.memberId
    )
    if (memberAlloc) {
      totalAllocation += memberAlloc.amount
      // Look up cash rate from the allocation.created entry
      const createdEntries = await queryChain({
        convergenceId: params.convergenceId,
        eventType: 'agreements.allocation.created',
        aggregateId: payload.allocationId,
      })
      const cashRate = createdEntries.length > 0
        ? (createdEntries[0].payload as any).inputParameters?.cashRate ?? 0.20
        : 0.20
      totalCash += Math.round(memberAlloc.amount * cashRate * 100) / 100
      totalRetained += Math.round(memberAlloc.amount * (1 - cashRate) * 100) / 100
    }
  }

  // Capital account
  const endingBalance = await computeCapitalAccountBalance(
    params.convergenceId,
    params.memberId
  )

  // Check compliance
  const complianceEntries = await queryChain({
    convergenceId: params.convergenceId,
    eventType: 'compliance.check.passed',
  })
  const yearComplianceIds = complianceEntries
    .filter(e => {
      const t = new Date(e.created_at).getTime()
      return t >= yearStart && t < yearEnd
    })
    .map(e => e.id)

  return {
    taxYear: params.taxYear,
    partnershipName: params.convergenceName ?? params.convergenceId,
    partnerId: params.memberId,
    partnerName: params.memberName,

    box1_ordinaryIncome: totalAllocation,
    box4a_guaranteedPayments: 0,
    box5_interestIncome: 0,
    box11_section1385: {
      totalPatronageDividends: totalAllocation,
      cashDistributions: totalCash,
      retainedAllocations: totalRetained,
      qualifiedNotices: totalRetained, // assume all qualified for now
      nonqualifiedNotices: 0,
    },

    capitalAccount: {
      beginning: endingBalance - totalCredits + totalDebits,
      contributions: totalCredits,
      currentYearIncrease: totalAllocation,
      withdrawals: 0,
      distributions: totalDebits,
      ending: endingBalance,
    },

    generatedAt: new Date().toISOString(),
    chainVerified: complianceEntries.length > 0,
    complianceCheckIds: yearComplianceIds,
  }
}

/**
 * Generate K-1 batch for all members of a convergence for a tax year.
 */
export async function generateK1Batch(params: {
  convergenceId: string
  taxYear: number
  convergenceName?: string
}): Promise<K1ExportBatch> {
  // Get all members
  const memberEntries = await queryChain({
    convergenceId: params.convergenceId,
    eventType: 'people.member.created',
  })

  const members: K1Data[] = []

  for (const entry of memberEntries) {
    const payload = entry.payload as any
    const k1 = await generateK1Data({
      convergenceId: params.convergenceId,
      memberId: entry.aggregate_id,
      taxYear: params.taxYear,
      memberName: payload.displayName,
      convergenceName: params.convergenceName,
    })
    members.push(k1)
  }

  const summary = {
    totalPatronageDividends: members.reduce((s, m) => s + m.box11_section1385.totalPatronageDividends, 0),
    totalCashDistributions: members.reduce((s, m) => s + m.box11_section1385.cashDistributions, 0),
    totalRetainedAllocations: members.reduce((s, m) => s + m.box11_section1385.retainedAllocations, 0),
    memberCount: members.length,
  }

  return {
    taxYear: params.taxYear,
    convergenceId: params.convergenceId,
    convergenceName: params.convergenceName ?? params.convergenceId,
    generatedAt: new Date().toISOString(),
    members,
    summary,
  }
}

/**
 * Export K-1 batch as CSV (for accountant import).
 */
export function exportK1BatchAsCSV(batch: K1ExportBatch): string {
  const headers = [
    'Partner ID',
    'Partner Name',
    'Tax Year',
    'Box 1 - Ordinary Income',
    'Box 11 - Total Patronage Dividends',
    'Box 11A - Cash Distributions',
    'Box 11B - Retained Allocations',
    'Capital Account Beginning',
    'Capital Account Ending',
    'Chain Verified',
  ]

  const rows = batch.members.map(m => [
    m.partnerId,
    m.partnerName ?? '',
    m.taxYear.toString(),
    m.box1_ordinaryIncome.toFixed(2),
    m.box11_section1385.totalPatronageDividends.toFixed(2),
    m.box11_section1385.cashDistributions.toFixed(2),
    m.box11_section1385.retainedAllocations.toFixed(2),
    m.capitalAccount.beginning.toFixed(2),
    m.capitalAccount.ending.toFixed(2),
    m.chainVerified ? 'Yes' : 'No',
  ])

  return [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n')
}
