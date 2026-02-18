/**
 * Ecosystem Interop — Cross-Platform Integration
 * 
 * Sprint Q77: Bridges between commons.id and external platforms.
 * - Bonfires.ai → contribution suggestions
 * - ETHBoulder → member activity feed
 * - External revenue webhooks for ventures
 */

import { supabase } from './supabase'
import type { ChainEntry } from '../types/chain'

// ─── Bonfires.ai Integration ─────────────────────────────────────────

export interface BonfiresEpisode {
  id: string
  title: string
  description: string
  participants: string[]
  publishedAt: string
  duration: number
  url: string
}

/**
 * Convert a Bonfires.ai episode into a contribution suggestion.
 * Members who participated in an episode can claim it as a contribution.
 */
export function episodeToContributionSuggestion(episode: BonfiresEpisode): {
  nlInput: string
  sourceUrl: string
  suggestedCategory: string
  suggestedEffort: string
} {
  const durationHours = (episode.duration / 3600).toFixed(1)
  return {
    nlInput: `Participated in Bonfires.ai episode: "${episode.title}". ${episode.description.slice(0, 200)}. Duration: ${durationHours}h. Participants: ${episode.participants.join(', ')}.`,
    sourceUrl: episode.url,
    suggestedCategory: 'community',
    suggestedEffort: episode.duration > 3600 ? 'medium' : 'low',
  }
}

// ─── ETHBoulder Integration ──────────────────────────────────────────

export interface ETHBoulderSession {
  id: string
  title: string
  speaker: string
  track: string
  startTime: string
  endTime: string
}

/**
 * Pull ETHBoulder session participation into member activity feed.
 */
export async function getETHBoulderActivity(
  participantName: string
): Promise<ETHBoulderSession[]> {
  const { data } = await supabase
    .from('sessions')
    .select('id, title, speaker, track, time_start, time_end')
    .or(`speaker.ilike.%${participantName}%`)
    .order('time_start', { ascending: false })

  return (data || []).map(s => ({
    id: s.id,
    title: s.title,
    speaker: s.speaker,
    track: s.track || '',
    startTime: s.time_start,
    endTime: s.time_end,
  }))
}

// ─── Revenue Webhook Handler ─────────────────────────────────────────

export interface RevenueWebhookPayload {
  source: string        // 'stripe', 'manual', 'crypto'
  ventureId: string
  amount: number
  currency: string
  externalRef: string
  description: string
  timestamp: string
  metadata?: Record<string, unknown>
}

/**
 * Validate and normalize an incoming revenue webhook.
 * Returns normalized payload ready for importRevenue().
 */
export function validateRevenueWebhook(
  raw: unknown
): { valid: boolean; payload?: RevenueWebhookPayload; error?: string } {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: 'Payload must be an object' }
  }

  const data = raw as Record<string, unknown>
  const required = ['source', 'ventureId', 'amount', 'currency', 'externalRef']
  for (const field of required) {
    if (!data[field]) {
      return { valid: false, error: `Missing required field: ${field}` }
    }
  }

  if (typeof data.amount !== 'number' || data.amount <= 0) {
    return { valid: false, error: 'Amount must be a positive number' }
  }

  return {
    valid: true,
    payload: {
      source: data.source as string,
      ventureId: data.ventureId as string,
      amount: data.amount as number,
      currency: (data.currency as string) || 'USD',
      externalRef: data.externalRef as string,
      description: (data.description as string) || '',
      timestamp: (data.timestamp as string) || new Date().toISOString(),
      metadata: data.metadata as Record<string, unknown>,
    },
  }
}

/**
 * Convert USD amount to other currency equivalents.
 * Simple fixed-rate conversion for display (not for accounting).
 */
export function currencyNormalize(
  amount: number,
  currency: string
): number {
  const rates: Record<string, number> = {
    USD: 1,
    USDC: 1,
    USDT: 1,
    DAI: 1,
    ETH: 2500,   // approximate, would use oracle in production
    EUR: 1.08,
    GBP: 1.26,
  }
  const rate = rates[currency.toUpperCase()] || 1
  return amount * rate
}
