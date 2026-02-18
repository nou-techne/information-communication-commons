/**
 * K-1 Data Export — Schedule K-1 (Form 1065) Generation
 * 
 * Sprint Q53: Generates patronage allocation statements and K-1 tax form data.
 * 
 * Colorado LCAs operate under Subchapter K (partnership tax treatment).
 * Each member receives a Schedule K-1 showing their share of:
 * - Ordinary business income (patronage allocations)
 * - Capital account changes
 * - Distributions received
 * - Tax basis adjustments
 * 
 * This module reads from the chain (period close entries, allocation entries,
 * distribution entries) and generates K-1 data in a format ready for:
 * 1. Member download (PDF)
 * 2. CPA review (CSV/JSON export)
 * 3. IRS submission (via tax software)
 * 
 * Reference: IRS Form 1065, Schedule K-1
 * See: https://www.irs.gov/forms-pubs/about-schedule-k-1-form-1065
 */

import { queryChain } from './chain-engine'
import type { ChainEntry } from '../types/chain'

// ─── Types ───────────────────────────────────────────────────────────

export interface K1Data {
  // Partnership info (Techne/RegenHub)
  partnershipName: string
  partnershipEIN: string
  partnershipAddress: string
  taxYear: number
  
  // Member (partner) info
  memberId: string
  memberName: string
  memberSSN?: string  // or EIN for business members
  memberAddress?: string
  
  // Capital account (tax basis)
  beginningCapital: number
  capitalContributions: number  // member cash/property contributed
  currentYearIncome: number     // allocated share of net income
  currentYearLoss: number
  withdrawalsDistributions: number
  endingCapital: number
  
  // Income allocation (Box 1 - Ordinary business income)
  ordinaryIncome: number
  
  // Self-employment earnings (Box 14)
  selfEmploymentEarnings: number
  
  // Other items
  cashDistributions: number
  nonCashDistributions: number
  
  // Metadata
  generatedAt: string
  periodId: string
  convergenceId: string
}

export interface AllocationStatement {
  periodId: string
  periodName: string
  startDate: string
  endDate: string
  memberId: string
  memberName: string
  
  // Contribution summary
  contributionsCount: number
  contributionsValue: number
  
  // Allocation calculation
  totalContributions: number      // sum of all member contributions this period
  memberShare: number              // % of total (e.g., 0.15 = 15%)
  netIncome: number                // cooperative net income this period
  allocatedAmount: number          // member's share of net income
  
  // Formula details
  formulaVersion: string
  weights: Record<string, number>  // category weights applied
  
  generatedAt: string
}

// ─── K-1 Generation ──────────────────────────────────────────────────

/**
 * Generate K-1 data for a member for a specific tax year.
 * Reads all period allocations and distributions for the year.
 */
