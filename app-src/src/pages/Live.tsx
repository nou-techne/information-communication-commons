import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { supabase, ARTIFACT_COLORS, REA_COLORS, REA_LABELS } from '../lib/supabase'
import type { Artifact } from '../lib/supabase'
import { Activity, Users, Link2, Flame, TrendingUp, Info, Compass, PenLine, Sparkles, GitBranch, ChevronDown } from 'lucide-react'
import { ExtractionProgress } from '../components/ExtractionProgress'
import { ChainStatus } from '../components/ChainStatus'
import { ReplaySlider } from '../components/ReplaySlider'
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
      supabase.from('participants').select('*', { count: 'exact', head: true }),
      supabase.from('artifact_relationships').select('*', { count: 'exact', head: true }),
      supabase.from('coordination_interests').select('*', { count: 'exact', head: true }),
    ])
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recentCount } = await supabase.from('contributions').select('*', { count: 'exact', head: true }).gte('created_at', oneHourAgo)
    setStats({ artifacts: ac || 0, participants: pc || 0, relationships: rc || 0, signals: cc || 0, lastHour: recentCount || 0 })

    // Dimensions
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

    // Feed
    const { data: feed } = await supabase.from('contribution_feed').select('*').limit(20)
    setFeedItems((feed as ContributionFeedItem[]) || [])

    // Recent artifacts
    const { data: arts } = await supabase.from('artifacts').select('*').order('created_at', { ascending: false }).limit(8)
    setRecentArtifacts((arts || []) as Artifact[])

    // Chain head
    const { data: chainData } = await supabase.rpc('chain_head')
    if (chainData && chainData.length > 0 && chainData[0].head_seq) setChainMaxSeq(chainData[0].head_seq)
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
    <div className="pb-24">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="text-[#a6ed2a] font-bold text-3xl sm:text-4xl tracking-tight">EthBoulder</div>
          <div className="text-gray-500 text-3xl sm:text-4xl">.commons.id</div>
        </div>
        <div className="text-gray-500 text-base">Knowledge Graph · Live</div>
      </div>

      {/* About (collapsible) */}
      <div className="mb-6 bg-[#0a101d] border border-[#1d2839] rounded-lg overflow-hidden">
        <button onClick={() => setShowAbout(!showAbout)} className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#1d2839] transition-colors">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#a6ed2a]" />
            <span className="text-sm font-medium text-white">What is this?</span>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showAbout ? 'rotate-180' : ''}`} />
        </button>
        {showAbout && (
          <div className="px-4 pb-4 text-sm space-y-3 border-t border-[#1d2839] pt-4">
            <p className="text-gray-400 leading-relaxed">
              A <strong className="text-gray-300">living knowledge graph</strong> for ETHBoulder 2026.
              Every contribution is captured, extracted into structured artifacts, and connected — building a collective map of what happened, who was involved, and what emerged.
            </p>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#a6ed2a] text-[#080c16] flex items-center justify-center"><PenLine className="w-4 h-4" /></span>
              <div><div className="text-white font-medium mb-0.5">Contribute</div><div className="text-gray-400">Share session notes, ideas, commitments, questions. Write naturally.</div></div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#a6ed2a] text-[#080c16] flex items-center justify-center"><Sparkles className="w-4 h-4" /></span>
              <div><div className="text-white font-medium mb-0.5">Extract</div><div className="text-gray-400">AI identifies artifacts (resources, events, agents) and tags by dimension.</div></div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#a6ed2a] text-[#080c16] flex items-center justify-center"><GitBranch className="w-4 h-4" /></span>
              <div><div className="text-white font-medium mb-0.5">Connect</div><div className="text-gray-400">Artifacts link across sessions and dimensions. Patterns emerge.</div></div>
            </div>
            <div className="pt-2 border-t border-[#1d2839]">
              <Link to="/contribute" className="text-[#a6ed2a] hover:text-white text-sm font-medium">Try it yourself →</Link>
            </div>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-2 sm:gap-4 mb-6">
        {[
          { icon: Activity, value: stats.artifacts, label: 'Artifacts', color: 'text-[#a6ed2a]' },
          { icon: Users, value: stats.participants, label: 'Participants', color: 'text-violet-500' },
          { icon: Link2, value: stats.relationships, label: 'Connections', color: 'text-cyan-500' },
          { icon: Flame, value: stats.signals, label: 'Signals', color: 'text-orange-400' },
          { icon: TrendingUp, value: stats.lastHour, label: 'Last Hour', color: 'text-[#a6ed2a]' },
        ].map(({ icon: Icon, value, label, color }) => (
          <div key={label} className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-3 text-center">
            <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">{label}</div>
          </div>
        ))}
      </div>

      {/* Dimensions */}
      <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Graph Dimensions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-6">
        {DIMENSIONS.map(d => {
          const count = dimCounts[d.tag] ?? 0
          return (
            <Link key={d.key} to={`/d/${d.key}`}
              className="block rounded-lg border border-[#1d2839] bg-[#0a101d] p-3 sm:p-4 hover:border-[#a6ed2a] transition-colors text-center group"
            >
              <div className="text-xs font-medium mb-1 truncate" style={{ color: d.color }}>{d.name}</div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="font-mono text-xl sm:text-2xl font-bold" style={{ color: d.color }}>{d.letter}</span>
                <span className="text-xl sm:text-2xl font-bold text-white">{count}</span>
              </div>
              <span className="text-xs text-gray-400 group-hover:text-white transition-colors block truncate">{d.desc}</span>
            </Link>
          )
        })}
      </div>

      {/* Main: Graph + Feed side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: 3D Graph */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Graph Constellation</h2>
            <Link to="/explore" className="text-xs text-[#a6ed2a] hover:text-white transition-colors">Full Explorer →</Link>
          </div>
          <div ref={graphContainerRef} className={`relative ${isFullscreen ? 'bg-[#080c16] w-screen h-screen flex flex-col' : ''}`}>
            <Suspense fallback={<div className="flex items-center justify-center h-96"><div className="text-gray-500">Loading constellation...</div></div>}>
              <div className={`relative w-full rounded-lg ${isFullscreen ? 'flex-1 overflow-auto' : 'h-[400px] sm:h-[500px] md:h-[700px] overflow-hidden'}`}>
                <Graph replaySeq={replaySeq} />
              </div>
            </Suspense>
            <div className={`${isFullscreen ? 'p-4' : 'mt-2'}`}>
              {chainMaxSeq > 0 && <ReplaySlider maxSeq={chainMaxSeq} onSeqChange={seq => setReplaySeq(seq)} />}
            </div>
            {isFullscreen && <div className="p-4 pt-0"><ChainStatus /></div>}
          </div>
        </div>

        {/* Right: Chain + Feed + Recent */}
        <div className="min-w-0">
          <div className="mb-4"><ChainStatus /></div>

          <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Live Activity</h2>
          {feedItems.length === 0 ? (
            <div className="text-gray-500 text-center py-8 text-sm">No contributions yet. <Link to="/contribute" className="text-[#a6ed2a]">Be the first.</Link></div>
          ) : (
            <div className="space-y-1.5 mb-6">
              {feedItems.map(item => (
                <Link to={`/contribution/${item.id}`} key={item.id} className="block bg-[#0a101d] border border-[#1d2839] rounded-lg p-3 hover:border-[#a6ed2a] transition-colors">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      item.status === 'complete' ? 'bg-[#a6ed2a]' :
                      item.status === 'processing' ? 'bg-blue-400 animate-pulse' :
                      item.status === 'error' ? 'bg-red-400' : 'bg-yellow-400'
                    }`} />
                    {item.participant_name && item.participant_id && (
                      <Link to={`/p/${item.participant_id}`} className="text-xs font-medium text-gray-300 truncate hover:text-[#a6ed2a]" onClick={e => e.stopPropagation()}>
                        {item.participant_name}
                      </Link>
                    )}
                    {item.participant_name && !item.participant_id && (
                      <span className="text-xs font-medium text-gray-300 truncate">{item.participant_name}</span>
                    )}
                    <span className="text-xs text-gray-600 ml-auto flex-shrink-0">{timeAgo(item.created_at)}</span>
                  </div>
                  {item.title && <p className="text-sm font-medium text-white mb-1">{item.title}</p>}
                  <p className="text-xs text-gray-400 line-clamp-2 mb-1.5">{item.preview}</p>
                  {item.status === 'complete' && (item.artifact_count > 0 || item.relationship_count > 0) && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      {item.artifact_count > 0 && (
                        <span className="text-xs text-gray-400"><span className="font-mono text-[#a6ed2a] font-medium">{item.artifact_count}</span> {item.artifact_count === 1 ? 'node' : 'nodes'}</span>
                      )}
                      {item.relationship_count > 0 && (
                        <span className="text-xs text-gray-400"><span className="font-mono text-[#a6ed2a] font-medium">{item.relationship_count}</span> {item.relationship_count === 1 ? 'edge' : 'edges'}</span>
                      )}
                      {item.commitment_count > 0 && (
                        <span className="text-xs text-gray-400"><span className="font-mono text-amber-400 font-medium">{item.commitment_count}</span> {item.commitment_count === 1 ? 'commitment' : 'commitments'}</span>
                      )}
                    </div>
                  )}
                  {item.status === 'processing' && <div className="mt-1"><ExtractionProgress startedAt={item.created_at} compact /></div>}
                  {item.status === 'error' && <span className="text-xs text-red-400">Extraction failed</span>}
                </Link>
              ))}
            </div>
          )}

          {/* Recent Artifacts */}
          {recentArtifacts.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Recent Artifacts</h2>
              <div className="space-y-1.5">
                {recentArtifacts.map(a => (
                  <Link key={a.id} to={`/artifact/${a.id}`} className="flex items-start gap-3 bg-[#0a101d] border border-[#1d2839] rounded-lg p-3 hover:border-[#a6ed2a] transition-colors">
                    <span className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: ARTIFACT_COLORS[a.type] }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-white truncate">{a.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{a.type}</span>
                        {a.rea_role && <span className="text-xs" style={{ color: REA_COLORS[a.rea_role] }}>{REA_LABELS[a.rea_role]}</span>}
                        <span className="text-xs text-gray-600 ml-auto">{timeAgo(a.created_at)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Live indicator */}
      <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-[#0a101d] border border-gray-800 rounded-full px-4 py-2">
        <div className="w-2 h-2 rounded-full bg-[#a6ed2a] animate-pulse" />
        <span className="text-sm text-gray-400">LIVE</span>
      </div>
    </div>
  )
}
