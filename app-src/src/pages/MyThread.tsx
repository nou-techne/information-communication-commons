import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase, ARTIFACT_COLORS, STATE_LABELS, REA_COLORS, REA_LABELS } from '../lib/supabase'
import type { Artifact, Commitment } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { Plus, FileText, GitBranch, Target, Clock, ChevronDown, ChevronUp } from 'lucide-react'

interface Contribution {
  id: string
  content: string
  title: string | null
  status: string
  created_at: string
  processed_at: string | null
  extraction: any
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
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [expandedContrib, setExpandedContrib] = useState<string | null>(null)
  const [contribArtifacts, setContribArtifacts] = useState<Record<string, Artifact[]>>({})

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
      .select('id, content, title, status, created_at, processed_at, extraction')
      .order('created_at', { ascending: false })
      .limit(30)
    
    if (filterParticipantId) {
      query = query.eq('participant_id', filterParticipantId)
    }
    
    const { data } = await query
    setContributions(data || [])
  }

  async function loadParticipant(authId: string) {
    const { data: p } = await supabase.from('participants').select('id').eq('auth_user_id', authId).single()
    if (!p) return
    setParticipantId(p.id)

    const [{ data: arts }, { data: comms }] = await Promise.all([
      supabase.from('artifacts').select('*').or(`created_by.eq.${p.id},steward_id.eq.${p.id}`).order('created_at', { ascending: false }).limit(50),
      supabase.from('commitments').select('*').eq('participant_id', p.id).order('created_at', { ascending: false }),
    ])
    setArtifacts(arts || [])
    setCommitments(comms || [])
  }

  async function loadArtifactsForContribution(contribId: string) {
    if (contribArtifacts[contribId]) return // already loaded
    
    const { data } = await supabase
      .from('artifacts')
      .select('*')
      .eq('contribution_id', contribId)
      .order('created_at', { ascending: true })
    
    setContribArtifacts(prev => ({ ...prev, [contribId]: data || [] }))
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

  // Stats
  const totalContributions = contributions.length
  const completedContributions = contributions.filter(c => c.status === 'complete').length
  const totalArtifacts = artifacts.length
  const totalCommitments = commitments.length
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Activity</h1>
          <p className="text-gray-400 text-sm">
            {session 
              ? 'Your contributions, artifacts, and commitments in one place.'
              : 'All contributions across the commons.'}
          </p>
        </div>
        <Link to="/contribute" className="bg-[#c3fd50] text-[#0f0f0f] hover:bg-[#d4fe80] px-4 py-2 rounded-lg text-sm transition-colors inline-flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Contribute
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{totalContributions}</div>
          <div className="text-xs text-gray-500 mt-1">Contributions</div>
        </div>
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-[#c3fd50]">{totalArtifacts}</div>
          <div className="text-xs text-gray-500 mt-1">Artifacts Created</div>
        </div>
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{totalCommitments}</div>
          <div className="text-xs text-gray-500 mt-1">Commitments</div>
        </div>
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{completedContributions}</div>
          <div className="text-xs text-gray-500 mt-1">Processed</div>
        </div>
      </div>

      {!session && (
        <div className="bg-[#1a1a1a] border border-[#c3fd50]/30 rounded-lg p-4 mb-6 text-sm text-gray-400">
          <Link to="/auth" className="text-[#c3fd50] hover:text-white font-medium">Sign in</Link> to see only your activity and track your contributions over time.
        </div>
      )}

      {/* Commitments (prominent if any exist) */}
      {commitments.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" />
            Commitments
          </h2>
          <div className="space-y-2">
            {commitments.map(c => (
              <div key={c.id} className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-4">
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

      {/* Contributions timeline */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#c3fd50]" />
          Contributions
        </h2>
        {contributions.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-8 text-center">
            <FileText className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No contributions yet</p>
            <p className="text-sm text-gray-500 mt-1 mb-4">Share an observation, idea, or commitment and it will appear here.</p>
            <Link to="/contribute" className="inline-block bg-[#c3fd50] text-[#0f0f0f] px-6 py-2 rounded-lg hover:bg-[#d4fe80] text-sm">
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
              
              return (
                <div key={c.id} className="bg-[#1a1a1a] border border-[#262626] rounded-lg overflow-hidden">
                  <button
                    onClick={() => c.status === 'complete' ? toggleContrib(c.id) : undefined}
                    className={`w-full text-left p-4 ${c.status === 'complete' ? 'cursor-pointer hover:bg-[#222]' : ''} transition-colors`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          c.status === 'complete' ? 'bg-[#c3fd50]' :
                          c.status === 'processing' ? 'bg-blue-400 animate-pulse' :
                          c.status === 'error' ? 'bg-red-400' : 'bg-yellow-400'
                        }`} />
                        <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                        {c.status === 'complete' && artifactCount > 0 && (
                          <span className="text-xs text-gray-500">
                            <span className="text-[#c3fd50] font-mono font-medium">{artifactCount}</span> {artifactCount === 1 ? 'node' : 'nodes'}
                            {relationshipCount > 0 && (
                              <> · <span className="text-[#c3fd50] font-mono font-medium">{relationshipCount}</span> {relationshipCount === 1 ? 'edge' : 'edges'}</>
                            )}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">{timeAgo(c.created_at)}</span>
                        {c.status === 'complete' && (
                          isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                    </div>
                    {c.title && (
                      <p className="text-sm font-medium text-white mb-1">{c.title}</p>
                    )}
                    <p className={`text-xs text-gray-400 ${isExpanded ? '' : 'line-clamp-2'}`}>{c.content}</p>
                  </button>

                  {/* Expanded: show extracted artifacts */}
                  {isExpanded && c.status === 'complete' && (
                    <div className="border-t border-[#262626] p-4 bg-[#151515]">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Extracted Artifacts</div>
                      {contribArtifacts[c.id] ? (
                        contribArtifacts[c.id].length > 0 ? (
                          <div className="space-y-2">
                            {contribArtifacts[c.id].map(a => (
                              <Link
                                key={a.id}
                                to={`/artifact/${a.id}`}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
                              >
                                <span
                                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: ARTIFACT_COLORS[a.type] }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-white truncate">{a.title}</div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-gray-500">{a.type.charAt(0).toUpperCase() + a.type.slice(1)}</span>
                                    {a.rea_role && (
                                      <span className="text-xs" style={{ color: REA_COLORS[a.rea_role] }}>
                                        {REA_LABELS[a.rea_role]}
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-600">{STATE_LABELS[a.state]}</span>
                                  </div>
                                </div>
                                {a.summary && (
                                  <p className="hidden sm:block text-xs text-gray-500 max-w-[200px] truncate">{a.summary}</p>
                                )}
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">No artifacts extracted from this contribution.</p>
                        )
                      ) : (
                        <p className="text-xs text-gray-500 animate-pulse">Loading artifacts...</p>
                      )}
                      
                      {/* Show e/H-LAM/T tags if present */}
                      {extraction.hlamt_tags && extraction.hlamt_tags.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#262626]">
                          <div className="text-xs text-gray-500 mb-1.5">Dimensions</div>
                          <div className="flex flex-wrap gap-1.5">
                            {extraction.hlamt_tags.map((tag: string, i: number) => (
                              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[#c3fd50]/10 text-[#c3fd50] font-mono">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Artifacts grid (if signed in) */}
      {artifacts.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-blue-400" />
            All My Artifacts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {artifacts.map(a => (
              <Link
                key={a.id}
                to={`/artifact/${a.id}`}
                className="flex items-center gap-3 bg-[#1a1a1a] border border-[#262626] rounded-lg p-3 hover:border-[#c3fd50] transition-colors"
              >
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: ARTIFACT_COLORS[a.type] }} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{a.title}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{a.type.charAt(0).toUpperCase() + a.type.slice(1)}</span>
                    {a.rea_role && (
                      <span style={{ color: REA_COLORS[a.rea_role] }}>{REA_LABELS[a.rea_role]}</span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-600 flex-shrink-0">{STATE_LABELS[a.state]}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
