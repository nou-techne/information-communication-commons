import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase, ARTIFACT_COLORS } from '../lib/supabase'
import type { Event } from '../lib/supabase'

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const EVENT_ICONS: Record<string, string> = {
  created: '🌱', evolved: '🔄', connected: '🔗', observed: '👁️',
  committed: '🤝', extracted: '⚡', synthesized: '✨',
}

export function Pulse() {
  const [events, setEvents] = useState<Event[]>([])
  const [recentArtifacts, setRecentArtifacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvents()

    // Real-time subscriptions
    const artifactSub = supabase.channel('pulse-artifacts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'artifacts' }, payload => {
        setRecentArtifacts(prev => [payload.new, ...prev].slice(0, 20))
      })
      .subscribe()

    const eventSub = supabase.channel('pulse-events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, payload => {
        setEvents(prev => [payload.new as Event, ...prev].slice(0, 50))
      })
      .subscribe()

    const commitmentSub = supabase.channel('pulse-commitments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commitments' }, payload => {
        // Add as a pseudo-event
        const e: Event = {
          id: crypto.randomUUID(),
          type: 'committed',
          entity_type: 'commitment',
          entity_id: (payload.new as any).id,
          actor_type: 'human',
          actor_id: (payload.new as any).participant_id,
          data: { description: (payload.new as any).description },
          convergence_id: null,
          created_at: new Date().toISOString(),
        }
        setEvents(prev => [e, ...prev].slice(0, 50))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(artifactSub)
      supabase.removeChannel(eventSub)
      supabase.removeChannel(commitmentSub)
    }
  }, [])

  async function loadEvents() {
    const [{ data: evts }, { data: arts }] = await Promise.all([
      supabase.from('events').select('*').order('created_at', { ascending: false }).limit(30),
      supabase.from('artifacts').select('*').order('created_at', { ascending: false }).limit(10),
    ])
    setEvents(evts || [])
    setRecentArtifacts(arts || [])
    setLoading(false)
  }

  if (loading) return <div className="text-center text-gray-500 py-12">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">⚡ Live Pulse</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Feed */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-300 mb-3">Activity Feed</h2>
          {events.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No activity yet — the commons awaits.</div>
          ) : (
            <div className="space-y-2">
              {events.map(e => (
                <div key={e.id} className="bg-[#111d33] border border-[#1a2a44] rounded-lg p-3 flex items-start gap-3">
                  <span className="text-lg">{EVENT_ICONS[e.type] || '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white capitalize">{e.type}</span>
                      <span className="text-xs text-gray-500">{e.entity_type}</span>
                      {e.actor_type === 'agent' && <span className="text-xs bg-[#1a2a44] text-gray-400 px-1.5 py-0.5 rounded">🤖</span>}
                    </div>
                    {e.data && (typeof e.data === 'object') && (
                      <p className="text-sm text-gray-400 truncate mt-0.5">
                        {(e.data as any).title || (e.data as any).description || (e.data as any).summary || JSON.stringify(e.data).slice(0, 100)}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 whitespace-nowrap">{timeAgo(e.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Artifacts Sidebar */}
        <div>
          <h2 className="text-lg font-semibold text-gray-300 mb-3">Recent Artifacts</h2>
          <div className="space-y-2">
            {recentArtifacts.map((a: any) => (
              <Link key={a.id} to={`/artifact/${a.id}`} className="block bg-[#111d33] border border-[#1a2a44] rounded-lg p-3 hover:border-[#5b9de4] transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ARTIFACT_COLORS[a.type as keyof typeof ARTIFACT_COLORS] || '#5b9de4' }} />
                  <span className="text-xs text-gray-500 uppercase">{a.type}</span>
                </div>
                <div className="text-sm font-medium text-white truncate">{a.title}</div>
                <div className="text-xs text-gray-600 mt-1">{timeAgo(a.created_at)}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