export async function generateK1Data(params: {
  convergenceId: string
  memberId: string
  taxYear: number
  partnershipInfo: {
    name: string
    ein: string
    address: string
  }
  memberInfo: {
    name: string
    ssn?: string
    address?: string
  }
}): Promise<K1Data> {
  const yearStart = `${params.taxYear}-01-01T00:00:00Z`
  const yearEnd = `${params.taxYear}-12-31T23:59:59Z`
  
  // Get all allocation entries for this member in the tax year
  const allocations = await queryChain({
    convergenceId: params.convergenceId,
    eventType: 'agreements.allocation.approved',
  })
  
  const memberAllocations = allocations.filter(entry => {
    const payload = entry.payload as any
    const memberAlloc = payload.memberAllocations?.find(
      (m: any) => m.memberId === params.memberId
    )
    return memberAlloc && 
           entry.created_at >= yearStart && 
           entry.created_at <= yearEnd
  })
  
  // Sum allocated income
  const ordinaryIncome = memberAllocations.reduce((sum, entry) => {
    const payload = entry.payload as any
    const memberAlloc = payload.memberAllocations.find(
      (m: any) => m.memberId === params.memberId
    )
    return sum + (memberAlloc?.amount || 0)
  }, 0)
  
  // Get distributions
  const distributions = await queryChain({
    convergenceId: params.convergenceId,
    eventType: 'agreements.distribution.completed',
  })
  
  const memberDistributions = distributions.filter(entry => {
    const payload = entry.payload as any
    return payload.memberId === params.memberId &&
           entry.created_at >= yearStart &&
           entry.created_at <= yearEnd
  })
  
  const cashDistributions = memberDistributions.reduce((sum, entry) => {
    const payload = entry.payload as any
    return sum + (payload.amount || 0)
  }, 0)
  
  // Get capital contributions (member deposits/investments)
  const contributions = await queryChain({
    convergenceId: params.convergenceId,
    eventType: 'treasury.transaction.posted',
  })
  
  const capitalContributions = contributions
    .filter(entry => {
      const payload = entry.payload as any
      return payload.creditAccountId === `capital:${params.memberId}` &&
             payload.description?.includes('Capital contribution') &&
             entry.created_at >= yearStart &&
             entry.created_at <= yearEnd
    })
    .reduce((sum, entry) => sum + ((entry.payload as any).amount || 0), 0)
  
  // Compute capital account (simplified - would need prior year balance)
  const beginningCapital = 0  // TODO: Get from prior year K-1 or genesis
  const endingCapital = beginningCapital + 
                        capitalContributions + 
                        ordinaryIncome - 
                        cashDistributions
  
  // Self-employment earnings (for LLCs/LCAs, often equals ordinary income)
  const selfEmploymentEarnings = ordinaryIncome
  
  return {
    partnershipName: params.partnershipInfo.name,
    partnershipEIN: params.partnershipInfo.ein,
    partnershipAddress: params.partnershipInfo.address,
    taxYear: params.taxYear,
    
    memberId: params.memberId,
    memberName: params.memberInfo.name,
    memberSSN: params.memberInfo.ssn,
    memberAddress: params.memberInfo.address,
    
    beginningCapital,
    capitalContributions,
    currentYearIncome: ordinaryIncome > 0 ? ordinaryIncome : 0,
    currentYearLoss: ordinaryIncome < 0 ? Math.abs(ordinaryIncome) : 0,
    withdrawalsDistributions: cashDistributions,
    endingCapital,
    
    ordinaryIncome,
    selfEmploymentEarnings,
    
    cashDistributions,
    nonCashDistributions: 0,
    
    generatedAt: new Date().toISOString(),
    periodId: `tax-year-${params.taxYear}`,
    convergenceId: params.convergenceId,
  }
}

/**
 * Generate allocation statement for a specific period.
 * Shows contribution-to-allocation flow for member review.
 */
