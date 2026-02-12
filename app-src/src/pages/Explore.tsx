import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { supabase, ARTIFACT_COLORS, STATE_LABELS, REA_COLORS, REA_LABELS, AGENT_TYPE_COLORS, AGENT_TYPE_LABELS } from '../lib/supabase'
import type { Artifact, ArtifactType, ArtifactState } from '../lib/supabase'
import { Info, ChevronDown, ChevronLeft, ChevronRight, Inbox, PenLine, Sparkles, GitBranch, Handshake } from 'lucide-react'
import { ExtractionProgress } from '../components/ExtractionProgress'
import { useConvergence } from '../contexts/ConvergenceContext'

const Graph = lazy(() => import('./Graph').then(m => ({ default: m.Graph })))

interface ContributionFeedItem {
  id: string
  content: string
  title: string | null
  status: string
  participant_id: string | null
  participant_name: string | null
  created_at: string
  processed_at: string | null
  edge_count: number
  artifact_count: number
  relationship_count: number
  commitment_count: number
  preview: string
}

const TYPES: ArtifactType[] = ['idea', 'proposal', 'commitment', 'pattern', 'synthesis', 'question', 'reflection']

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function Explore() {
  const { convergence } = useConvergence()
  const DIMENSIONS = convergence.dimensions

  // Garden state
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dimFilter, setDimFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<ArtifactType | ''>('')
  const [stateFilter, setStateFilter] = useState<ArtifactState | ''>('')
  const [sortBy, setSortBy] = useState<'recent' | 'coordination'>('coordination')
  const [coordCounts, setCoordCounts] = useState<Record<string, number>>({})
  const [searchResults, setSearchResults] = useState<Artifact[] | null>(null)

  // View mode
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const graphContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  // Pulse state
  const [feedItems, setFeedItems] = useState<ContributionFeedItem[]>([])

  // Dimension counts
  const [dimCounts, setDimCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    loadData()

    // Real-time subscriptions
    const artifactSub = supabase.channel('explore-artifacts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'artifacts' }, payload => {
        setArtifacts(prev => [payload.new as Artifact, ...prev].slice(0, 50))
        // Refresh dimension counts when new artifacts arrive
        refreshDimCounts()
      })
      .subscribe()

    const contributionSub = supabase.channel('explore-contributions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, () => {
        // Reload feed on any contribution change (insert or update when processed)
        loadFeed()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(artifactSub)
      supabase.removeChannel(contributionSub)
    }
  }, [])

  useEffect(() => {
    loadArtifacts()
  }, [dimFilter, typeFilter, stateFilter, sortBy])

  async function refreshDimCounts() {
    const [{ data: tagData }, { count: participantCount }, { data: wordData }] = await Promise.all([
      supabase.from('tags').select('name, artifact_tags(count)').like('name', 'hlamt:%'),
      supabase.from('participants').select('*', { count: 'exact', head: true }),
      supabase.rpc('word_frequencies'),
    ])
    const c: Record<string, number> = {}
    if (tagData) {
      for (const tag of tagData) {
        const arr = tag.artifact_tags as unknown as { count: number }[]
        c[tag.name] = arr?.[0]?.count ?? 0
      }
    }
    // H/ counts participants, not artifacts
    c['hlamt:H'] = participantCount ?? 0
    // L/ counts total unique words from word frequency analysis
    if (wordData) {
      c['hlamt:L'] = wordData.length
    }
    setDimCounts(c)
  }

  async function loadFeed() {
    const { data: feed } = await supabase
      .from('contribution_feed')
      .select('*')
      .limit(30)
    setFeedItems((feed as ContributionFeedItem[]) || [])
  }

  async function refreshCoordCounts() {
    const { data } = await supabase
      .from('coordination_interests')
      .select('artifact_id')
    const counts: Record<string, number> = {}
    if (data) {
      for (const row of data) {
        counts[row.artifact_id] = (counts[row.artifact_id] || 0) + 1
      }
    }
    setCoordCounts(counts)
    return counts
  }

  async function loadData() {
    const [{ data: arts }] = await Promise.all([
      supabase.from('artifacts').select('*').order('created_at', { ascending: false }).limit(50),
    ])
    setArtifacts(arts || [])
    await Promise.all([loadFeed(), refreshDimCounts(), refreshCoordCounts()])
    setLoading(false)
  }

  async function loadArtifacts() {
    if (dimFilter) {
      // Filter by dimension: get artifact IDs tagged with this dimension
      const { data: tagData } = await supabase
        .from('tags')
        .select('id')
        .eq('name', dimFilter)
        .single()

      if (tagData) {
        const { data: taggedIds } = await supabase
          .from('artifact_tags')
          .select('artifact_id')
          .eq('tag_id', tagData.id)

        if (taggedIds && taggedIds.length > 0) {
          const ids = taggedIds.map(t => t.artifact_id)
          let q = supabase.from('artifacts').select('*').in('id', ids).order('created_at', { ascending: false }).limit(50)
          if (typeFilter) q = q.eq('type', typeFilter)
          if (stateFilter) q = q.eq('state', stateFilter)
          const { data } = await q
          setArtifacts(data || [])
        } else {
          setArtifacts([])
        }
      } else {
        setArtifacts([])
      }
    } else {
      let q = supabase.from('artifacts').select('*').order('created_at', { ascending: false }).limit(50)
      if (typeFilter) q = q.eq('type', typeFilter)
      if (stateFilter) q = q.eq('state', stateFilter)
      const { data } = await q
      setArtifacts(data || [])
    }
    setSearchResults(null)
  }

  async function doSearch() {
    if (!search.trim()) { setSearchResults(null); return }
    const { data } = await supabase.rpc('search_artifacts', { p_query: search })
    setSearchResults(data || [])
  }

  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [graphPage, setGraphPage] = useState(0)
  const GRAPH_PAGE_SIZE = 10

  const sorted = sortBy === 'coordination'
    ? [...artifacts].sort((a, b) => (coordCounts[b.id] || 0) - (coordCounts[a.id] || 0))
    : artifacts
  const display = searchResults ?? sorted

  if (loading) return <div className="text-center text-gray-500 py-12">Loading...</div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Explore</h1>
        <p className="text-gray-400 text-sm">The knowledge graph and live activity, side by side.</p>
      </div>

      {/* How it works */}
      <div className="mb-6 bg-[#0a101d] border border-[#1d2839] rounded-lg overflow-hidden">
        <button
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#1d2839] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-[#a6ed2a]" />
            <span className="text-sm font-medium text-white">How it works</span>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showHowItWorks ? 'rotate-180' : ''}`} />
        </button>
        
        {showHowItWorks && (
          <div className="px-4 pb-4 text-sm space-y-3 border-t border-[#1d2839] pt-4">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#a6ed2a] text-[#080c16] flex items-center justify-center">
                <PenLine className="w-4 h-4" />
              </span>
              <div>
                <div className="text-white font-medium mb-1">Contribute observations</div>
                <div className="text-gray-400">Share what you noticed at ETHBoulder — session notes, ideas, commitments, questions. Write naturally.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#a6ed2a] text-[#080c16] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <div className="text-white font-medium mb-1">AI extracts knowledge</div>
                <div className="text-gray-400">Each contribution is analyzed, broken into artifacts (resources, events, agents), and tagged by dimension.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#a6ed2a] text-[#080c16] flex items-center justify-center">
                <GitBranch className="w-4 h-4" />
              </span>
              <div>
                <div className="text-white font-medium mb-1">The graph grows</div>
                <div className="text-gray-400">Artifacts connect to each other. Patterns emerge. The collective knowledge becomes navigable by dimension, type, and relationship.</div>
              </div>
            </div>
            <div className="pt-2 border-t border-[#1d2839]">
              <Link to="/contribute" className="text-[#a6ed2a] hover:text-white text-sm font-medium">
                Try it yourself →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Dimensions */}
      <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Graph Dimensions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-6">
        {DIMENSIONS.map(d => {
          const count = dimCounts[d.tag] ?? 0
          return (
            <Link
              key={d.key}
              to={`/d/${d.key}`}
              className="block rounded-lg border border-[#1d2839] bg-[#0a101d] p-3 sm:p-4 hover:border-[#a6ed2a] transition-colors text-center group"
            >
              <div className="text-xs font-medium mb-1 truncate" style={{ color: d.color }}>{d.name}</div>
              <div className="flex items-baseline justify-center gap-1 sm:gap-1.5">
                <span className="font-mono text-xl sm:text-2xl font-bold" style={{ color: d.color }}>{d.letter}</span>
                <span className="text-xl sm:text-2xl font-bold text-white">{count}</span>
              </div>
              <span className="text-xs text-gray-400 group-hover:text-white transition-colors block truncate">{d.desc}</span>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Graph Index / 3D Graph */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              {viewMode === '3d' ? 'Graph Constellation' : 'Graph Index'}
            </h2>
            <div className="flex bg-[#0a101d] border border-[#1d2839] rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('2d')}
                className={`px-4 py-2 text-sm font-semibold transition-colors ${
                  viewMode === '2d' ? 'bg-[#a6ed2a] text-[#080c16]' : 'text-gray-400 hover:text-white'
                }`}
              >
                2-D
              </button>
              <button
                onClick={() => setViewMode('3d')}
                className={`px-4 py-2 text-sm font-semibold transition-colors ${
                  viewMode === '3d' ? 'bg-[#a6ed2a] text-[#080c16]' : 'text-gray-400 hover:text-white'
                }`}
              >
                3-D
              </button>
            </div>
          </div>
          {viewMode === '3d' ? (
            <div ref={graphContainerRef} className={`relative ${isFullscreen ? 'bg-[#080c16] w-screen h-screen' : ''}`}>
              <Suspense fallback={<div className="flex items-center justify-center h-96"><div className="text-gray-500">Loading constellation...</div></div>}>
                <div className={`relative w-full overflow-hidden ${isFullscreen ? 'h-full' : 'h-[600px]'}`}>
                  <Graph />
                  <button
                    onClick={() => {
                      if (isFullscreen) {
                        document.exitFullscreen()
                      } else {
                        graphContainerRef.current?.requestFullscreen()
                      }
                    }}
                    className="absolute top-3 left-3 z-50 px-3 py-1.5 text-xs bg-[#1d2839]/90 text-gray-300 rounded-lg hover:bg-[#333] transition-colors backdrop-blur-sm border border-[#333]"
                  >
                    {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  </button>
                </div>
              </Suspense>
            </div>
          ) : (<>
          {/* Search + Filters */}
          <div className="mb-4">
            <div className="flex gap-2 mb-3">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
                placeholder="Search the graph..."
                className="flex-1 bg-[#0a101d] border border-[#1d2839] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#a6ed2a] text-sm"
              />
              <button onClick={doSearch} className="bg-[#a6ed2a] text-[#080c16] hover:bg-[#b8f247] px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm whitespace-nowrap">
                Search
              </button>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <select
                value={dimFilter}
                onChange={e => { setDimFilter(e.target.value); setGraphPage(0); }}
                className="bg-[#0a101d] border border-[#1d2839] rounded-lg px-3 py-1.5 text-xs text-white flex-shrink-0"
              >
                <option value="">All dimensions</option>
                {DIMENSIONS.map(d => <option key={d.key} value={d.tag}>{d.letter} {d.name}</option>)}
              </select>
              <select
                value={typeFilter}
                onChange={e => { setTypeFilter(e.target.value as ArtifactType | ''); setGraphPage(0); }}
                className="bg-[#0a101d] border border-[#1d2839] rounded-lg px-3 py-1.5 text-xs text-white flex-shrink-0"
              >
                <option value="">All types</option>
                {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
              <select
                value={stateFilter}
                onChange={e => { setStateFilter(e.target.value as ArtifactState | ''); setGraphPage(0); }}
                className="bg-[#0a101d] border border-[#1d2839] rounded-lg px-3 py-1.5 text-xs text-white flex-shrink-0"
              >
                <option value="">All states</option>
                {Object.entries(STATE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'recent' | 'coordination')}
                className="bg-[#0a101d] border border-[#1d2839] rounded-lg px-3 py-1.5 text-xs text-white flex-shrink-0"
              >
                <option value="recent">Sort: Recent</option>
                <option value="coordination">Sort: Coordination</option>
              </select>
              {(dimFilter || typeFilter || stateFilter || searchResults) && (
                <button onClick={() => { setDimFilter(''); setTypeFilter(''); setStateFilter(''); setSearch(''); setSearchResults(null); setSortBy('recent'); setGraphPage(0); }} className="text-xs text-gray-400 hover:text-white flex-shrink-0">
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Artifact Grid */}
          {display.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 rounded-full bg-[#1d2839] flex items-center justify-center mx-auto mb-6">
                  <Inbox className="w-10 h-10 text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {searchResults ? 'No matching artifacts' : 'The knowledge graph is empty'}
                </h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  {searchResults 
                    ? 'Try a different search term or clear your filters.'
                    : 'Be the first to contribute. Share an observation, idea, or commitment from ETHBoulder and watch it become part of the living archive.'}
                </p>
                <Link
                  to="/contribute"
                  className="inline-block bg-[#a6ed2a] text-[#080c16] font-medium px-6 py-3 rounded-lg hover:bg-[#b8f247] transition-colors"
                >
                  Contribute to the Commons
                </Link>
              </div>
            </div>
          ) : (<>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {display.slice(graphPage * GRAPH_PAGE_SIZE, (graphPage + 1) * GRAPH_PAGE_SIZE).map(a => (
                <Link
                  key={a.id}
                  to={`/artifact/${a.id}`}
                  className="block bg-[#0a101d] border border-[#1d2839] rounded-xl p-4 hover:border-[#a6ed2a] transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: ARTIFACT_COLORS[a.type] }}
                    />
                    <span className="text-xs uppercase tracking-wider text-gray-400">{a.type}</span>
                    {a.rea_role && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded border"
                        style={{ color: REA_COLORS[a.rea_role], borderColor: REA_COLORS[a.rea_role] + '40' }}
                      >
                        {REA_LABELS[a.rea_role]}
                      </span>
                    )}
                    {a.agent_type && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded border"
                        style={{ color: AGENT_TYPE_COLORS[a.agent_type], borderColor: AGENT_TYPE_COLORS[a.agent_type] + '40' }}
                      >
                        {AGENT_TYPE_LABELS[a.agent_type]}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-gray-500">{STATE_LABELS[a.state]}</span>
                  </div>
                  <h3 className="font-semibold text-white group-hover:text-[#a6ed2a] transition-colors mb-1 text-sm">
                    {a.title}
                  </h3>
                  {a.summary && (
                    <p className="text-xs text-gray-400 line-clamp-2">{a.summary}</p>
                  )}
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                    <span>{timeAgo(a.created_at)}</span>
                    {(coordCounts[a.id] || 0) > 0 && (
                      <span className="flex items-center gap-1 text-[#a6ed2a]">
                        <Handshake className="w-3 h-3" />
                        {coordCounts[a.id]}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            {/* Pagination */}
            {display.length > GRAPH_PAGE_SIZE && (
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => setGraphPage(p => Math.max(0, p - 1))}
                  disabled={graphPage === 0}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-[#0a101d] border border-[#1d2839] text-gray-300 hover:border-[#a6ed2a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="text-xs text-gray-500">
                  {graphPage * GRAPH_PAGE_SIZE + 1}–{Math.min((graphPage + 1) * GRAPH_PAGE_SIZE, display.length)} of {display.length}
                </span>
                <button
                  onClick={() => setGraphPage(p => Math.min(Math.ceil(display.length / GRAPH_PAGE_SIZE) - 1, p + 1))}
                  disabled={(graphPage + 1) * GRAPH_PAGE_SIZE >= display.length}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-[#0a101d] border border-[#1d2839] text-gray-300 hover:border-[#a6ed2a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>)}
          </>)}
        </div>

        {/* Right: Contribution Feed */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Live Activity</h2>
          {feedItems.length === 0 ? (
            <div className="text-gray-500 text-center py-8 text-sm">No contributions yet</div>
          ) : (
            <div className="space-y-1.5">
              {feedItems.map(item => (
                <Link to={`/contribution/${item.id}`} key={item.id} className="block bg-[#0a101d] border border-[#1d2839] rounded-lg p-3 hover:border-[#a6ed2a] transition-colors">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      item.status === 'complete' ? 'bg-[#a6ed2a]' : 
                      item.status === 'processing' ? 'bg-blue-400 animate-pulse' : 
                      item.status === 'error' ? 'bg-red-400' : 'bg-yellow-400'
                    }`} />
                    {item.participant_name && item.participant_id && (
                      <Link to={`/p/${item.participant_id}`} className="text-xs font-medium text-gray-300 truncate hover:text-[#a6ed2a] transition-colors" onClick={e => e.stopPropagation()}>
                        {item.participant_name}
                      </Link>
                    )}
                    {item.participant_name && !item.participant_id && (
                      <span className="text-xs font-medium text-gray-300 truncate">{item.participant_name}</span>
                    )}
                    <span className="text-xs text-gray-600 ml-auto flex-shrink-0">{timeAgo(item.created_at)}</span>
                  </div>
                  {item.title && (
                    <p className="text-sm font-medium text-white mb-1">{item.title}</p>
                  )}
                  <p className="text-xs text-gray-400 line-clamp-2 mb-1.5">{item.preview}</p>
                  {item.status === 'complete' && (item.artifact_count > 0 || item.relationship_count > 0) && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      {item.artifact_count > 0 && (
                        <span className="text-xs text-gray-400">
                          <span className="font-mono text-[#a6ed2a] font-medium">{item.artifact_count}</span> {item.artifact_count === 1 ? 'node' : 'nodes'}
                        </span>
                      )}
                      {item.relationship_count > 0 && (
                        <span className="text-xs text-gray-400">
                          <span className="font-mono text-[#a6ed2a] font-medium">{item.relationship_count}</span> {item.relationship_count === 1 ? 'edge' : 'edges'}
                        </span>
                      )}
                      {item.commitment_count > 0 && (
                        <span className="text-xs text-gray-400">
                          <span className="font-mono text-amber-400 font-medium">{item.commitment_count}</span> {item.commitment_count === 1 ? 'commitment' : 'commitments'}
                        </span>
                      )}
                    </div>
                  )}
                  {item.status === 'processing' && (
                    <div className="mt-1">
                      <ExtractionProgress startedAt={item.created_at} compact />
                    </div>
                  )}
                  {item.status === 'error' && (
                    <span className="text-xs text-red-400">Extraction failed</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
