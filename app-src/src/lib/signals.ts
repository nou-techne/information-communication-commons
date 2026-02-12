import { supabase } from './supabase'

/**
 * CS-04 + shared signal utilities for all views.
 */

/** Fetch signal summary from the aggregation view (CS-01) */
export async function fetchSignalSummary(): Promise<Record<string, { count: number; participants: number }>> {
  const { data } = await supabase.from('coordination_signal_summary').select('*')
  const map: Record<string, { count: number; participants: number }> = {}
  for (const row of (data || [])) {
    map[row.artifact_id] = { count: row.signal_count, participants: row.unique_participants }
  }
  return map
}

/** Fetch participant overlaps (CS-02) */
export async function fetchParticipantOverlaps(participantId: string) {
  const { data } = await supabase.rpc('get_participant_overlaps', { p_participant_id: participantId })
  return (data || []) as { other_participant_id: string; shared_signal_count: number; shared_artifact_ids: string[] }[]
}

/** Fetch tag signal density (CS-03) */
export async function fetchTagSignalDensity() {
  const { data } = await supabase.rpc('get_tag_signal_density')
  return (data || []) as { tag_name: string; artifact_count: number; total_signals: number; unique_signalers: number; density_ratio: number }[]
}

/** Subscribe to realtime signal changes (CS-04). Returns cleanup function. */
export function subscribeToSignals(
  onInsert: (payload: any) => void,
  onDelete?: (payload: any) => void,
) {
  const channel = supabase.channel('signal-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'coordination_interests' }, onInsert)
  if (onDelete) {
    channel.on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'coordination_interests' }, onDelete)
  }
  channel.subscribe()
  return () => { supabase.removeChannel(channel) }
}

/** Fetch most-signaled artifacts (CS-21 leaderboard) */
export async function fetchMostSignaled(limit = 5) {
  const { data } = await supabase
    .from('coordination_signal_summary')
    .select('artifact_id, signal_count, unique_participants')
    .order('signal_count', { ascending: false })
    .limit(limit)
  if (!data || data.length === 0) return []
  
  const ids = data.map((d: any) => d.artifact_id)
  const { data: arts } = await supabase
    .from('artifacts')
    .select('id, title, type')
    .in('id', ids)
  
  return data.map((d: any) => {
    const art = (arts || []).find((a: any) => a.id === d.artifact_id)
    return { ...d, title: art?.title || 'Unknown', type: art?.type || 'idea' }
  })
}
