import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Activity, Users, Link2, TrendingUp, Info, BookOpen, Compass, CheckCircle, AlertCircle, Clock, RefreshCw, Flame } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardBody } from '../components/ui/Card'
import type { Session } from '@supabase/supabase-js'

interface Stats {
  totalArtifacts: number
  totalParticipants: number
  totalRelationships: number
  recentContributions: number
  totalCoordSignals: number
}

interface RecentArtifact {
  id: string
  title: string
  created_at: string
  rea_role: 'resource' | 'event' | 'agent'
}

interface DimensionStat {
  dimension: string
  count: number
  color: string
}

interface HealthMetrics {
  contributions_last_hour: number
  successful: number
  failed: number
  processing: number
  pending: number
  success_rate_pct: number
  avg_processing_seconds: number
  contributions_last_24h: number
  successful_24h: number
  failed_24h: number
  success_rate_24h_pct: number
}

interface FailedContribution {
  id: string
  content: string
  errors: any
  created_at: string
}

const REA_COLORS_BG: Record<string, string> = {
  resource: 'bg-green-500',
  event: 'bg-amber-500',
  agent: 'bg-blue-500',
}

const DIMENSION_INFO: Record<string, { letter: string; name: string; desc: string; color: string; explain: string }> = {
  E: { letter: 'e/', name: 'Ecology', desc: 'Where We Are', color: '#4a8c6f', explain: 'The bioregional and environmental context — watersheds, ecosystems, and the living systems that ground our work in place.' },
  H: { letter: 'H/', name: 'Human', desc: "Who's Here", color: '#c4956a', explain: 'The people, their backgrounds, skills, and the relationships between participants.' },
  L: { letter: 'L/', name: 'Language', desc: 'How We Talk', color: '#a6ed2a', explain: 'The shared vocabulary, concepts, and frameworks that enable coordination.' },
  A: { letter: 'A/', name: 'Artifacts', desc: "What We're Building", color: '#8bbfff', explain: 'The tools, protocols, software, and tangible outputs that persist beyond the event.' },
  M: { letter: 'M/', name: 'Methodology', desc: 'How We Work', color: '#7ccfb8', explain: 'The processes, governance patterns, and coordination mechanisms.' },
  T: { letter: 'T/', name: 'Training', desc: "What We're Learning", color: '#e8927c', explain: 'The transformation of practitioners through practice — skills developed and capacity built.' },
}

const DIMENSION_ORDER = ['E', 'H', 'L', 'A', 'M', 'T']

