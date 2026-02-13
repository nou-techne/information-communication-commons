import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { supabase, ARTIFACT_COLORS, REA_COLORS, REA_LABELS } from '../lib/supabase'
import type { Artifact } from '../lib/supabase'
import { Activity, Users, Link2, Flame, TrendingUp, Info, ChevronLeft, ChevronRight } from 'lucide-react'
import { fetchTagSignalDensity } from '../lib/signals'
import { ExtractionProgress } from '../components/ExtractionProgress'
import { ChainStatus } from '../components/ChainStatus'
import { ReplaySlider } from '../components/ReplaySlider'
import { SessionsList } from '../components/SessionsList'
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
  artifact_count: number
  relationship_count: number
  commitment_count: number
  preview: string
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function Live() {
  const { convergence } = useConvergence()
  const DIMENSIONS = convergence.dimensions

  const [stats, setStats] = useState({ artifacts: 0, participants: 0, relationships: 0, signals: 0, lastHour: 0 })
  const [dimCounts, setDimCounts] = useState<Record<string, number>>({})
  const [feedItems, setFeedItems] = useState<ContributionFeedItem[]>([])
  const [recentArtifacts, setRecentArtifacts] = useState<Artifact[]>([])
  const [replaySeq, setReplaySeq] = useState<number | null>(null)
  const [chainMaxSeq, setChainMaxSeq] = useState(0)
  const [showAbout, setShowAbout] = useState(false)
  const [dimSignalCounts, setDimSignalCounts] = useState<Record<string, number>>({})
  const [feedPage, setFeedPage] = useState(0)
  const FEED_PAGE_SIZE = 8
  const [isFullscreen, setIsFullscreen] = useState(false)
  const graphContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onFullscreenChange() { setIsFullscreen(!!document.fullscreenElement) }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  async function loadAll() {
    const [{ count: ac }, { count: pc }, { count: rc }, { count: cc }] = await Promise.all([
      supabase.from('artifacts').select('*', { count: 'exact', head: true }),
      supabase.from('public_participants').select('*', { count: 'exact', head: true }),
      supabase.from('artifact_relationships').select('*', { count: 'exact', head: true }),
      supabase.from('coordination_interests').select('*', { count: 'exact', head: true }),
    ])
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recentCount } = await supabase.from('contributions').select('*', { count: 'exact', head: true }).gte('created_at', oneHourAgo)
    setStats({ artifacts: ac || 0, participants: pc || 0, relationships: rc || 0, signals: cc || 0, lastHour: recentCount || 0 })

    const [{ data: tagData }, { data: wordData }] = await Promise.all([
      supabase.from('tags').select('name, artifact_tags(count)').like('name', 'hlamt:%'),
      supabase.rpc('word_frequencies'),
    ])
    const c: Record<string, number> = {}
    if (tagData) {
      for (const tag of tagData) {
        const arr = tag.artifact_tags as unknown as { count: number }[]
        c[tag.name] = arr?.[0]?.count ?? 0
      }
    }
    if (wordData) c['hlamt:L'] = wordData.length
    setDimCounts(c)

    const { data: feed } = await supabase.from('contribution_feed').select('*').limit(20)
    setFeedItems((feed as ContributionFeedItem[]) || [])

    const { data: arts } = await supabase.from('artifacts').select('*').order('created_at', { ascending: false }).limit(8)
    setRecentArtifacts((arts || []) as Artifact[])

    const { data: chainData } = await supabase.rpc('chain_head')
    if (chainData && chainData.length > 0 && chainData[0].head_seq) setChainMaxSeq(chainData[0].head_seq)

    const density = await fetchTagSignalDensity()
    const dsc: Record<string, number> = {}
    for (const d of density) {
      if (d.tag_name.startsWith('hlamt:')) dsc[d.tag_name] = d.total_signals
    }
    setDimSignalCounts(dsc)
  }

  useEffect(() => {
    loadAll()
    const interval = setInterval(loadAll, 10000)
    const channel = supabase.channel('live-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'artifacts' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, loadAll)
      .subscribe()
    return () => { clearInterval(interval); supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="pb-4 flex flex-col min-h-[calc(100vh-64px)]">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[#a6ed2a] font-bold text-xl tracking-tight">EthBoulder</span>
          <span className="text-gray-500 text-xl">.commons.id</span>
          <span className="text-gray-600 text-xs ml-2 hidden sm:inline">Knowledge Graph · Live</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Inline stats — horizontal ticker style */}
          <div className="hidden md:flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-gray-400"><Activity className="w-3 h-3 text-[#a6ed2a]" /><span className="font-mono text-white">{stats.artifacts}</span> artifacts</span>
            <span className="flex items-center gap-1 text-gray-400"><Users className="w-3 h-3 text-violet-500" /><span className="font-mono text-white">{stats.participants}</span> people</span>
            <span className="flex items-center gap-1 text-gray-400"><Link2 className="w-3 h-3 text-cyan-500" /><span className="font-mono text-white">{stats.relationships}</span> edges</span>
            <span className="flex items-center gap-1 text-gray-400"><Flame className="w-3 h-3 text-orange-400" /><span className="font-mono text-white">{stats.signals}</span> signals</span>
            <span className="flex items-center gap-1 text-gray-400"><TrendingUp className="w-3 h-3 text-[#a6ed2a]" /><span className="font-mono text-white">{stats.lastHour}</span>/hr</span>
          </div>
          <button onClick={() => setShowAbout(!showAbout)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#a6ed2a] transition-colors">
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mobile stats (visible below md) */}
      <div className="flex md:hidden items-center justify-between gap-2 mb-2 text-[10px] text-gray-400">
        <span><span className="font-mono text-white">{stats.artifacts}</span> artifacts</span>
        <span><span className="font-mono text-white">{stats.participants}</span> people</span>
        <span><span className="font-mono text-white">{stats.relationships}</span> edges</span>
        <span><span className="font-mono text-white">{stats.signals}</span> signals</span>
        <span><span className="font-mono text-white">{stats.lastHour}</span>/hr</span>
      </div>

      {/* About (collapsed) */}
      {showAbout && (
        <div className="mb-2 bg-[#0a101d] border border-[#1d2839] rounded-lg px-4 py-2.5 text-xs text-gray-400 leading-relaxed">
          A <strong className="text-gray-300">living knowledge graph</strong> for ETHBoulder 2026.
          Contribute naturally — AI extracts artifacts, tags dimensions, connects the graph.
          <Link to="/contribute" className="text-[#a6ed2a] hover:text-white ml-2">Try it →</Link>
        </div>
      )}

      {/* ── DIMENSIONS BAR ── */}
      <div className="grid grid-cols-7 gap-1.5 mb-3">
        {DIMENSIONS.map(d => {
          const count = dimCounts[d.tag] ?? 0
          const signals = dimSignalCounts[d.tag] ?? 0
          return (
            <Link key={d.key} to={`/d/${d.key}`}
              className="block rounded border bg-[#0a101d] px-2 py-1.5 hover:border-[#a6ed2a] transition-colors group"
              style={signals > 0 ? { borderColor: `rgba(245,158,11,${Math.min(0.6, signals * 0.15)})` } : { borderColor: '#1d2839' }}
            >
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-sm font-bold" style={{ color: d.color }}>{d.letter}/</span>
                <span className="text-sm font-bold text-white">{count}</span>
                {signals > 0 && <span className="text-[9px] text-amber-400 ml-auto">{signals}</span>}
              </div>
              <div className="text-[9px] text-gray-500 uppercase tracking-wide leading-none truncate">{d.name}</div>
            </Link>
          )
        })}
      </div>

      {/* ── MAIN CONTENT: Graph + Sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">

        {/* Graph — dominant left panel (8/12) */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Graph Constellation</h2>
            <Link to="/explore" className="text-[10px] text-[#a6ed2a] hover:text-white transition-colors">Explorer →</Link>
          </div>
          <div ref={graphContainerRef} className={`relative ${isFullscreen ? 'bg-[#080c16] w-screen h-screen flex flex-col' : ''}`}>
            <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-gray-500 text-sm">Loading...</div></div>}>
              <div className={`relative w-full rounded-lg border border-[#1d2839] overflow-hidden ${isFullscreen ? 'flex-1' : 'h-[350px] sm:h-[420px] md:h-[520px] lg:h-[calc(100vh-260px)]'}`}>
                <Graph replaySeq={replaySeq} />
              </div>
            </Suspense>
            {isFullscreen && <div className="p-2 pt-0"><ChainStatus compact /></div>}
          </div>
        </div>

        {/* Sidebar — feed + artifacts (4/12) */}
        <div className="lg:col-span-4 min-w-0 flex flex-col gap-3">

          {/* Live Activity Feed */}
          <div className="flex-1 min-h-0">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Live Activity</h2>
              {feedItems.length > FEED_PAGE_SIZE && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setFeedPage(p => Math.max(0, p - 1))} disabled={feedPage === 0}
                    className="p-0.5 text-xs rounded bg-[#0a101d] border border-[#1d2839] text-gray-300 hover:border-[#a6ed2a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="text-[10px] text-gray-500">{feedPage * FEED_PAGE_SIZE + 1}–{Math.min((feedPage + 1) * FEED_PAGE_SIZE, feedItems.length)}/{feedItems.length}</span>
                  <button onClick={() => setFeedPage(p => Math.min(Math.ceil(feedItems.length / FEED_PAGE_SIZE) - 1, p + 1))} disabled={(feedPage + 1) * FEED_PAGE_SIZE >= feedItems.length}
                    className="p-0.5 text-xs rounded bg-[#0a101d] border border-[#1d2839] text-gray-300 hover:border-[#a6ed2a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            {feedItems.length === 0 ? (
              <div className="text-gray-500 text-center py-6 text-xs bg-[#0a101d] border border-[#1d2839] rounded">
                No contributions yet. <Link to="/contribute" className="text-[#a6ed2a]">Be the first.</Link>
              </div>
            ) : (
              <div className="space-y-1">
                {feedItems.slice(feedPage * FEED_PAGE_SIZE, (feedPage + 1) * FEED_PAGE_SIZE).map(item => (
                  <Link to={`/contribution/${item.id}`} key={item.id} className="block bg-[#0a101d] border border-[#1d2839] rounded px-2 py-1.5 hover:border-[#a6ed2a] transition-colors">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        item.status === 'complete' ? 'bg-[#a6ed2a]' :
                        item.status === 'processing' ? 'bg-blue-400 animate-pulse' :
                        item.status === 'error' ? 'bg-red-400' : 'bg-yellow-400'
                      }`} />
                      {item.participant_name && item.participant_id && (
                        <Link to={`/p/${item.participant_id}`} className="text-[11px] font-medium text-gray-300 truncate hover:text-[#a6ed2a]" onClick={e => e.stopPropagation()}>
                          {item.participant_name}
                        </Link>
                      )}
                      {item.participant_name && !item.participant_id && (
                        <span className="text-[11px] font-medium text-gray-300 truncate">{item.participant_name}</span>
                      )}
                      <span className="text-[10px] text-gray-600 ml-auto flex-shrink-0">{timeAgo(item.created_at)}</span>
                    </div>
                    {item.title && <p className="text-[11px] font-medium text-white mb-0.5 truncate">{item.title}</p>}
                    <p className="text-[10px] text-gray-400 line-clamp-1">{item.preview}</p>
                    {item.status === 'complete' && (item.artifact_count > 0 || item.relationship_count > 0) && (
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.artifact_count > 0 && (
                          <span className="text-[10px] text-gray-500"><span className="font-mono text-[#a6ed2a]">{item.artifact_count}</span> nodes</span>
                        )}
                        {item.relationship_count > 0 && (
                          <span className="text-[10px] text-gray-500"><span className="font-mono text-[#a6ed2a]">{item.relationship_count}</span> edges</span>
                        )}
                        {item.commitment_count > 0 && (
                          <span className="text-[10px] text-gray-500"><span className="font-mono text-amber-400">{item.commitment_count}</span> commits</span>
                        )}
                      </div>
                    )}
                    {item.status === 'processing' && <div className="mt-0.5"><ExtractionProgress startedAt={item.created_at} compact /></div>}
                    {item.status === 'error' && <span className="text-[10px] text-red-400">Failed</span>}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sessions */}
          <div>
            <h2 className="text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wider">Sessions</h2>
            <SessionsList compact limit={6} />
          </div>

          {/* Recent Artifacts */}
          {recentArtifacts.length > 0 && (
            <div>
              <h2 className="text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wider">Recent Artifacts</h2>
              <div className="space-y-0.5">
                {recentArtifacts.map(a => (
                  <Link key={a.id} to={`/artifact/${a.id}`} className="flex items-center gap-2 bg-[#0a101d] border border-[#1d2839] rounded px-2 py-1 hover:border-[#a6ed2a] transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: ARTIFACT_COLORS[a.type] }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[10px] text-white truncate">{a.title}</div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {a.rea_role && <span className="text-[9px]" style={{ color: REA_COLORS[a.rea_role] }}>{REA_LABELS[a.rea_role]}</span>}
                      <span className="text-[9px] text-gray-600">{timeAgo(a.created_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CHAIN REPLAY — slimline bottom bar ── */}
      {chainMaxSeq > 0 && (
        <div className="mt-3 bg-[#0a101d]/80 border border-[#1d2839] rounded px-4 py-1.5 flex items-center gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <h3 className="text-[9px] font-semibold text-gray-500 uppercase">Chain Replay</h3>
            <ChainStatus compact />
          </div>
          <div className="flex-1 min-w-0">
            <ReplaySlider maxSeq={chainMaxSeq} onSeqChange={seq => setReplaySeq(seq)} />
          </div>
        </div>
      )}

    </div>
  )
}
