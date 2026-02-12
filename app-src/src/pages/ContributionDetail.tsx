import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, ARTIFACT_COLORS, REA_COLORS, REA_LABELS, AGENT_TYPE_COLORS, AGENT_TYPE_LABELS } from '../lib/supabase'
import type { Artifact } from '../lib/supabase'
import { ChevronRight, Clock, User, Loader2, MessageCircle, Send } from 'lucide-react'

interface Contribution {
  id: string
  content: string
  status: string
  participant_id: string | null
  extraction: any
  created_at: string
  processed_at: string | null
  errors: any
}

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

export function ContributionDetail() {
  const { id } = useParams<{ id: string }>()
  const [contribution, setContribution] = useState<Contribution | null>(null)
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [dimCounts, setDimCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [participantName, setParticipantName] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [thread, setThread] = useState<any[]>([])
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    if (id) loadContribution(id)
    
    // Check auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
  }, [id])

  async function loadContribution(contribId: string) {
    setLoading(true)

    // Fetch contribution
    const { data: contrib } = await supabase
      .from('contributions')
      .select('*')
      .eq('id', contribId)
      .single()

    if (!contrib) {
      setLoading(false)
      return
    }

    setContribution(contrib as Contribution)

    // Fetch participant name
    if (contrib.participant_id) {
      const { data: participant } = await supabase
        .from('participants')
        .select('name')
        .eq('id', contrib.participant_id)
        .single()
      if (participant) setParticipantName(participant.name)
    }

    // Find artifacts extracted from this contribution
    // Match by titles in extraction JSON and creation time near processed_at
    const extractedArtifacts: Artifact[] = []
    if (contrib.extraction?.artifacts && contrib.processed_at) {
      const titles = (contrib.extraction.artifacts as any[]).map((a: any) => a.title).filter(Boolean)
      if (titles.length > 0) {
        const { data: arts } = await supabase
          .from('artifacts')
          .select('*')
          .in('title', titles)
          .order('created_at', { ascending: false })
        if (arts) extractedArtifacts.push(...(arts as Artifact[]))
      }
    }

    setArtifacts(extractedArtifacts)

    // Count dimensions from extracted artifacts' tags
    if (extractedArtifacts.length > 0) {
      const artifactIds = extractedArtifacts.map(a => a.id)
      const { data: tags } = await supabase
        .from('artifact_tags')
        .select('tag_id, tags(name)')
        .in('artifact_id', artifactIds)

      const counts: Record<string, number> = {}
      if (tags) {
        for (const t of tags) {
          const tagName = (t as any).tags?.name
          if (tagName?.startsWith('hlamt:')) {
            counts[tagName] = (counts[tagName] || 0) + 1
          }
        }
      }

      // Also count agents for H/ dimension
      const agentCount = extractedArtifacts.filter(a => a.rea_role === 'agent').length
      if (agentCount > 0) {
        counts['hlamt:H'] = (counts['hlamt:H'] || 0) + agentCount
      }

      setDimCounts(counts)
    }

    // Load thread (replies)
    const { data: threadData } = await supabase.rpc('get_contribution_thread', { p_contribution_id: contribId })
    if (threadData && threadData.length > 1) {
      setThread(threadData.slice(1)) // Skip root contribution
    }

    setLoading(false)
  }

  async function submitReply(e: React.FormEvent) {
    e.preventDefault()
    if (!replyContent.trim() || !session) return

    setSubmitting(true)
    try {
      const { data: participant } = await supabase
        .from('participants')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .single()

      const { error } = await supabase.from('contributions').insert({
        content: replyContent.trim(),
        participant_id: participant?.id,
        parent_contribution_id: id,
        convergence_id: contribution?.extraction?.convergence_id || null,
        status: 'pending'
      })

      if (error) throw error

      setReplyContent('')
      setShowReplyForm(false)
      
      // Reload contribution to show new reply
      if (id) await loadContribution(id)
    } catch (err) {
      console.error('Reply submit error:', err)
      alert('Failed to submit reply. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 text-gray-500 mx-auto animate-spin" />
      </div>
    )
  }

  if (!contribution) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Contribution not found</p>
        <Link to="/" className="text-[#c3fd50] hover:text-white text-sm mt-2 inline-block">Back to Explore</Link>
      </div>
    )
  }

  const hasExtractions = artifacts.length > 0

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm mb-6">
        <Link to="/" className="text-gray-400 hover:text-white transition-colors">Explore</Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
        <span className="text-gray-400">Live Activity</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
        <span className="text-white">Contribution</span>
      </nav>

      {/* Contribution header */}
      <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className={`w-2.5 h-2.5 rounded-full ${
            contribution.status === 'complete' ? 'bg-[#c3fd50]' :
            contribution.status === 'processing' ? 'bg-blue-400 animate-pulse' :
            contribution.status === 'error' ? 'bg-red-400' : 'bg-yellow-400'
          }`} />
          <span className="text-sm text-gray-400 capitalize">{contribution.status}</span>
          <span className="text-gray-600">|</span>
          <Clock className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-sm text-gray-400">{timeAgo(contribution.created_at)}</span>
          {participantName && (
            <>
              <span className="text-gray-600">|</span>
              <User className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-sm text-gray-400">{participantName}</span>
            </>
          )}
        </div>
        <div className="text-gray-200 whitespace-pre-wrap leading-relaxed">
          {contribution.content.length > 300 && !expanded ? (
            <>
              {contribution.content.slice(0, 300).trimEnd()}...
              <button
                onClick={() => setExpanded(true)}
                className="ml-2 text-[#c3fd50] hover:text-white text-sm font-medium"
              >
                View more
              </button>
            </>
          ) : (
            <>
              {contribution.content}
              {contribution.content.length > 300 && (
                <button
                  onClick={() => setExpanded(false)}
                  className="ml-2 text-[#c3fd50] hover:text-white text-sm font-medium"
                >
                  Show less
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Dimension cards for this contribution */}
      {hasExtractions && (
        <>
          <h2 className="text-lg font-semibold mb-3">Observation Dimensions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-6">
            {DIMENSIONS.map(d => {
              const count = dimCounts[d.tag] ?? 0
              const Wrapper = count > 0 ? Link : 'div' as any
              const wrapperProps = count > 0 ? { to: `/dimension/${d.key}` } : {}
              return (
                <Wrapper
                  key={d.key}
                  {...wrapperProps}
                  className={`rounded-lg border border-[#262626] bg-[#1a1a1a] p-3 sm:p-4 text-center block transition-all ${
                    count > 0 ? 'border-opacity-100 hover:scale-105 hover:shadow-lg cursor-pointer' : 'opacity-40'
                  }`}
                  style={count > 0 ? { borderColor: d.color + '40' } : undefined}
                >
                  <div className="text-xs font-medium mb-1 truncate" style={{ color: d.color }}>{d.name}</div>
                  <div className="flex items-baseline justify-center gap-1 sm:gap-1.5">
                    <span className="font-mono text-xl sm:text-2xl font-bold" style={{ color: d.color }}>{d.letter}</span>
                    <span className="text-xl sm:text-2xl font-bold text-white">{count}</span>
                  </div>
                  <span className="text-xs text-gray-400 block truncate">{d.desc}</span>
                </Wrapper>
              )
            })}
          </div>
        </>
      )}

      {/* Extracted artifacts */}
      {hasExtractions && (
        <>
          <h2 className="text-lg font-semibold mb-3">Extracted Artifacts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {artifacts.map(a => (
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
                </div>
                <h3 className="font-semibold text-white group-hover:text-[#c3fd50] transition-colors mb-1 text-sm">
                  {a.title}
                </h3>
                {a.summary && (
                  <p className="text-xs text-gray-400 line-clamp-2">{a.summary}</p>
                )}
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Processing state */}
      {contribution.status === 'processing' && (
        <div className="bg-[#1a1a1a] border border-blue-500/20 rounded-lg p-6 text-center">
          <Loader2 className="w-8 h-8 text-blue-400 mx-auto mb-3 animate-spin" />
          <p className="text-gray-300">Extracting knowledge from this contribution...</p>
          <p className="text-sm text-gray-500 mt-1">Artifacts will appear here when processing completes.</p>
        </div>
      )}

      {/* Error state */}
      {contribution.status === 'error' && (
        <div className="bg-[#1a1a1a] border border-red-500/20 rounded-lg p-6">
          <p className="text-red-400 mb-2">Extraction failed</p>
          {contribution.errors && (
            <pre className="text-xs text-gray-500 overflow-x-auto">{JSON.stringify(contribution.errors, null, 2)}</pre>
          )}
        </div>
      )}

      {/* Pending state */}
      {contribution.status === 'pending' && (
        <div className="bg-[#1a1a1a] border border-yellow-500/20 rounded-lg p-6 text-center">
          <p className="text-yellow-400">Waiting to be processed...</p>
        </div>
      )}

      {/* Thread (Replies) */}
      {thread.length > 0 && (
        <div className="mt-6 border-t border-[#262626] pt-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#c3fd50]" />
            {thread.length} {thread.length === 1 ? 'Reply' : 'Replies'}
          </h2>
          <div className="space-y-3">
            {thread.map((reply: any) => (
              <div key={reply.id} className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-4" style={{ marginLeft: `${reply.depth * 20}px` }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <User className="w-4 h-4" />
                    <span>{reply.participant_name || 'Anonymous'}</span>
                    <span className="text-gray-600">·</span>
                    <span>{timeAgo(reply.created_at)}</span>
                  </div>
                  {reply.status === 'processing' && (
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  )}
                </div>
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{reply.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reply Form */}
      <div className="mt-6 border-t border-[#262626] pt-6">
        {!showReplyForm ? (
          <button
            onClick={() => setShowReplyForm(true)}
            disabled={!session}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#262626] rounded-lg hover:border-[#c3fd50] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MessageCircle className="w-4 h-4" />
            {session ? 'Reply to this contribution' : 'Sign in to reply'}
          </button>
        ) : (
          <form onSubmit={submitReply} className="space-y-3">
            <textarea
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              placeholder="Share your thoughts, questions, or build on this contribution..."
              rows={4}
              autoFocus
              className="w-full bg-[#0f0f0f] border border-[#333333] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#c3fd50] transition-colors resize-none"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!replyContent.trim() || submitting}
                className="flex items-center gap-2 px-4 py-2 bg-[#c3fd50] text-[#0f0f0f] font-medium rounded-lg hover:bg-[#d4fe80] transition-colors disabled:opacity-50 text-sm"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? 'Submitting...' : 'Submit Reply'}
              </button>
              <button
                type="button"
                onClick={() => { setShowReplyForm(false); setReplyContent('') }}
                className="px-4 py-2 bg-[#262626] text-white rounded-lg hover:bg-[#333333] transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
