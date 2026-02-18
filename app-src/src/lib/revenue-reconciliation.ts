/**
 * Venture Revenue Reconciliation
 * 
 * Sprint Q63: Import revenue events, match to ventures, trigger royalty allocation.
 * Generates reconciliation reports showing expected vs. actual allocations.
 */

import { queryChain } from './chain-engine'
import { recordRevenue, allocateRevenue, distributeRevenue } from './venture-engine'
import type { RevenueReceivedPayload, RevenueAllocatedPayload } from '../types/venture'

// ─── Types ───────────────────────────────────────────────────────────

export interface RevenueImport {
  externalRef: string
  ventureId: string
  amount: number
  currency: string
  amountUsd: number
  source: string
  description: string
  receivedAt: string
}

export interface ReconciliationEntry {
  revenueId: string
  ventureId: string
  amountUsd: number
  allocated: boolean
  distributed: boolean
  allocationId?: string
  distributionId?: string
  discrepancy?: string
}

export interface ReconciliationReport {
  generatedAt: string
  convergenceId: string
  period: { start: string; end: string }
  
  totalRevenue: number
  totalAllocated: number
  totalDistributed: number
  totalUnallocated: number
  totalUndistributed: number
  
  entries: ReconciliationEntry[]
  discrepancies: string[]
  
  ventureBreakdown: Array<{
    ventureId: string
    revenue: number
    allocated: number
    distributed: number
    gap: number
  }>
}

// ─── Import ──────────────────────────────────────────────────────────

/**
 * Import revenue events from external source (manual, CSV, or API).
 * Checks for duplicates by externalRef before creating chain entries.
 */
