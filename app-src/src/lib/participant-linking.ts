/**
 * Cross-Convergence Participant Linking
 * 
 * Sprint Q46: Links participants across convergences (e.g., ETHBoulder ↔ Techne).
 * 
 * A participant may appear in multiple convergences. This module provides:
 * - Lookup by auth_user_id across convergences
 * - Lookup by name/email fuzzy match
 * - Cross-convergence contribution aggregation
 * - Participant profile merging for display
 * 
 * The canonical link is auth_user_id (if the participant is authenticated).
 * Fuzzy matching on name is a fallback for unlinked participants.
 */

import { supabase } from './supabase'

// ─── Types ───────────────────────────────────────────────────────────

export interface ParticipantProfile {
  id: string
  name: string
  affiliation?: string
  bio?: string
  interests: string[]
  auth_user_id?: string
  convergence_id?: string
  created_at: string
}

export interface LinkedParticipant {
  /** Canonical participant (primary convergence) */
  primary: ParticipantProfile
  /** All linked profiles across convergences */
  profiles: ParticipantProfile[]
  /** Convergence IDs where this participant appears */
  convergenceIds: string[]
  /** Total contributions across all convergences */
  totalContributions: number
  /** Link method */
  linkMethod: 'auth_user_id' | 'name_match' | 'manual'
}

export interface CrossConvergenceStats {
  participantId: string
  convergenceId: string
  convergenceName: string
  contributionCount: number
  artifactCount: number
  firstSeen: string
  lastActive: string
}

// ─── Linking Functions ───────────────────────────────────────────────

/**
 * Find all profiles linked to a participant by auth_user_id.
 * This is the strongest link — same authenticated user across convergences.
 */
export async function findLinkedByAuth(
  authUserId: string
): Promise<ParticipantProfile[]> {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('auth_user_id', authUserId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Link lookup failed: ${error.message}`)
  return (data || []) as ParticipantProfile[]
}

/**
 * Find potential matches by name (fuzzy).
 * Returns candidates that should be confirmed before linking.
 */
export async function findLinkedByName(
  name: string,
  excludeParticipantId?: string
): Promise<ParticipantProfile[]> {
  // Normalize: lowercase, trim, remove extra spaces
  const normalized = name.toLowerCase().trim().replace(/\s+/g, ' ')

  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .ilike('name', `%${normalized}%`)

  if (error) throw new Error(`Name search failed: ${error.message}`)

  return (data || [])
    .filter(p => p.id !== excludeParticipantId)
    .map(p => p as ParticipantProfile)
}

/**
 * Build a linked participant view from a participant ID.
 * Attempts auth_user_id link first, then name match.
 */
export async function buildLinkedParticipant(
  participantId: string
): Promise<LinkedParticipant> {
  // Get the source participant
  const { data: source, error } = await supabase
    .from('participants')
    .select('*')
    .eq('id', participantId)
    .single()

  if (error || !source) {
    throw new Error(`Participant not found: ${participantId}`)
  }

  let profiles: ParticipantProfile[] = [source as ParticipantProfile]
  let linkMethod: LinkedParticipant['linkMethod'] = 'auth_user_id'

  // Try auth_user_id link
  if (source.auth_user_id) {
    const linked = await findLinkedByAuth(source.auth_user_id)
    if (linked.length > 1) {
      profiles = linked
    }
  }

  // If no auth link found, try name match
  if (profiles.length === 1 && source.name) {
    const nameMatches = await findLinkedByName(source.name, participantId)
    if (nameMatches.length > 0) {
      profiles = [source as ParticipantProfile, ...nameMatches]
      linkMethod = 'name_match'
    }
  }

  // Get contribution counts across all linked profiles
  const allIds = profiles.map(p => p.id)
  const { count } = await supabase
    .from('contributions')
    .select('id', { count: 'exact', head: true })
    .in('participant_id', allIds)

  // Extract convergence IDs
  const convergenceIds = [...new Set(
    profiles.map(p => p.convergence_id).filter(Boolean) as string[]
  )]

  return {
    primary: source as ParticipantProfile,
    profiles,
    convergenceIds,
    totalContributions: count || 0,
    linkMethod,
  }
}

/**
 * Get cross-convergence activity stats for a participant.
 */
export async function getCrossConvergenceStats(
  participantId: string
): Promise<CrossConvergenceStats[]> {
  const linked = await buildLinkedParticipant(participantId)
  const stats: CrossConvergenceStats[] = []

  for (const profile of linked.profiles) {
    if (!profile.convergence_id) continue

    // Get convergence name
    const { data: conv } = await supabase
      .from('convergences')
      .select('name')
      .eq('id', profile.convergence_id)
      .single()

    // Get contribution stats
    const { data: contributions } = await supabase
      .from('contributions')
      .select('id, created_at')
      .eq('participant_id', profile.id)
      .order('created_at', { ascending: true })

    // Get artifact count
    const { count: artifactCount } = await supabase
      .from('artifacts')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', profile.id)

    if (contributions && contributions.length > 0) {
      stats.push({
        participantId: profile.id,
        convergenceId: profile.convergence_id,
        convergenceName: conv?.name || 'Unknown',
        contributionCount: contributions.length,
        artifactCount: artifactCount || 0,
        firstSeen: contributions[0].created_at,
        lastActive: contributions[contributions.length - 1].created_at,
      })
    }
  }

  return stats
}
