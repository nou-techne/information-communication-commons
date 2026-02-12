import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Handshake, Users, Flame } from 'lucide-react'

interface Hotspot {
  artifact_id: string
  title: string
  type: string
  rea_role: string
  summary: string
  interest_count: number
  interested_participants: string[]
}

interface Match {
  participant_a: string
  participant_b: string
  shared_interest: string
  artifact_id: string
}

const REA_COLORS: Record<string, string> = {
  resource: 'text-green-400',
  event: 'text-amber-400',
  agent: 'text-blue-400',
}

export function Coordinate() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'hotspots' | 'matches'>('hotspots')

  useEffect(() => {
    async function load() {
      const [hotspotsRes, matchesRes] = await Promise.all([
        supabase.from('coordination_hotspots').select('*').limit(20),
        supabase.from('coordination_matches').select('*').limit(50),
      ])
      setHotspots(hotspotsRes.data || [])
      setMatches(matchesRes.data || [])
      setLoading(false)
    }
    load()

    // Real-time subscription
    const channel = supabase.channel('coordination')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'coordination_interests'
      }, () => load())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <Handshake className="w-12 h-12 text-gray-500 mx-auto mb-4 animate-pulse" />
        <p className="text-gray-400">Loading coordination signals...</p>
      </div>
    )
  }

  const empty = hotspots.length === 0 && matches.length === 0

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Coordination</h1>
        <p className="text-gray-400 text-sm">
          See what the community wants to coordinate around. Click the handshake icon on any artifact to signal your interest.
        </p>
      </div>

      {empty ? (
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-8 text-center">
          <Handshake className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-2">No coordination signals yet</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-4">
            Browse the Explore page and click the handshake icon on artifacts you want to coordinate around. When multiple participants signal interest in the same artifact, matches appear here.
          </p>
          <Link to="/" className="inline-block px-6 py-2 bg-[#c3fd50] text-[#0f0f0f] rounded-lg hover:bg-[#d4fe80] text-sm">
            Explore artifacts
          </Link>
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setView('hotspots')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                view === 'hotspots' ? 'bg-[#c3fd50] text-[#0f0f0f]' : 'bg-[#262626] text-gray-300 hover:bg-[#333]'
              }`}
            >
              <Flame className="w-4 h-4" />
              Hotspots ({hotspots.length})
            </button>
            <button
              onClick={() => setView('matches')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                view === 'matches' ? 'bg-[#c3fd50] text-[#0f0f0f]' : 'bg-[#262626] text-gray-300 hover:bg-[#333]'
              }`}
            >
              <Users className="w-4 h-4" />
              Matches ({matches.length})
            </button>
          </div>

          {view === 'hotspots' && (
            <div className="space-y-3">
              {hotspots.map(h => (
                <Link
                  key={h.artifact_id}
                  to={`/artifact/${h.artifact_id}`}
                  className="block bg-[#1a1a1a] border border-[#262626] rounded-lg p-4 hover:border-[#c3fd50]/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs ${REA_COLORS[h.rea_role] || 'text-gray-400'}`}>{h.rea_role.charAt(0).toUpperCase() + h.rea_role.slice(1)}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#262626] text-gray-400">{h.type.charAt(0).toUpperCase() + h.type.slice(1)}</span>
                      </div>
                      <h3 className="font-medium text-sm mb-1">{h.title}</h3>
                      {h.summary && <p className="text-xs text-gray-500 line-clamp-2">{h.summary}</p>}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {h.interested_participants.map((name, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[#c3fd50]/10 text-[#c3fd50]">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[#c3fd50]">
                      <Handshake className="w-4 h-4" />
                      <span className="text-lg font-bold">{h.interest_count}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {view === 'matches' && (
            <div className="space-y-3">
              {matches.map((m, i) => (
                <div key={i} className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-[#c3fd50]">{m.participant_a}</span>
                    <Handshake className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-[#c3fd50]">{m.participant_b}</span>
                  </div>
                  <Link
                    to={`/artifact/${m.artifact_id}`}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Shared interest: {m.shared_interest}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