export async function importRevenue(
  convergenceId: string,
  imports: RevenueImport[],
  actorId: string
): Promise<{ created: string[]; skipped: string[]; errors: Array<{ ref: string; error: string }> }> {
  const created: string[] = []
  const skipped: string[] = []
  const errors: Array<{ ref: string; error: string }> = []
  
  // Check existing revenue entries to avoid duplicates
  const existing = await queryChain({
    convergenceId,
    eventType: 'treasury.revenue.received',
  })
  const existingRefs = new Set(existing.map(e => (e.payload as any).externalRef).filter(Boolean))
  
  for (const imp of imports) {
    if (existingRefs.has(imp.externalRef)) {
      skipped.push(imp.externalRef)
      continue
    }
    
    try {
      const revenueId = `rev-${imp.ventureId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      
      const payload: RevenueReceivedPayload = {
        revenueId,
        ventureId: imp.ventureId,
        amount: imp.amount,
        currency: imp.currency,
        amountUsd: imp.amountUsd,
        source: imp.source as any,
        description: imp.description,
        receivedAt: imp.receivedAt,
        externalRef: imp.externalRef,
      }
      
      await recordRevenue({ convergenceId, payload, actorId })
      created.push(revenueId)
    } catch (err: any) {
      errors.push({ ref: imp.externalRef, error: err.message })
    }
  }
  
  return { created, skipped, errors }
}

// ─── Auto-Allocate ──────────────────────────────────────────────────

/**
 * Automatically allocate unallocated revenue to members per royalty agreements.
 * Finds revenue entries without corresponding allocation entries and creates them.
 */
export async function autoAllocateRevenue(
  convergenceId: string,
  actorId: string
): Promise<{ allocated: string[]; failed: Array<{ revenueId: string; error: string }> }> {
  const allocated: string[] = []
  const failed: Array<{ revenueId: string; error: string }> = []
  
  // Get all revenue entries
  const revenueEntries = await queryChain({
    convergenceId,
    eventType: 'treasury.revenue.received',
  })
  
  // Get all allocation entries
  const allocationEntries = await queryChain({
    convergenceId,
    eventType: 'treasury.revenue.allocated',
  })
  const allocatedRevenueIds = new Set(allocationEntries.map(e => (e.payload as any).revenueId))
  
  // Get royalty agreements by venture
  const agreements = await queryChain({
    convergenceId,
    eventType: 'agreements.royalty.created',
  })
  const agreementsByVenture = new Map<string, string>()
  agreements.forEach(e => {
    const p = e.payload as any
    agreementsByVenture.set(p.ventureId, p.agreementId)
  })
  
  // Allocate unallocated revenue
  for (const revEntry of revenueEntries) {
    const revenueId = (revEntry.payload as any).revenueId
    if (allocatedRevenueIds.has(revenueId)) continue
    
    const ventureId = (revEntry.payload as any).ventureId
    const agreementId = agreementsByVenture.get(ventureId)
    
    if (!agreementId) {
      failed.push({ revenueId, error: `No royalty agreement for venture ${ventureId}` })
      continue
    }
    
    try {
      const allocationId = `alloc-${revenueId}-${Date.now()}`
      await allocateRevenue({
        convergenceId,
        revenueId,
        ventureId,
        agreementId,
        allocationId,
        actorId,
      })
      allocated.push(allocationId)
    } catch (err: any) {
      failed.push({ revenueId, error: err.message })
    }
  }
  
  return { allocated, failed }
}

// ─── Reconciliation Report ──────────────────────────────────────────

/**
 * Generate a reconciliation report for a date range.
 * Checks: revenue → allocation → distribution pipeline completeness.
 */
export async function generateReconciliationReport(
  convergenceId: string,
  startDate: string,
  endDate: string
): Promise<ReconciliationReport> {
  const discrepancies: string[] = []
  
  // Get all revenue in range
  const revenueEntries = await queryChain({
    convergenceId,
    eventType: 'treasury.revenue.received',
  })
  const inRange = revenueEntries.filter(e =>
    e.created_at >= startDate && e.created_at <= endDate
  )
  
  // Get allocations and distributions
  const allocations = await queryChain({
    convergenceId,
    eventType: 'treasury.revenue.allocated',
  })
  const allocMap = new Map(allocations.map(e => [(e.payload as any).revenueId, e]))
  
  const distributions = await queryChain({
    convergenceId,
    eventType: 'treasury.revenue.distributed',
  })
  const distMap = new Map(distributions.map(e => [(e.payload as any).allocationId, e]))
  
  // Build entries
  const entries: ReconciliationEntry[] = inRange.map(revEntry => {
    const p = revEntry.payload as any
    const allocEntry = allocMap.get(p.revenueId)
    const allocId = allocEntry ? (allocEntry.payload as any).allocationId : undefined
    const distEntry = allocId ? distMap.get(allocId) : undefined
    
    const entry: ReconciliationEntry = {
      revenueId: p.revenueId,
      ventureId: p.ventureId,
      amountUsd: p.amountUsd,
      allocated: !!allocEntry,
      distributed: !!distEntry,
      allocationId: allocId,
      distributionId: distEntry ? (distEntry.payload as any).distributionId : undefined,
    }
    
    if (!allocEntry) {
      entry.discrepancy = 'Revenue not allocated'
      discrepancies.push(`${p.revenueId}: revenue of $${p.amountUsd} not allocated`)
    } else if (!distEntry) {
      entry.discrepancy = 'Allocated but not distributed'
    }
    
    return entry
  })
  
  // Totals
  const totalRevenue = entries.reduce((s, e) => s + e.amountUsd, 0)
  const totalAllocated = entries.filter(e => e.allocated).reduce((s, e) => s + e.amountUsd, 0)
  const totalDistributed = entries.filter(e => e.distributed).reduce((s, e) => s + e.amountUsd, 0)
  
  // Venture breakdown
  const ventureMap = new Map<string, { revenue: number; allocated: number; distributed: number }>()
  entries.forEach(e => {
    const v = ventureMap.get(e.ventureId) || { revenue: 0, allocated: 0, distributed: 0 }
    v.revenue += e.amountUsd
    if (e.allocated) v.allocated += e.amountUsd
    if (e.distributed) v.distributed += e.amountUsd
    ventureMap.set(e.ventureId, v)
  })
  
  return {
    generatedAt: new Date().toISOString(),
    convergenceId,
    period: { start: startDate, end: endDate },
    totalRevenue,
    totalAllocated,
    totalDistributed,
    totalUnallocated: totalRevenue - totalAllocated,
    totalUndistributed: totalAllocated - totalDistributed,
    entries,
    discrepancies,
    ventureBreakdown: Array.from(ventureMap.entries()).map(([ventureId, v]) => ({
      ventureId,
      ...v,
      gap: v.revenue - v.distributed,
    })),
  }
}

/**
 * Export reconciliation report as CSV.
 */
export function exportReconciliationCSV(report: ReconciliationReport): string {
  const headers = ['Revenue ID', 'Venture ID', 'Amount USD', 'Allocated', 'Distributed', 'Discrepancy']
  const rows = report.entries.map(e => [
    e.revenueId,
    e.ventureId,
    e.amountUsd.toFixed(2),
    e.allocated ? 'Yes' : 'No',
    e.distributed ? 'Yes' : 'No',
    e.discrepancy || '',
  ])
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}
