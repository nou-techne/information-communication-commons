import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Calendar, MapPin, Users, ChevronLeft, ChevronRight } from 'lucide-react'

interface Session {
  id: string
  title: string
  description: string | null
  location: string | null
  time_start: string | null
  time_end: string | null
  track: string | null
  speakers: string[] | null
  session_type: string | null
  tags: string[] | null
}

const TRACK_COLORS: Record<string, string> = {
  'Privacy': '#6366f1',
  'Creativity': '#ec4899',
  'Public Goods Funding': '#22c55e',
  'Ethereum Localism': '#f59e0b',
  'd/acc': '#ef4444',
  'DeSci': '#06b6d4',
  'AI & Society': '#8b5cf6',
  'Onchain Organizations': '#14b8a6',
  'DAO Tooling': '#3b82f6',
  'Hackathon': '#f97316',
}

function formatTime(time: string) {
  const d = new Date(time)
  return d.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })
}

interface Props {
  compact?: boolean
  limit?: number
  trackFilter?: string
}

export function SessionsList({ compact = false, limit = 20, trackFilter }: Props) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState(trackFilter || '')
  const [tracks, setTracks] = useState<string[]>([])
  const PAGE_SIZE = compact ? 6 : limit

  useEffect(() => {
    loadSessions()
  }, [filter])

  async function loadSessions() {
    let q = supabase.from('sessions').select('*').order('time_start', { ascending: true, nullsFirst: false })
    if (filter) q = q.eq('track', filter)
    const { data } = await q
    setSessions(data || [])
    
    // Get unique tracks
    if (tracks.length === 0) {
      const { data: allSessions } = await supabase.from('sessions').select('track')
      const unique = [...new Set((allSessions || []).map(s => s.track).filter(Boolean))] as string[]
      setTracks(unique.sort())
    }
    setLoading(false)
  }

  if (loading) return <div className="text-gray-500 text-xs py-4 text-center">Loading sessions...</div>
  if (sessions.length === 0) return null

  const paged = sessions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(sessions.length / PAGE_SIZE)

  return (
    <div>
      {/* Track filter */}
      {!trackFilter && tracks.length > 0 && (
        <div className={`flex items-center gap-1.5 mb-2 flex-wrap ${compact ? '' : 'mb-3'}`}>
          <button
            onClick={() => { setFilter(''); setPage(0) }}
            className={`px-2 py-0.5 rounded text-xs transition-colors ${!filter ? 'bg-[#a6ed2a] text-[#080c16]' : 'bg-[#1d2839] text-gray-400 hover:text-white'}`}
          >
            All ({sessions.length})
          </button>
          {tracks.map(t => (
            <button
              key={t}
              onClick={() => { setFilter(t); setPage(0) }}
              className={`px-2 py-0.5 rounded text-xs transition-colors ${filter === t ? 'text-[#080c16] font-medium' : 'text-gray-400 hover:text-white'}`}
              style={filter === t ? { backgroundColor: TRACK_COLORS[t] || '#a6ed2a' } : { backgroundColor: '#1d2839' }}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Sessions list */}
      <div className={compact ? 'space-y-0.5' : 'space-y-1.5'}>
        {paged.map(s => (
          <Link
            key={s.id}
            to={`/session/${s.id}`}
            className={`block bg-[#0a101d] border border-[#1d2839] rounded hover:border-[#a6ed2a] transition-colors ${compact ? 'px-2 py-1.5' : 'rounded-lg px-3 py-2.5'}`}
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {s.track && (
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: TRACK_COLORS[s.track] || '#666' }}
                    />
                  )}
                  <h3 className={`font-medium text-white truncate ${compact ? 'text-[11px]' : 'text-sm'}`}>
                    {s.title}
                  </h3>
                </div>
                <div className={`flex items-center gap-2 flex-wrap ${compact ? 'text-[9px]' : 'text-xs'} text-gray-500`}>
                  {s.time_start && (
                    <span className="flex items-center gap-0.5">
                      <Calendar className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                      {formatTime(s.time_start)}
                    </span>
                  )}
                  {s.location && (
                    <span className="flex items-center gap-0.5">
                      <MapPin className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                      {s.location}
                    </span>
                  )}
                  {s.speakers && s.speakers.length > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Users className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                      {s.speakers.join(', ')}
                    </span>
                  )}
                </div>
              </div>
              {s.track && (
                <span
                  className={`flex-shrink-0 px-1.5 py-0.5 rounded ${compact ? 'text-[8px]' : 'text-[10px]'}`}
                  style={{ backgroundColor: (TRACK_COLORS[s.track] || '#666') + '20', color: TRACK_COLORS[s.track] || '#999' }}
                >
                  {s.track}
                </span>
              )}
            </div>
            {!compact && s.description && (
              <p className="text-xs text-gray-400 line-clamp-1 mt-1">{s.description}</p>
            )}
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-1 text-xs rounded bg-[#0a101d] border border-[#1d2839] text-gray-300 hover:border-[#a6ed2a] transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <span className={`${compact ? 'text-[9px]' : 'text-xs'} text-gray-500`}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sessions.length)} of {sessions.length} sessions
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-1 text-xs rounded bg-[#0a101d] border border-[#1d2839] text-gray-300 hover:border-[#a6ed2a] transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}
