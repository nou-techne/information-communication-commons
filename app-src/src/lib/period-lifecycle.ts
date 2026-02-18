/**
 * Period Lifecycle — Open/close accounting periods on the chain
 * 
 * Sprint Q49: Period open/close chain entries + period lifecycle
 * Author: TIO Sprint Runner
 * Date: 2026-02-18
 * 
 * A "period" is a time-bounded accounting window during which:
 * - Contributions are approved and credited
 * - Patronage allocations are calculated
 * - Distributions are scheduled
 * 
 * Period lifecycle:
 *   treasury.period.opened → (contributions happen) → treasury.period.closed
 * 
 * Closing a period triggers:
 * - No more contribution approvals for that period
 * - Patronage formula run (Q48 engine)
 * - Compliance checks (Q51, future)
 * - Allocation approval (governance, Q54, future)
 */

import { appendEntry, queryChain } from './chain-engine'
import type {
  ChainEntry,
  PeriodOpenedPayload,
  PeriodClosedPayload,
} from '../types/chain'
import { v4 as uuidv4 } from 'uuid'

// ─── Types ───────────────────────────────────────────────────────────

export type PeriodState = 'open' | 'closed'

export interface PeriodView {
  periodId: string
  convergenceId: string
  state: PeriodState
  startDate: string
  endDate: string
  openedBy: string
  openedAt: string
  closedBy?: string
  closedAt?: string
  totalContributions?: number
  totalDistributions?: number
  complianceChecks?: string[]
}

// ─── Period Operations ───────────────────────────────────────────────

/**
 * Open a new accounting period.
 * 
 * Rules:
 * - Only one period can be open at a time per convergence
 * - Start date must be after the previous period's end date (no overlaps)
 */