function timeAgo(timestamp: string) {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export default function Live() {
  const [stats, setStats] = useState<Stats>({ totalArtifacts: 0, totalParticipants: 0, totalRelationships: 0, recentContributions: 0, totalCoordSignals: 0 })
  const [recentArtifacts, setRecentArtifacts] = useState<RecentArtifact[]>([])
  const [dimensions, setDimensions] = useState<DimensionStat[]>([])
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null)
  const [failedContributions, setFailedContributions] = useState<FailedContribution[]>([])
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set())
  const [session, setSession] = useState<Session | null>(null)
  const [showHealth, setShowHealth] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  async function loadAll() {
    // Stats
    const [{ count: ac }, { count: pc }, { count: rc }, { count: coordCount }] = await Promise.all([
      supabase.from('artifacts').select('*', { count: 'exact', head: true }),
      supabase.from('participants').select('*', { count: 'exact', head: true }),
      supabase.from('artifact_relationships').select('*', { count: 'exact', head: true }),
      supabase.from('coordination_interests').select('*', { count: 'exact', head: true }),
    ])
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recentCount } = await supabase.from('contributions').select('*', { count: 'exact', head: true }).gte('created_at', oneHourAgo)
    setStats({
      totalArtifacts: ac || 0,
      totalParticipants: pc || 0,
      totalRelationships: rc || 0,
      recentContributions: recentCount || 0,
      totalCoordSignals: coordCount || 0,
    })

    // Recent artifacts
    const { data: arts } = await supabase.from('artifacts').select('id, title, created_at, rea_role').order('created_at', { ascending: false }).limit(8)
    setRecentArtifacts((arts || []) as RecentArtifact[])

    // Dimensions
    const { data: tagData } = await supabase.from('artifact_tags').select('tag_id, tags(name)').not('tags', 'is', null)
    const counts: Record<string, number> = {}
    for (const row of (tagData || []) as any[]) {
      const tagName = row.tags?.name
      if (!tagName || !tagName.startsWith('hlamt:')) continue
      const dim = tagName.split(':')[1]
      counts[dim] = (counts[dim] || 0) + 1
    }
    setDimensions(DIMENSION_ORDER.map(dim => ({
      dimension: dim,
      count: counts[dim] || 0,
      color: DIMENSION_INFO[dim]?.color || '#888',
    })))

    // Health metrics
    const { data: metricsData } = await supabase.from('extraction_health_metrics').select('*').single()
    if (metricsData) setMetrics(metricsData as unknown as HealthMetrics)

    // Failed contributions
    const { data: failedData } = await supabase.from('contributions').select('id, content, errors, created_at').eq('status', 'error').order('created_at', { ascending: false }).limit(10)
    setFailedContributions((failedData || []).map((d: any) => ({ id: d.id, content: d.content, errors: d.errors, created_at: d.created_at ?? '' })))
  }

  async function handleRetry(id: string) {
    setRetryingIds(prev => new Set(prev).add(id))
    const { error } = await supabase.from('contributions').update({ status: 'pending', errors: null }).eq('id', id)
    if (!error) setFailedContributions(prev => prev.filter(c => c.id !== id))
    setRetryingIds(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  useEffect(() => {
    loadAll()
    const interval = setInterval(loadAll, 10000)
    const channel = supabase.channel('live-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'artifacts' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'artifact_relationships' }, loadAll)
      .subscribe()
    return () => { clearInterval(interval); supabase.removeChannel(channel) }
  }, [])

  const maxDimCount = Math.max(...dimensions.map(d => d.count), 1)
  const isHealthy = !metrics || metrics.success_rate_pct >= 80

  return (
    <div className="min-h-screen bg-[#080c16] text-gray-100 p-4 sm:p-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="text-[#a6ed2a] font-bold text-4xl sm:text-5xl tracking-tight">EthBoulder</div>
          <div className="text-gray-500 text-4xl sm:text-5xl">.commons.id</div>
        </div>
        <div className="text-gray-500 text-lg mb-4">Knowledge Graph · Live</div>
      </div>

      {/* What is this? */}
      <Card className="mb-8">
        <CardBody>
          <div className="flex items-start gap-3">
            <Compass className="w-5 h-5 text-[#a6ed2a] mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="text-lg font-semibold text-gray-200 mb-2">What is this?</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-3">
                A <strong className="text-gray-300">living knowledge graph</strong> for ETHBoulder 2026.
                Every session, conversation, and contribution is captured, extracted into structured artifacts, and connected
                through relationships — building a collective map of what happened, who was involved, and what emerged.
              </p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Knowledge is organized across <strong className="text-gray-300">six observation dimensions</strong> from
                the <a href="https://the-habitat.org/thesis" target="_blank" rel="noopener noreferrer" className="text-[#a6ed2a] hover:text-white transition-colors">H-LAM/T framework</a>.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-6 mb-8">
        <Card>
          <CardBody className="text-center">
            <Activity className="w-6 h-6 text-[#a6ed2a] mx-auto mb-2" />
            <div className="text-3xl font-bold mb-1">{stats.totalArtifacts}</div>
            <div className="text-gray-500 text-xs uppercase tracking-wide">Artifacts</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <Users className="w-6 h-6 text-violet-500 mx-auto mb-2" />
            <div className="text-3xl font-bold mb-1">{stats.totalParticipants}</div>
            <div className="text-gray-500 text-xs uppercase tracking-wide">Participants</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <Link2 className="w-6 h-6 text-cyan-500 mx-auto mb-2" />
            <div className="text-3xl font-bold mb-1">{stats.totalRelationships}</div>
            <div className="text-gray-500 text-xs uppercase tracking-wide">Connections</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <div className="text-3xl font-bold mb-1">{stats.totalCoordSignals}</div>
            <div className="text-gray-500 text-xs uppercase tracking-wide">Signals</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <TrendingUp className="w-6 h-6 text-[#a6ed2a] mx-auto mb-2" />
            <div className="text-3xl font-bold mb-1">{stats.recentContributions}</div>
            <div className="text-gray-500 text-xs uppercase tracking-wide">Last Hour</div>
          </CardBody>
        </Card>
      </div>

      {/* Observation Dimensions */}
      <Card className="mb-8">
        <CardBody>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-[#a6ed2a]" />
            <h2 className="text-xl font-semibold text-gray-200">Observation Dimensions</h2>
          </div>
          <p className="text-gray-500 text-sm mb-5">Six lenses from the e/H-LAM/T framework. Click any dimension to explore.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dimensions.map(dim => {
              const info = DIMENSION_INFO[dim.dimension]
              if (!info) return null
              const dimKey = dim.dimension === 'E' ? 'e' : dim.dimension
              const widthPct = maxDimCount > 0 ? (dim.count / maxDimCount) * 100 : 0
              return (
                <Link key={dim.dimension} to={`/d/${dimKey}`}
                  className="block rounded-lg border border-[#1d2839] bg-[#0a101d] p-4 hover:border-opacity-60 transition-all group"
                  style={{ borderColor: dim.count > 0 ? info.color + '30' : undefined }}
                >
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-mono text-2xl font-bold" style={{ color: info.color }}>{info.letter}</span>
                    <span className="text-base font-semibold text-gray-200 group-hover:text-white transition-colors">{info.name}</span>
                    <span className="text-xs text-gray-500 ml-auto">{dim.count}</span>
                  </div>
                  <div className="text-xs font-medium mb-2" style={{ color: info.color + 'cc' }}>{info.desc}</div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{info.explain}</p>
                  <div className="w-full bg-[#080c16] rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${widthPct}%`, backgroundColor: info.color }} />
                  </div>
                </Link>
              )
            })}
          </div>
        </CardBody>
      </Card>

      {/* Two Column: How it works + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardBody>
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-[#a6ed2a]" />
              <h2 className="text-lg font-semibold text-gray-200">How It Works</h2>
            </div>
            <div className="space-y-4 text-sm">
              {[
                { n: '1', title: 'Contribute', desc: <>Share session notes, observations, or ideas through the <Link to="/contribute" className="text-[#a6ed2a] hover:text-white">Contribute</Link> page.</> },
                { n: '2', title: 'Extract', desc: 'AI identifies artifacts, people, relationships, and dimensions — structuring free-form notes into a knowledge graph.' },
                { n: '3', title: 'Connect', desc: 'Artifacts link together across sessions and dimensions, revealing patterns no single person could see alone.' },
                { n: '4', title: 'Explore', desc: <>Browse the <Link to="/" className="text-[#a6ed2a] hover:text-white">knowledge graph</Link> and <Link to="/dimensions" className="text-[#a6ed2a] hover:text-white">dimensions</Link> to discover what's emerging.</> },
              ].map(step => (
                <div key={step.n} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#a6ed2a]/10 text-[#a6ed2a] flex items-center justify-center flex-shrink-0 text-xs font-bold">{step.n}</div>
                  <div>
                    <div className="font-medium text-gray-300 mb-0.5">{step.title}</div>
                    <div className="text-gray-500">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold mb-4 text-gray-200">Recent Artifacts</h2>
            <div className="space-y-2">
              {recentArtifacts.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center">No artifacts yet. Be the first to <Link to="/contribute" className="text-[#a6ed2a] hover:text-white">contribute</Link>!</p>
              ) : recentArtifacts.map(a => (
                <Link key={a.id} to={`/artifact/${a.id}`} className="flex items-start gap-3 p-3 bg-[#080c16] rounded border border-gray-800 hover:border-[#a6ed2a]/30 transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${REA_COLORS_BG[a.rea_role] || 'bg-gray-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-200 truncate text-sm">{a.title}</div>
                    <div className="text-xs text-gray-500">{timeAgo(a.created_at)} ago · {a.rea_role}</div>
                  </div>
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* REA Ontology */}
      <Card className="mb-8">
        <CardBody>
          <h2 className="text-lg font-semibold text-gray-200 mb-3">Understanding the Graph</h2>
          <p className="text-gray-500 text-sm mb-4">
            Every artifact uses the <strong className="text-gray-300">REA ontology</strong> (Resource–Event–Agent) — making economic and social relationships legible.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { color: 'green', label: 'Resource', desc: 'Things of value — tools, protocols, ideas, proposals.' },
              { color: 'amber', label: 'Event', desc: 'Things that happen — sessions, workshops, discussions, decisions.' },
              { color: 'blue', label: 'Agent', desc: 'People and organizations — participants who create and transform.' },
            ].map(r => (
              <div key={r.label} className={`rounded-lg bg-[#080c16] border border-${r.color}-500/20 p-3`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-3 h-3 rounded-full bg-${r.color}-500`} />
                  <span className={`font-medium text-${r.color}-400 text-sm`}>{r.label}</span>
                </div>
                <p className="text-xs text-gray-500">{r.desc}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* System Health (collapsible) */}
      <Card className="mb-8">
        <CardBody>
          <button onClick={() => setShowHealth(!showHealth)} className="flex items-center justify-between w-full text-left">
            <div className="flex items-center gap-2">
              {isHealthy ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
              <h2 className="text-lg font-semibold text-gray-200">System Health</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full ${isHealthy ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                {isHealthy ? 'Healthy' : 'Degraded'}
              </span>
            </div>
            <svg className={`w-4 h-4 text-gray-500 transition-transform ${showHealth ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
          </button>

          {showHealth && metrics && (
            <div className="mt-4 pt-4 border-t border-[#1d2839]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-xl font-bold">{metrics.contributions_last_hour}</div>
                  <div className="text-xs text-gray-500">Last hour</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-green-500">{metrics.successful}</div>
                  <div className="text-xs text-gray-500">Successful</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-red-500">{metrics.failed}</div>
                  <div className="text-xs text-gray-500">Failed</div>
                </div>
                <div>
                  <div className="text-xl font-bold">{metrics.avg_processing_seconds}s</div>
                  <div className="text-xs text-gray-500">Avg time</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-lg font-bold">{metrics.contributions_last_24h}</div>
                  <div className="text-xs text-gray-500">24h total</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-500">{metrics.success_rate_24h_pct}%</div>
                  <div className="text-xs text-gray-500">24h success rate</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-yellow-500">{metrics.processing + metrics.pending}</div>
                  <div className="text-xs text-gray-500">In progress</div>
                </div>
              </div>

              {/* Error Recovery */}
              {failedContributions.length > 0 && session && (
                <div className="border-t border-[#1d2839] pt-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    Failed ({failedContributions.length})
                  </h3>
                  <div className="space-y-2">
                    {failedContributions.map(c => (
                      <div key={c.id} className="flex items-center justify-between gap-3 bg-[#080c16] border border-[#1d2839] rounded-lg p-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500">{new Date(c.created_at).toLocaleString()}</div>
                          <div className="text-sm text-gray-400 truncate">{c.content?.slice(0, 80)}</div>
                        </div>
                        <button
                          onClick={() => handleRetry(c.id)}
                          disabled={retryingIds.has(c.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-[#a6ed2a]/10 text-[#a6ed2a] border border-[#a6ed2a]/30 hover:bg-[#a6ed2a]/20 disabled:opacity-50 flex-shrink-0"
                        >
                          <RefreshCw className={`w-3 h-3 ${retryingIds.has(c.id) ? 'animate-spin' : ''}`} /> Retry
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Live indicator */}
      <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-[#0a101d] border border-gray-800 rounded-full px-4 py-2">
        <div className="w-2 h-2 rounded-full bg-[#a6ed2a] animate-pulse" />
        <span className="text-sm text-gray-400">LIVE</span>
      </div>
    </div>
  )
}