export async function generateAllocationStatement(params: {
  convergenceId: string
  periodId: string
  memberId: string
  memberName: string
}): Promise<AllocationStatement> {
  // Get period details
  const periodEntries = await queryChain({
    convergenceId: params.convergenceId,
    aggregateType: 'period',
    aggregateId: params.periodId,
  })
  
  const openedEntry = periodEntries.find(e => e.event_type === 'treasury.period.opened')
  const closedEntry = periodEntries.find(e => e.event_type === 'treasury.period.closed')
  
  if (!openedEntry) {
    throw new Error(`Period ${params.periodId} not found`)
  }
  
  const openPayload = openedEntry.payload as any
  const closePayload = closedEntry?.payload as any
  
  // Get member contributions this period
  const contributions = await queryChain({
    convergenceId: params.convergenceId,
    eventType: 'people.contribution.approved',
  })
  
  const memberContributions = contributions.filter(entry => {
    const payload = entry.payload as any
    return (payload.contributorId === params.memberId || 
            payload.approvedBy === params.memberId) &&
           entry.created_at >= openPayload.startDate &&
           entry.created_at <= (closePayload?.closedAt || new Date().toISOString())
  })
  
  const contributionsValue = memberContributions.reduce((sum, entry) => {
    return sum + ((entry.payload as any).creditAmount || 0)
  }, 0)
  
  // Get allocation for this period
  const allocations = await queryChain({
    convergenceId: params.convergenceId,
    eventType: 'agreements.allocation.approved',
  })
  
  const periodAllocation = allocations.find(entry => {
    const payload = entry.payload as any
    return payload.periodId === params.periodId
  })
  
  let allocatedAmount = 0
  let memberShare = 0
  let totalContributions = closePayload?.totalContributions || 0
  let formulaVersion = 'unknown'
  let weights: Record<string, number> = {}
  
  if (periodAllocation) {
    const payload = periodAllocation.payload as any
    const memberAlloc = payload.memberAllocations?.find(
      (m: any) => m.memberId === params.memberId
    )
    if (memberAlloc) {
      allocatedAmount = memberAlloc.amount
      memberShare = memberAlloc.share
    }
    formulaVersion = payload.formulaVersion || 'v1.0'
    
    // Get formula inputs (would be stored in allocation.created entry)
    const allocationCreated = await queryChain({
      convergenceId: params.convergenceId,
      eventType: 'agreements.allocation.created',
    })
    const createdEntry = allocationCreated.find(e => 
      (e.payload as any).allocationId === payload.allocationId
    )
    if (createdEntry) {
      weights = (createdEntry.payload as any).inputParameters?.weights || {}
    }
  }
  
  return {
    periodId: params.periodId,
    periodName: `Period ${params.periodId.slice(-4)}`,
    startDate: openPayload.startDate,
    endDate: closePayload?.endDate || new Date().toISOString(),
    memberId: params.memberId,
    memberName: params.memberName,
    
    contributionsCount: memberContributions.length,
    contributionsValue,
    
    totalContributions,
    memberShare,
    netIncome: totalContributions,  // simplified - would be net profit
    allocatedAmount,
    
    formulaVersion,
    weights,
    
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Export K-1 data to CSV for CPA/accountant review.
 */
export function exportK1ToCSV(k1Data: K1Data[]): string {
  const headers = [
    'Member ID',
    'Member Name',
    'SSN/EIN',
    'Beginning Capital',
    'Capital Contributions',
    'Current Year Income',
    'Current Year Loss',
    'Distributions',
    'Ending Capital',
    'Ordinary Income (Box 1)',
    'Self-Employment Earnings (Box 14)',
  ]
  
  const rows = k1Data.map(k1 => [
    k1.memberId,
    k1.memberName,
    k1.memberSSN || '',
    k1.beginningCapital.toFixed(2),
    k1.capitalContributions.toFixed(2),
    k1.currentYearIncome.toFixed(2),
    k1.currentYearLoss.toFixed(2),
    k1.withdrawalsDistributions.toFixed(2),
    k1.endingCapital.toFixed(2),
    k1.ordinaryIncome.toFixed(2),
    k1.selfEmploymentEarnings.toFixed(2),
  ])
  
  return [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n')
}

/**
 * Export allocation statement to human-readable format.
 */
export function formatAllocationStatement(stmt: AllocationStatement): string {
  return `
PATRONAGE ALLOCATION STATEMENT
${stmt.periodName} (${stmt.startDate} to ${stmt.endDate})

Member: ${stmt.memberName} (${stmt.memberId})

CONTRIBUTIONS:
  Count: ${stmt.contributionsCount}
  Total Value: $${stmt.contributionsValue.toFixed(2)}

ALLOCATION:
  Total Period Contributions: $${stmt.totalContributions.toFixed(2)}
  Your Share: ${(stmt.memberShare * 100).toFixed(2)}%
  Net Income: $${stmt.netIncome.toFixed(2)}
  Allocated to You: $${stmt.allocatedAmount.toFixed(2)}

FORMULA:
  Version: ${stmt.formulaVersion}
  Weights: ${JSON.stringify(stmt.weights, null, 2)}

Generated: ${new Date(stmt.generatedAt).toLocaleString()}
  `.trim()
}
