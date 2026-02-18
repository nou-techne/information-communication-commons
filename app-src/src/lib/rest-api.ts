/**
 * REST API Endpoints — External Integration Layer
 * 
 * Sprint Q85: Typed API functions for external consumers.
 * 
 * These wrap Supabase calls into clean, typed endpoints that can be
 * consumed by external tools (Make.com, GlideApps, webhooks).
 * 
 * In production, these would be Supabase Edge Functions.
 * For now, they're client-side functions that can be extracted.
 */

import { supabase } from './supabase'
import { queryChain, getChainHead, getChainStats } from './chain-engine'
import { parseContribution } from './contribution-parser'
import type { ChainEntry } from '../types/chain'

// ─── Response Types ──────────────────────────────────────────────────

export interface ApiResponse<T> {
  ok: boolean
  data?: T
  error?: string
  meta?: {
    count?: number
    page?: number
    convergenceId?: string
  }
}

// ─── Chain Read API ──────────────────────────────────────────────────

/**
 * GET /api/chain/:convergenceId
 * Read chain entries with optional filters.
 */
export async function apiChainRead(
  convergenceId: string,
  params?: {
    eventType?: string
    aggregateType?: string
    aggregateId?: string
    fromIndex?: number
    limit?: number
  }
): Promise<ApiResponse<ChainEntry[]>> {
  try {
    const entries = await queryChain({
      convergenceId,
      eventType: params?.eventType,
      aggregateType: params?.aggregateType,
      aggregateId: params?.aggregateId,
      fromIndex: params?.fromIndex,
      limit: params?.limit || 50,
    })
    return { ok: true, data: entries, meta: { count: entries.length, convergenceId } }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

/**
 * GET /api/chain/:convergenceId/head
 * Get the latest chain entry (head).
 */
export async function apiChainHead(
  convergenceId: string
): Promise<ApiResponse<ChainEntry>> {
  try {
    const head = await getChainHead(convergenceId)
    if (!head) return { ok: false, error: 'No chain entries' }
    return { ok: true, data: head }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

/**
 * GET /api/chain/:convergenceId/stats
 * Chain statistics.
 */
export async function apiChainStats(convergenceId: string) {
  try {
    const stats = await getChainStats(convergenceId)
    return { ok: true, data: stats }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

// ─── Contribution API ────────────────────────────────────────────────

/**
 * POST /api/contributions/parse
 * Parse a natural language contribution description.
 */
export async function apiContributionParse(
  nlInput: string
): Promise<ApiResponse<ReturnType<typeof parseContribution>>> {
  try {
    const parsed = parseContribution(nlInput)
    return { ok: true, data: parsed }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

/**
 * POST /api/contributions/submit
 * Submit a contribution for review.
 */
export async function apiContributionSubmit(params: {
  convergenceId: string
  participantId: string
  description: string
  category?: string
  nlSource?: string
}): Promise<ApiResponse<{ id: string }>> {
  try {
    const { data, error } = await supabase
      .from('contributions')
      .insert({
        convergence_id: params.convergenceId,
        participant_id: params.participantId,
        description: params.description,
        category: params.category || 'uncategorized',
        nl_source: params.nlSource,
        current_state: 'submitted',
      })
      .select('id')
      .single()

    if (error) throw error
    return { ok: true, data: { id: data.id } }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

// ─── Member API ──────────────────────────────────────────────────────

/**
 * GET /api/members/:convergenceId
 * List members of a convergence.
 */
export async function apiMemberList(
  convergenceId: string
): Promise<ApiResponse<Array<{ id: string; name: string; affiliation?: string }>>> {
  try {
    const { data, error } = await supabase
      .from('convergence_participants')
      .select('participant_id, participants(id, name, affiliation)')
      .eq('convergence_id', convergenceId)

    if (error) throw error

    const members = (data || []).map((cp: any) => ({
      id: cp.participants?.id,
      name: cp.participants?.name,
      affiliation: cp.participants?.affiliation,
    })).filter((m: any) => m.id)

    return { ok: true, data: members, meta: { count: members.length, convergenceId } }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

/**
 * GET /api/members/:convergenceId/:memberId
 * Get a specific member.
 */
export async function apiMemberGet(
  memberId: string
): Promise<ApiResponse<{ id: string; name: string; affiliation?: string; bio?: string }>> {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('id, name, affiliation, bio')
      .eq('id', memberId)
      .single()

    if (error) throw error
    return { ok: true, data }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}
