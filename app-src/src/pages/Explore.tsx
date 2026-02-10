import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase, ARTIFACT_COLORS, STATE_LABELS } from '../lib/supabase'
import type { Artifact, ArtifactType, ArtifactState, Event } from '../lib/supabase'

const TYPES: ArtifactType[] = ['idea', 'proposal', 'commitment', 'pattern', 'synthesis', 'question', 'reflection']

const DIMENSIONS = [
  { key: 'e', letter: 'e/', name: 'Ecology', desc: 'Where We Are', color: '#4a8c6f', tag: 'hlamt:E' },
  { key: 'H', letter: 'H/', name: 'Human', desc: "Who's Here", color: '#c4956a', tag: 'hlamt:H' },
  { key: 'L', letter: 'L/', name: 'Language', desc: 'How We Talk', color: '#c3fd50', tag: 'hlamt:L' },
  { key: 'A', letter: 'A/', name: 'Artifacts', desc: "What We're Building", color: '#8bbfff', tag: 'hlamt:A' },
  { key: 'M', letter: 'M/', name: 'Methodology', desc: 'How We Work', color: '#7ccfb8', tag: 'hlamt:M' },
  { key: 'T', letter: 'T/', name: 'Training', desc: "What We're Learning", color: '#e8927c', tag: 'hlamt:T' },
]

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function Explore() {
  // Garden state
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ArtifactType | ''>('')
  const [stateFilter, setStateFilter] = useState<ArtifactState | ''>('')
  const [searchResults, setSearchResults] = useState<Artifact[] | null>(null)

  // Pulse state
  const [events, setEvents] = useState<Event[]>([])

  // Dimension counts
  const [dimCounts, setDimCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    loadData()

    // Real-time subscriptions
    const artifactSub = supabase.channel('explore-artifacts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'artifacts' }, payload => {
        setArtifacts(prev => [payload.new as Artifact, ...prev].slice(0, 50))
      })
      .subscribe()

    const eventSub = supabase.channel('explore-events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, payload => {
        setEvents(prev => [payload.new as Event, ...prev].slice(0, 30))
      })

      .subscribe()

    const commitmentSub = supabase.channel('explore-commitments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commitments' }, payload => {
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
        setEvents(prev => [e, ...prev].slice(0, 30))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(artifactSub)
      supabase.removeChannel(eventSub)
      supabase.removeChannel(commitmentSub)
    }
  }, [])

  useEffect(() => {
    loadArtifacts()
  }, [typeFilter, stateFilter])

  async function loadData() {
    const [{ data: arts }, { data: evts }, { data: tagData }] = await Promise.all([
      supabase.from('artifacts').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('events').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('tags').select('name, artifact_tags(count)').like('name', 'hlamt:%'),
    ])
    setArtifacts(arts || [])
    setEvents(evts || [])
    if (tagData) {
      const c: Record<string, number> = {}
      for (const tag of tagData) {
        const arr = tag.artifact_tags as unknown as { count: number }[]
        c[tag.name] = arr?.[0]?.count ?? 0
      }
      setDimCounts(c)
    }
    setLoading(false)
  }

  async function loadArtifacts() {
    let q = supabase.from('artifacts').select('*').order('created_at', { ascending: false }).limit(50)
    if (typeFilter) q = q.eq('type', typeFilter)
    if (stateFilter) q = q.eq('state', stateFilter)
    const { data } = await q
    setArtifacts(data || [])
    setSearchResults(null)
  }

  async function doSearch() {
    if (!search.trim()) { setSearchResults(null); return }
    const { data } = await supabase.rpc('search_artifacts', { p_query: search })
    setSearchResults(data || [])
  }

  const display = searchResults ?? artifacts

  if (loading) return <div className="text-center text-gray-500 py-12">Loading...</div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Explore</h1>
        <p className="text-gray-400 text-sm">The knowledge graph and live activity, side by side.</p>
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
        {DIMENSIONS.map(d => (
          <Link
            key={d.key}
            to={`/d/${d.key}`}
            className="block rounded-lg border border-[#262626] bg-[#1a1a1a] p-3 hover:border-[#c3fd50] transition-colors text-center group"
          >
            <div className="flex items-baseline justify-center gap-1.5">
              <span className="font-mono text-lg font-bold" style={{ color: d.color }}>{d.letter}</span>
              {(dimCounts[d.tag] ?? 0) > 0 && (
                <span className="text-xs text-gray-500">{dimCounts[d.tag]}</span>
              )}
            </div>
            <span className="text-xs text-gray-400 group-hover:text-white transition-colors">{d.desc}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Artifacts (Garden) */}
        <div className="lg:col-span-2">
          {/* Search + Filters */}
          <div className="mb-4">
            <div className="flex gap-2 mb-3">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
                placeholder="Search artifacts..."
                className="flex-1 bg-[#1a1a1a] border border-[#262626] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#c3fd50] text-sm"
              />
              <button onClick={doSearch} className="bg-[#c3fd50] text-[#0f0f0f] hover:bg-[#d4fe80] px-4 py-2 rounded-lg transition-colors text-sm">
                Search
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as ArtifactType | '')}
                className="bg-[#1a1a1a] border border-[#262626] rounded-lg px-3 py-1.5 text-xs text-white"
              >
                <option value="">All types</option>
                {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
              <select
                value={stateFilter}
                onChange={e => setStateFilter(e.target.value as ArtifactState | '')}
                className="bg-[#1a1a1a] border border-[#262626] rounded-lg px-3 py-1.5 text-xs text-white"
              >
                <option value="">All states</option>
                {Object.entries(STATE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              {(typeFilter || stateFilter || searchResults) && (
                <button onClick={() => { setTypeFilter(''); setStateFilter(''); setSearch(''); setSearchResults(null); }} className="text-xs text-gray-400 hover:text-white">
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Artifact Grid */}
          {display.length === 0 ? (
            <div className="text-center text-gray-500 py-12">No artifacts found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {display.map(a => (
                <Link
                  key={a.id}
                  to={`/artifact/${a.id}`}
                  className="block bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 hover:border-[#c3fd50] transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: ARTIFACT_COLORS[a.type] }}
                    />
                    <span className="text-xs uppercase tracking-wider text-gray-400">{a.type}</span>
                    <span className="ml-auto text-xs text-gray-500">{STATE_LABELS[a.state]}</span>
                  </div>
                  <h3 className="font-semibold text-white group-hover:text-[#c3fd50] transition-colors mb-1 text-sm">
                    {a.title}
                  </h3>
                  {a.summary && (
                    <p className="text-xs text-gray-400 line-clamp-2">{a.summary}</p>
                  )}
                  <div className="mt-2 text-xs text-gray-600">
                    {timeAgo(a.created_at)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: Activity Feed (Pulse) */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Live Activity</h2>
          {events.length === 0 ? (
            <div className="text-gray-500 text-center py-8 text-sm">No activity yet</div>
          ) : (
            <div className="space-y-1.5">
              {events.map(e => (
                <div key={e.id} className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-2.5">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c3fd50]" />
                    <span className="text-xs font-medium text-white capitalize">{e.type}</span>
                    <span className="text-xs text-gray-600 ml-auto">{timeAgo(e.created_at)}</span>
                  </div>
                  {e.data && (typeof e.data === 'object') && (
                    <p className="text-xs text-gray-400 truncate pl-3.5">
                      {(e.data as any).title || (e.data as any).description || (e.data as any).summary || ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
