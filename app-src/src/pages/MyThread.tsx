import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase, ARTIFACT_COLORS, STATE_LABELS, REA_COLORS, REA_LABELS } from '../lib/supabase'
import type { Artifact, Commitment } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { Plus, FileText, GitBranch, Target, Clock, ChevronDown, ChevronUp, Link2, Users, Sparkles, Flame, Radio } from 'lucide-react'
import { SignalFlame } from '../components/SignalFlame'

type ViewMode = 'chain' | 'social' | 'semantic'

interface Contribution {
  id: string
  content: string
  title: string | null
  status: string
  created_at: string
  processed_at: string | null
  extraction: any
  seq: number | null
  chain_hash: string | null
}

interface ParticipantConnection {
  id: string
  name: string
  sharedTags: number
  sharedCoordination: number
  sharedArtifactTitles: string[]
}

interface TagCluster {
  tag: string
  artifacts: Artifact[]
  coordinationCount: number
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function MyThread() {
  const [session, setSession] = useState<Session | null>(null)
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [participantName, setParticipantName] = useState<string>('')
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [edgeCount, setEdgeCount] = useState(0)
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [expandedContrib, setExpandedContrib] = useState<string | null>(null)
  const [contribArtifacts, setContribArtifacts] = useState<Record<string, Artifact[]>>({})
  const [viewMode, setViewMode] = useState<ViewMode>('chain')
  const [connections, setConnections] = useState<ParticipantConnection[]>([])
  const [tagClusters, setTagClusters] = useState<TagCluster[]>([])
  const [coordCounts, setCoordCounts] = useState<Record<string, number>>({})
  const [contribCoordCounts, setContribCoordCounts] = useState<Record<string, number>>({})
  const [mySignalsGiven, setMySignalsGiven] = useState(0)
  const [signalReach, setSignalReach] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) {
        loadContributions(null)
        return
      }
      loadParticipant(data.session.user.id)
    })

    const contribSub = supabase.channel('my-contributions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, () => {
        loadContributions(participantId)
      })
      .subscribe()

    return () => { supabase.removeChannel(contribSub) }
  }, [])

  useEffect(() => {
    if (participantId !== null) {
      loadContributions(participantId)
    }
  }, [participantId])

  async function loadContributions(filterParticipantId: string | null) {
    let query = supabase
      .from('contributions')
      .select('id, content, title, status, created_at, processed_at, extraction, seq, chain_hash')
      .order('created_at', { ascending: false })
      .limit(30)
    
    if (filterParticipantId) {
      query = query.eq('participant_id', filterParticipantId)
    }
    
    const { data } = await query
    setContributions(data || [])
  }

  async function loadParticipant(authId: string) {
    const { data: p } = await supabase.from('participants').select('id, name').eq('auth_user_id', authId).single()
    if (!p) return
    setParticipantId(p.id)
    setParticipantName(p.name || '')

    const [{ data: arts }, { data: comms }] = await Promise.all([
      supabase.from('artifacts').select('*').or(`created_by.eq.${p.id},steward_id.eq.${p.id}`).order('created_at', { ascending: false }).limit(50),
      supabase.from('commitments').select('*').eq('participant_id', p.id).order('created_at', { ascending: false }),
    ])
    setArtifacts(arts || [])
    setCommitments(comms || [])

    // Count edges connected to this participant's artifacts
    if (arts && arts.length > 0) {
      const artIds = arts.map(a => a.id)
      const { count } = await supabase.from('artifact_relationships').select('*', { count: 'exact', head: true })
        .or(artIds.map(id => `from_artifact_id.eq.${id}`).concat(artIds.map(id => `to_artifact_id.eq.${id}`)).join(','))
      setEdgeCount(count || 0)

      // Load coordination signals for my artifacts
      const { data: coordData } = await supabase.from('coordination_interests').select('artifact_id').in('artifact_id', artIds)
      const counts: Record<string, number> = {}
      for (const row of (coordData || [])) {
        counts[row.artifact_id] = (counts[row.artifact_id] || 0) + 1
      }
      setCoordCounts(counts)

      // CS-22: My signal activity
      const [{ count: givenCount }, { data: receivedData }] = await Promise.all([
        supabase.from('coordination_interests').select('*', { count: 'exact', head: true }).eq('participant_id', p.id),
        supabase.from('coordination_interests').select('participant_id').in('artifact_id', artIds).neq('participant_id', p.id),
      ])
      setMySignalsGiven(givenCount || 0)
      const uniqueSignalers = new Set((receivedData || []).map(r => r.participant_id))
      setSignalReach(uniqueSignalers.size)

      // Load tag data for social + semantic views
      const { data: tagData } = await supabase.from('artifact_tags').select('artifact_id, tags!inner(name)').in('artifact_id', artIds)
      
      // Build tag clusters for semantic view
      const tagMap: Record<string, Artifact[]> = {}
      for (const row of (tagData || [])) {
        const tagName = (row as any).tags?.name
        if (!tagName || tagName.startsWith('hlamt:')) continue
        if (!tagMap[tagName]) tagMap[tagName] = []
        const art = arts.find(a => a.id === row.artifact_id)
        if (art && !tagMap[tagName].find(a => a.id === art.id)) tagMap[tagName].push(art)
      }
      const clusters: TagCluster[] = Object.entries(tagMap)
        .map(([tag, clusterArts]) => ({
          tag,
          artifacts: clusterArts,
          coordinationCount: clusterArts.reduce((sum, a) => sum + (counts[a.id] || 0), 0),
        }))
        .sort((a, b) => b.artifacts.length - a.artifacts.length || b.coordinationCount - a.coordinationCount)
      setTagClusters(clusters)

      // Build social connections
      await loadSocialConnections(p.id, arts, tagData || [], counts)
    }
  }

  async function loadSocialConnections(myId: string, myArts: Artifact[], myTagData: any[], myCoordCounts: Record<string, number>) {
    // Find other participants who share tags with my artifacts
    const myArtIds = new Set(myArts.map(a => a.id))
    const myTags = new Set<string>()
    for (const row of myTagData) {
      const tagName = (row as any).tags?.name
      if (tagName && !tagName.startsWith('hlamt:')) myTags.add(tagName)
    }
    if (myTags.size === 0) { setConnections([]); return }

    // Get all artifacts with shared tags
    const { data: sharedTagData } = await supabase
      .from('artifact_tags')
      .select('artifact_id, tags!inner(name)')
    
    const otherArtIdsByTag: Record<string, string[]> = {}
    for (const row of (sharedTagData || [])) {
      const tagName = (row as any).tags?.name
      if (!tagName || !myTags.has(tagName)) continue
      if (myArtIds.has(row.artifact_id)) continue
      if (!otherArtIdsByTag[tagName]) otherArtIdsByTag[tagName] = []
      otherArtIdsByTag[tagName].push(row.artifact_id)
    }

    const otherArtIds = [...new Set(Object.values(otherArtIdsByTag).flat())]
    if (otherArtIds.length === 0) { setConnections([]); return }

    // Get artifacts with creator info
    const { data: otherArts } = await supabase
      .from('artifacts')
      .select('id, title, created_by')
      .in('id', otherArtIds)

    // Get coordination on shared artifacts
    const { data: sharedCoordData } = await supabase
      .from('coordination_interests')
      .select('artifact_id, participant_id')
      .in('artifact_id', otherArtIds)

    // Group by participant
    const participantMap: Record<string, { sharedTags: Set<string>; sharedCoord: number; sharedTitles: string[] }> = {}
    for (const [tag, artIds] of Object.entries(otherArtIdsByTag)) {
      for (const artId of artIds) {
        const art = (otherArts || []).find(a => a.id === artId)
        if (!art?.created_by || art.created_by === myId) continue
        if (!participantMap[art.created_by]) participantMap[art.created_by] = { sharedTags: new Set(), sharedCoord: 0, sharedTitles: [] }
        participantMap[art.created_by].sharedTags.add(tag)
        if (!participantMap[art.created_by].sharedTitles.includes(art.title)) {
          participantMap[art.created_by].sharedTitles.push(art.title)
        }
      }
    }

    // Count shared coordination interests
    for (const row of (sharedCoordData || [])) {
      if (participantMap[row.participant_id]) {
        participantMap[row.participant_id].sharedCoord++
      }
    }

    // Get participant names
    const pIds = Object.keys(participantMap)
    if (pIds.length === 0) { setConnections([]); return }
    const { data: participants } = await supabase.from('public_participants').select('id, name').in('id', pIds)

    const conns: ParticipantConnection[] = pIds
      .map(pid => {
        const p = (participants || []).find(pp => pp.id === pid)
        const info = participantMap[pid]
        return {
          id: pid,
          name: p?.name || 'Unknown',
          sharedTags: info.sharedTags.size,
          sharedCoordination: info.sharedCoord,
          sharedArtifactTitles: info.sharedTitles.slice(0, 5),
        }
      })
      .sort((a, b) => (b.sharedTags + b.sharedCoordination * 2) - (a.sharedTags + a.sharedCoordination * 2))

    setConnections(conns)
  }

  async function loadArtifactsForContribution(contribId: string) {
    if (contribArtifacts[contribId]) return
    const contrib = contributions.find(c => c.id === contribId)
    const extractedTitles = contrib?.extraction?.artifacts?.map((a: any) => a.title).filter(Boolean) || []
    
    if (extractedTitles.length === 0) {
      setContribArtifacts(prev => ({ ...prev, [contribId]: [] }))
      return
    }
    
    const { data } = await supabase
      .from('artifacts')
      .select('*')
      .in('title', extractedTitles)
      .order('created_at', { ascending: true })
    
    setContribArtifacts(prev => ({ ...prev, [contribId]: data || [] }))

    // Load coordination counts for contribution's artifacts
    if (data && data.length > 0) {
      const artIds = data.map(a => a.id)
      const { data: coordData } = await supabase.from('coordination_interests').select('artifact_id').in('artifact_id', artIds)
      let total = 0
      for (const row of (coordData || [])) { total++ }
      setContribCoordCounts(prev => ({ ...prev, [contribId]: total }))
    }
  }

  function toggleContrib(id: string) {
    if (expandedContrib === id) {
      setExpandedContrib(null)
    } else {
      setExpandedContrib(id)
      loadArtifactsForContribution(id)
    }
  }

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pending', color: 'text-yellow-300', bg: 'bg-yellow-900/30' },
    processing: { label: 'Extracting...', color: 'text-blue-300', bg: 'bg-blue-900/30' },
    complete: { label: 'Complete', color: 'text-green-300', bg: 'bg-green-900/30' },
    error: { label: 'Error', color: 'text-red-300', bg: 'bg-red-900/30' },
  }

  const totalContributions = contributions.length
  const totalArtifacts = artifacts.length
  const totalCommitments = commitments.length
  const totalCoordSignals = Object.values(coordCounts).reduce((sum, c) => sum + c, 0)

  // View-specific stats
  const chainStats = [
    { value: totalContributions, label: 'Chain Entries', color: 'text-[#a6ed2a]' },
    { value: totalArtifacts, label: 'Nodes Extracted', color: 'text-white' },
    { value: edgeCount, label: 'Edges', color: 'text-purple-400' },
    { value: totalCoordSignals, label: 'Coord Signals', color: 'text-orange-400' },
  ]

  const socialStats = [
    { value: connections.length, label: 'Connections', color: 'text-[#c4956a]' },
    { value: connections.reduce((sum, c) => sum + c.sharedTags, 0), label: 'Shared Themes', color: 'text-white' },
    { value: connections.reduce((sum, c) => sum + c.sharedCoordination, 0), label: 'Shared Signals', color: 'text-orange-400' },
    { value: totalArtifacts, label: 'My Artifacts', color: 'text-[#a6ed2a]' },
  ]

  const semanticStats = [
    { value: tagClusters.length, label: 'Clusters', color: 'text-cyan-400' },
    { value: tagClusters.reduce((sum, c) => sum + c.artifacts.length, 0), label: 'Clustered Nodes', color: 'text-white' },
    { value: tagClusters.filter(c => c.coordinationCount > 0).length, label: 'Active Clusters', color: 'text-orange-400' },
    { value: totalCoordSignals, label: 'Total Signals', color: 'text-[#a6ed2a]' },
  ]

  const currentStats = viewMode === 'chain' ? chainStats : viewMode === 'social' ? socialStats : semanticStats

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Activity</h1>
          <p className="text-gray-400 text-sm">
            {session 
              ? viewMode === 'chain' ? 'Your contributions and their chain of extracted knowledge.'
                : viewMode === 'social' ? 'Your connections through shared themes and coordination.'
                : 'Your artifacts organized by conceptual neighborhoods.'
              : 'All contributions across the commons.'}
          </p>
        </div>
        <Link to="/contribute" className="bg-[#a6ed2a] text-[#080c16] hover:bg-[#b8f247] px-4 py-2 rounded-lg text-sm transition-colors inline-flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Contribute
        </Link>
      </div>

      {/* View selector */}
      <div className="flex gap-2 mb-4">
        {([
          { mode: 'chain' as const, label: 'Chain', icon: Link2 },
          { mode: 'social' as const, label: 'Social', icon: Users },
          { mode: 'semantic' as const, label: 'Semantic', icon: Sparkles },
        ]).map(({ mode, label, icon: Icon }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition-colors ${
              viewMode === mode
                ? 'bg-[#a6ed2a] text-[#080c16] font-medium'
                : 'bg-[#0a101d] border border-[#1d2839] text-gray-400 hover:text-white hover:border-gray-500'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Dynamic stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {currentStats.map((stat, i) => (
          <div key={i} className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-4 text-center">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* CS-22: My Signals summary */}
      {session && (mySignalsGiven > 0 || totalCoordSignals > 0) && (
        <div className="bg-[#0a101d] border border-orange-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">My Signals</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-orange-400">{mySignalsGiven}</div>
              <div className="text-xs text-gray-500">Given</div>
            </div>
            <div>
              <div className="text-xl font-bold text-orange-400">{totalCoordSignals}</div>
              <div className="text-xs text-gray-500">Received</div>
            </div>
            <div>
              <div className="text-xl font-bold text-orange-400">{signalReach}</div>
              <div className="text-xs text-gray-500">Reach</div>
            </div>
          </div>
        </div>
      )}

      {!session && (
        <div className="bg-[#0a101d] border border-[#a6ed2a]/30 rounded-lg p-4 mb-6 text-sm text-gray-400">
          <Link to="/auth" className="text-[#a6ed2a] hover:text-white font-medium">Sign in</Link> to see only your activity and track your contributions over time.
        </div>
      )}

      {/* Commitments (always visible if any exist) */}
      {commitments.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" />
            Commitments
          </h2>
          <div className="space-y-2">
            {commitments.map(c => (
              <div key={c.id} className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-white">{c.description}</p>
                    {c.due_date && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        Due: {new Date(c.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                    c.status === 'fulfilled' ? 'bg-green-900/30 text-green-300' :
                    c.status === 'in_progress' ? 'bg-blue-900/30 text-blue-300' :
                    c.status === 'broken' ? 'bg-red-900/30 text-red-300' :
                    'bg-gray-800 text-gray-400'
                  }`}>
                    {c.status === 'in_progress' ? 'In Progress' : c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== CHAIN VIEW ===== */}
      {viewMode === 'chain' && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider flex items-center gap-2">
            <Link2 className="w-4 h-4 text-[#a6ed2a]" />
            Chain Timeline
          </h2>
          {contributions.length === 0 ? (
            <div className="bg-[#0a101d] border border-[#1d2839] rounded-xl p-8 text-center">
              <FileText className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No contributions yet</p>
              <p className="text-sm text-gray-500 mt-1 mb-4">Share an observation, idea, or commitment to start your chain.</p>
              <Link to="/contribute" className="inline-block bg-[#a6ed2a] text-[#080c16] px-6 py-2 rounded-lg hover:bg-[#b8f247] text-sm">
                Make your first contribution
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {contributions.map(c => {
                const status = statusConfig[c.status] || statusConfig.pending
                const extraction = c.extraction || {}
                const artifactCount = extraction.artifacts?.length || 0
                const relationshipCount = extraction.relationships?.length || 0
                const isExpanded = expandedContrib === c.id
                const coordCount = contribCoordCounts[c.id] || 0
                
                return (
                  <div key={c.id} className="bg-[#0a101d] border border-[#1d2839] rounded-lg overflow-hidden">
                    <div
                      onClick={() => c.status === 'complete' ? toggleContrib(c.id) : undefined}
                      className={`w-full text-left p-4 ${c.status === 'complete' ? 'cursor-pointer hover:bg-[#111827]' : ''} transition-colors`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {c.seq && (
                            <span className="text-xs font-mono text-[#a6ed2a] bg-[#a6ed2a]/10 px-1.5 py-0.5 rounded">
                              #{c.seq}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                            {status.label}
                          </span>
                          {c.status === 'complete' && artifactCount > 0 && (
                            <span className="text-xs text-gray-500">
                              <span className="text-[#a6ed2a] font-mono font-medium">{artifactCount}</span> {artifactCount === 1 ? 'node' : 'nodes'}
                              {relationshipCount > 0 && (
                                <> · <span className="text-[#a6ed2a] font-mono font-medium">{relationshipCount}</span> {relationshipCount === 1 ? 'edge' : 'edges'}</>
                              )}
                            </span>
                          )}
                          {coordCount > 0 && (
                            <span className="flex items-center gap-1 text-xs text-orange-400">
                              <Flame className="w-3 h-3" /> {coordCount}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {c.chain_hash && (
                            <span className="text-xs font-mono text-gray-600">{c.chain_hash.slice(0, 8)}</span>
                          )}
                          <span className="text-xs text-gray-600">{timeAgo(c.created_at)}</span>
                          {c.status === 'complete' && (
                            isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                      </div>
                      {c.title && <p className="text-sm font-medium text-white mb-1">{c.title}</p>}
                      <p className={`text-xs text-gray-400 ${isExpanded ? '' : 'line-clamp-2'}`}>{c.content}</p>
                      {c.status === 'complete' && (
                        <Link to={`/contribution/${c.id}`} className="text-xs text-[#a6ed2a] hover:text-white mt-2 inline-block" onClick={e => e.stopPropagation()}>
                          View full detail
                        </Link>
                      )}
                    </div>

                    {isExpanded && c.status === 'complete' && (
                      <div className="border-t border-[#1d2839] p-4 bg-[#060a14]">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Extracted Artifacts</div>
                        {contribArtifacts[c.id] ? (
                          contribArtifacts[c.id].length > 0 ? (
                            <div className="space-y-2">
                              {contribArtifacts[c.id].map(a => (
                                <Link key={a.id} to={`/artifact/${a.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#0a101d] transition-colors">
                                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: ARTIFACT_COLORS[a.type] }} />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-white truncate">{a.title}</div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-xs text-gray-500">{a.type.charAt(0).toUpperCase() + a.type.slice(1)}</span>
                                      {a.rea_role && <span className="text-xs" style={{ color: REA_COLORS[a.rea_role] }}>{REA_LABELS[a.rea_role]}</span>}
                                    </div>
                                  </div>
                                  {coordCounts[a.id] > 0 && (
                                    <span className="flex items-center gap-1 text-xs text-orange-400">
                                      <Flame className="w-3 h-3" /> {coordCounts[a.id]}
                                    </span>
                                  )}
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500">No artifacts extracted.</p>
                          )
                        ) : (
                          <p className="text-xs text-gray-500 animate-pulse">Loading...</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* ===== SOCIAL VIEW ===== */}
      {viewMode === 'social' && (
        <section className="mb-8">
          {/* My node */}
          {participantName && (
            <div className="bg-[#0a101d] border border-[#c4956a]/40 rounded-xl p-5 mb-4 text-center">
              <div className="w-14 h-14 rounded-full bg-[#c4956a] flex items-center justify-center text-[#080c16] text-xl font-bold mx-auto mb-2">
                {participantName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="font-semibold text-white">{participantName}</div>
              <div className="text-xs text-gray-500 mt-1">{totalArtifacts} artifacts · {connections.length} connections</div>
            </div>
          )}

          <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-[#c4956a]" />
            Connections
          </h2>
          {connections.length === 0 ? (
            <div className="bg-[#0a101d] border border-[#1d2839] rounded-xl p-8 text-center">
              <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No connections yet</p>
              <p className="text-sm text-gray-500 mt-1">As others contribute, shared themes will reveal your connections.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {connections.map(conn => (
                <Link
                  key={conn.id}
                  to={`/p/${conn.id}`}
                  className="flex items-center gap-4 bg-[#0a101d] border border-[#1d2839] rounded-lg p-4 hover:border-[#c4956a] transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[#c4956a]/30 flex items-center justify-center text-[#c4956a] text-sm font-bold flex-shrink-0">
                    {conn.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white">{conn.name}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{conn.sharedTags} shared {conn.sharedTags === 1 ? 'theme' : 'themes'}</span>
                      {conn.sharedCoordination > 0 && (
                        <span className="flex items-center gap-1 text-orange-400">
                          <Flame className="w-3 h-3" /> {conn.sharedCoordination} mutual signals
                        </span>
                      )}
                    </div>
                    {conn.sharedArtifactTitles.length > 0 && (
                      <div className="text-xs text-gray-600 mt-1 truncate">
                        via: {conn.sharedArtifactTitles.join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-8 h-1.5 rounded-full bg-[#1d2839] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#c4956a]"
                        style={{ width: `${Math.min(100, (conn.sharedTags + conn.sharedCoordination * 2) * 20)}%` }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* My artifacts in social context */}
          {artifacts.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-gray-300 mb-3 mt-6 uppercase tracking-wider flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-blue-400" />
                My Artifacts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {artifacts.map(a => (
                  <Link key={a.id} to={`/artifact/${a.id}`} className="flex items-center gap-3 bg-[#0a101d] border border-[#1d2839] rounded-lg p-3 hover:border-[#a6ed2a] transition-colors">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: ARTIFACT_COLORS[a.type] }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{a.title}</div>
                      <div className="text-xs text-gray-500">{a.type.charAt(0).toUpperCase() + a.type.slice(1)}</div>
                    </div>
                    {coordCounts[a.id] > 0 && (
                      <span className="flex items-center gap-1 text-xs text-orange-400 flex-shrink-0">
                        <Flame className="w-3 h-3" /> {coordCounts[a.id]}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* ===== SEMANTIC VIEW ===== */}
      {viewMode === 'semantic' && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Conceptual Neighborhoods
          </h2>
          {tagClusters.length === 0 ? (
            <div className="bg-[#0a101d] border border-[#1d2839] rounded-xl p-8 text-center">
              <Sparkles className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No clusters yet</p>
              <p className="text-sm text-gray-500 mt-1">As your contributions are tagged, conceptual neighborhoods will emerge.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tagClusters.map(cluster => (
                <div key={cluster.tag} className="bg-[#0a101d] border border-[#1d2839] rounded-lg overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-medium text-cyan-400">{cluster.tag}</span>
                        <span className="text-xs text-gray-500">{cluster.artifacts.length} {cluster.artifacts.length === 1 ? 'artifact' : 'artifacts'}</span>
                      </div>
                      {cluster.coordinationCount > 0 && (
                        <span className="flex items-center gap-1 text-xs text-orange-400">
                          <Flame className="w-3 h-3" /> {cluster.coordinationCount} signals
                        </span>
                      )}
                    </div>
                    {/* Heat bar */}
                    <div className="w-full h-1 rounded-full bg-[#1d2839] mb-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, cluster.coordinationCount * 15 + cluster.artifacts.length * 10)}%`,
                          background: cluster.coordinationCount > 0
                            ? `linear-gradient(90deg, #a6ed2a, #f59e0b)`
                            : '#a6ed2a40',
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      {cluster.artifacts.map(a => (
                        <Link key={a.id} to={`/artifact/${a.id}`} className="flex items-center gap-2 p-1.5 rounded hover:bg-[#1d2839]/50 transition-colors">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ARTIFACT_COLORS[a.type] }} />
                          <span className="text-sm text-gray-300 truncate">{a.title}</span>
                          {coordCounts[a.id] > 0 && (
                            <Flame className="w-3 h-3 text-orange-400 flex-shrink-0" />
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Unclustered artifacts */}
          {artifacts.filter(a => !tagClusters.some(c => c.artifacts.find(ca => ca.id === a.id))).length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-gray-300 mb-3 mt-6 uppercase tracking-wider">Unclustered</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {artifacts.filter(a => !tagClusters.some(c => c.artifacts.find(ca => ca.id === a.id))).map(a => (
                  <Link key={a.id} to={`/artifact/${a.id}`} className="flex items-center gap-3 bg-[#0a101d] border border-[#1d2839] rounded-lg p-3 hover:border-cyan-400/50 transition-colors">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: ARTIFACT_COLORS[a.type] }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{a.title}</div>
                      <div className="text-xs text-gray-500">{a.type.charAt(0).toUpperCase() + a.type.slice(1)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}