export async function openPeriod(params: {
  convergenceId: string
  startDate: string  // ISO 8601
  endDate: string    // ISO 8601
  actorId: string
}): Promise<{ success: boolean; periodId?: string; entryId?: string; error?: string }> {
  try {
    // Check that no period is currently open
    const currentOpen = await getOpenPeriod(params.convergenceId)
    if (currentOpen) {
      return {
        success: false,
        error: `Period ${currentOpen.periodId} is already open (${currentOpen.startDate} to ${currentOpen.endDate}). Close it first.`,
      }
    }

    // Check for date overlap with previous periods
    const allPeriods = await getAllPeriods(params.convergenceId)
    const newStart = new Date(params.startDate).getTime()
    const newEnd = new Date(params.endDate).getTime()

    if (newEnd <= newStart) {
      return { success: false, error: 'End date must be after start date' }
    }

    for (const period of allPeriods) {
      const existingEnd = new Date(period.endDate).getTime()
      if (newStart < existingEnd) {
        return {
          success: false,
          error: `New period start (${params.startDate}) overlaps with period ${period.periodId} ending ${period.endDate}`,
        }
      }
    }

    const periodId = uuidv4()

    const payload: PeriodOpenedPayload = {
      periodId,
      startDate: params.startDate,
      endDate: params.endDate,
      openedBy: params.actorId,
      openedAt: new Date().toISOString(),
    }

    const entry = await appendEntry({
      convergenceId: params.convergenceId,
      eventType: 'treasury.period.opened',
      aggregateId: periodId,
      aggregateType: 'period',
      payload: payload as unknown as Record<string, unknown>,
      patternLayer: 5, // Flow
      actorId: params.actorId,
    })

    return { success: true, periodId, entryId: entry.id }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Close an open accounting period.
 * 
 * Records summary stats (total contributions, distributions, compliance checks).
 * After closing, no more contribution approvals can reference this period.
 */
export async function closePeriod(params: {
  convergenceId: string
  periodId: string
  actorId: string
  totalContributions?: number
  totalDistributions?: number
  complianceChecks?: string[]
}): Promise<{ success: boolean; entryId?: string; error?: string }> {
  try {
    // Verify period exists and is open
    const period = await getPeriodView(params.convergenceId, params.periodId)
    if (!period) {
      return { success: false, error: `Period ${params.periodId} not found` }
    }
    if (period.state === 'closed') {
      return { success: false, error: `Period ${params.periodId} is already closed` }
    }

    const payload: PeriodClosedPayload = {
      periodId: params.periodId,
      closedBy: params.actorId,
      closedAt: new Date().toISOString(),
      totalContributions: params.totalContributions ?? 0,
      totalDistributions: params.totalDistributions ?? 0,
      complianceChecks: params.complianceChecks ?? [],
    }

    const entry = await appendEntry({
      convergenceId: params.convergenceId,
      eventType: 'treasury.period.closed',
      aggregateId: params.periodId,
      aggregateType: 'period',
      payload: payload as unknown as Record<string, unknown>,
      patternLayer: 5,
      actorId: params.actorId,
    })

    return { success: true, entryId: entry.id }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// ─── Queries ─────────────────────────────────────────────────────────

/**
 * Get the currently open period for a convergence (if any).
 */
export async function getOpenPeriod(
  convergenceId: string
): Promise<PeriodView | null> {
  const allPeriods = await getAllPeriods(convergenceId)
  return allPeriods.find(p => p.state === 'open') ?? null
}

/**
 * Get a specific period's view by projecting chain entries.
 */
export async function getPeriodView(
  convergenceId: string,
  periodId: string
): Promise<PeriodView | null> {
  const entries = await queryChain({
    convergenceId,
    aggregateType: 'period',
    aggregateId: periodId,
  })

  if (entries.length === 0) return null

  let view: Partial<PeriodView> = {
    periodId,
    convergenceId,
    state: 'open',
  }

  for (const entry of entries) {
    const payload = entry.payload as Record<string, any>

    if (entry.event_type === 'treasury.period.opened') {
      view.startDate = payload.startDate
      view.endDate = payload.endDate
      view.openedBy = payload.openedBy
      view.openedAt = payload.openedAt
      view.state = 'open'
    }

    if (entry.event_type === 'treasury.period.closed') {
      view.closedBy = payload.closedBy
      view.closedAt = payload.closedAt
      view.totalContributions = payload.totalContributions
      view.totalDistributions = payload.totalDistributions
      view.complianceChecks = payload.complianceChecks
      view.state = 'closed'
    }
  }

  return view as PeriodView
}

/**
 * Get all periods for a convergence, ordered by start date.
 */
export async function getAllPeriods(
  convergenceId: string
): Promise<PeriodView[]> {
  // Get all period-opened entries
  const openedEntries = await queryChain({
    convergenceId,
    eventType: 'treasury.period.opened',
  })

  const periods: PeriodView[] = []

  for (const entry of openedEntries) {
    const payload = entry.payload as Record<string, any>
    const periodId = entry.aggregate_id

    // Check if this period has been closed
    const closedEntries = await queryChain({
      convergenceId,
      eventType: 'treasury.period.closed',
      aggregateId: periodId,
    })

    const period: PeriodView = {
      periodId,
      convergenceId,
      state: closedEntries.length > 0 ? 'closed' : 'open',
      startDate: payload.startDate,
      endDate: payload.endDate,
      openedBy: payload.openedBy,
      openedAt: payload.openedAt,
    }

    if (closedEntries.length > 0) {
      const closedPayload = closedEntries[0].payload as Record<string, any>
      period.closedBy = closedPayload.closedBy
      period.closedAt = closedPayload.closedAt
      period.totalContributions = closedPayload.totalContributions
      period.totalDistributions = closedPayload.totalDistributions
      period.complianceChecks = closedPayload.complianceChecks
    }

    periods.push(period)
  }

  // Sort by start date
  periods.sort((a, b) =>
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )

  return periods
}

/**
 * Get contributions approved during a specific period.
 * Matches on the periodId field in contribution approval payloads.
 */
export async function getContributionsForPeriod(
  convergenceId: string,
  periodId: string
): Promise<ChainEntry[]> {
  // Get all contribution approval entries
  const approvals = await queryChain({
    convergenceId,
    eventType: 'people.contribution.approved',
  })

  // Filter to those referencing this period
  return approvals.filter(entry => {
    const payload = entry.payload as Record<string, any>
    return payload.periodId === periodId
  })
}
