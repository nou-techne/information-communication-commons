import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Zap, Check, Clock } from 'lucide-react'
import { ExtractionProgress } from '../components/ExtractionProgress'
import { useConvergence } from '../contexts/ConvergenceContext'

interface Session {
  id: string
  title: string
  time_start: string | null
}

type ProcessingState = 'idle' | 'submitting' | 'extracting' | 'done' | 'error'

interface CreatedArtifact {
  id: string
  title: string
  type: string
}

const HLAMT_LABELS: Record<string, { label: string; desc: string }> = {
  e: { label: 'Ecology', desc: 'Environmental context, place, watershed, seasonal patterns' },
  H: { label: 'Human', desc: 'People, capabilities, relationships, lived experience' },
  L: { label: 'Language', desc: 'Shared vocabulary, frameworks, definitions' },
  A: { label: 'Artifacts', desc: 'Tools, documents, code, physical objects, infrastructure' },
  M: { label: 'Methodology', desc: 'Processes, workflows, practices, coordination patterns' },
  T: { label: 'Training', desc: 'Learning, skill development, transformation, practice' },
}

const CONVERGENCE_ID = '00000000-0000-0000-0000-000000000100'

export function Contribute() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { convergence } = useConvergence()
  
  // Gate: check if convergence is open or user is steward
  const opensAt = convergence.opens_at ? new Date(convergence.opens_at).getTime() : 0
  const [isOpen, setIsOpen] = useState(opensAt <= Date.now())
  const [isSteward, setIsSteward] = useState(false)
  const [countdown, setCountdown] = useState('')
  
  useEffect(() => {
    // Check steward status
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && convergence.steward_ids?.includes(data.session.user.id)) {
        setIsSteward(true)
      }
    })
  }, [convergence.steward_ids])

  useEffect(() => {
    if (!convergence.opens_at) { setIsOpen(true); return }
    function tick() {
      const diff = opensAt - Date.now()
      if (diff <= 0) { setIsOpen(true); setCountdown(''); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setCountdown(`${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [convergence.opens_at])
  const [text, setText] = useState('')
  const [state, setState] = useState<ProcessingState>('idle')
  const [extractionStartedAt, setExtractionStartedAt] = useState<number>(Date.now())
  const [error, setError] = useState('')
  const [contributionId, setContributionId] = useState<string | null>(null)
  const [artifactCount, setArtifactCount] = useState(0)
  const [createdArtifacts, setCreatedArtifacts] = useState<CreatedArtifact[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionId, setSessionId] = useState<string>('')

  // Load sessions and pre-select from query param
  useEffect(() => {
    loadSessions()
    const preselectedSession = searchParams.get('session')
    if (preselectedSession) {
      setSessionId(preselectedSession)
    }
  }, [searchParams])

  async function loadSessions() {
    const { data } = await supabase
      .from('sessions')
      .select('id, title, time_start')
      .eq('convergence_id', CONVERGENCE_ID)
      .order('time_start', { ascending: true, nullsFirst: false })
    
    if (data) setSessions(data)
  }

  // Real-time subscription to contribution status
  useEffect(() => {
    if (!contributionId) return

    const channel = supabase.channel(`contribution-${contributionId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'contributions',
        filter: `id=eq.${contributionId}`
      }, async (payload) => {
        const status = payload.new.status
        
        if (status === 'processing') {
          setExtractionStartedAt(Date.now())
          setState('extracting')
        } else if (status === 'complete') {
          // Fetch created artifacts from extraction
          const extraction = payload.new.extraction
          if (extraction?.artifacts) {
            setArtifactCount(extraction.artifacts.length)
            
            // Fetch full artifact records by title
            const titles = extraction.artifacts.map((a: any) => a.title)
            const { data: artifacts } = await supabase
              .from('artifacts')
              .select('id, title, type')
              .in('title', titles)
              .order('created_at', { ascending: false })
              .limit(10)
            
            setCreatedArtifacts(artifacts || [])
          }
          setState('done')
        } else if (status === 'error') {
          setError('Extraction failed. Please try again.')
          setState('error')
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [contributionId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return

    setState('submitting')
    setError('')

    try {
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      let participantId = null

      // If user is authenticated, link contribution to their participant record
      if (user) {
        // Look up participant by auth_user_id
        const { data: participant, error: lookupError } = await supabase
          .from('participants')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        if (lookupError) throw lookupError

        if (participant) {
          participantId = participant.id
        } else {
          // Create participant record if it doesn't exist
          const { data: newParticipant, error: createError } = await supabase
            .from('participants')
            .insert({
              auth_user_id: user.id,
              name: user.email?.split('@')[0] || 'Anonymous',
              email: user.email,
            })
            .select('id')
            .single()

          if (createError) throw createError
          participantId = newParticipant.id
        }
      }

      // Insert contribution with optional participant_id and session_id
      const { data: newContribution, error: insertError } = await supabase
        .from('contributions')
        .insert({
          content: text,
          convergence_id: CONVERGENCE_ID,
          participant_id: participantId,
          session_id: sessionId || null,
          status: 'pending',
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      // Save contribution ID and transition to extracting state
      setContributionId(newContribution.id)
      setExtractionStartedAt(Date.now())
      setState('extracting')
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
      setState('error')
    }
  }

  if (state === 'extracting') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-[#1d2839] flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Zap className="w-8 h-8 text-[#a6ed2a]" />
          </div>
          <h2 className="text-xl font-bold mb-3">Extracting knowledge...</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            AI is analyzing your contribution, identifying artifacts, tagging by dimension, and linking to the knowledge graph.
          </p>
          <div className="mt-6">
            <ExtractionProgress startedAt={extractionStartedAt} />
          </div>
        </div>
      </div>
    )
  }

  if (state === 'done') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-[#a6ed2a] flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-[#080c16]" strokeWidth={3} />
          </div>
          <h2 className="text-xl font-bold mb-3">Done! {artifactCount} {artifactCount === 1 ? 'artifact' : 'artifacts'} created</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Your contribution has been processed and added to the knowledge graph.
          </p>

          {createdArtifacts.length > 0 && (
            <div className="mb-8 max-w-md mx-auto">
              <p className="text-sm text-gray-500 mb-3">Extracted artifacts:</p>
              <div className="space-y-2">
                {createdArtifacts.map(artifact => (
                  <Link
                    key={artifact.id}
                    to={`/artifact/${artifact.id}`}
                    className="block bg-[#0a101d] border border-[#1d2839] rounded-lg p-3 hover:border-[#a6ed2a] transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#1d2839] text-gray-400">{artifact.type}</span>
                      <span className="text-sm text-gray-300">{artifact.title}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => { setState('idle'); setText(''); setContributionId(null); setCreatedArtifacts([]); setArtifactCount(0); }}
              className="px-6 py-2.5 bg-[#1d2839] text-white rounded-lg hover:bg-[#283347] transition-colors text-sm"
            >
              Contribute more
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 bg-[#a6ed2a] text-[#080c16] rounded-lg hover:bg-[#b8f247] transition-colors text-sm"
            >
              Explore
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!isOpen && !isSteward) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <Clock className="w-16 h-16 text-blue-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-3">Knowledge Graph Opening Soon</h1>
        <p className="text-gray-400 mb-6">
          The {convergence.name} knowledge graph opens when the convergence begins.
          Contributions will be accepted once the chain is live.
        </p>
        <div className="inline-flex items-center gap-2 bg-[#0a101d] border border-blue-500/30 rounded-xl px-8 py-4">
          <div className="text-3xl font-mono font-bold text-white">{countdown}</div>
        </div>
        <p className="text-gray-600 text-xs mt-6">
          {convergence.opens_at && new Date(convergence.opens_at).toLocaleString(undefined, { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl font-bold">Contribute</h1>
        {isSteward && !isOpen && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-900/30 border border-amber-700/30 text-amber-400">Steward Access</span>
        )}
      </div>
      <p className="text-gray-400 text-sm mb-2">
        Share what you observed, learned, or committed to. Write naturally — AI extracts the structure.
      </p>
      <p className="text-gray-500 text-xs mb-4">
        First time? <a href="/app/welcome" className="text-[#a6ed2a] hover:underline">See how it works</a>
      </p>

      <details
        className="mb-6 bg-[#0a101d] border border-[#1d2839] rounded-lg overflow-hidden"
        open={typeof window !== 'undefined' ? localStorage.getItem('hlamt-open') !== 'false' : true}
        onToggle={(e: any) => localStorage.setItem('hlamt-open', String(e.target.open))}
      >
        <summary className="px-4 py-3 text-base font-medium text-white cursor-pointer hover:bg-[#1d2839] transition-colors flex items-center justify-between list-none [&::-webkit-details-marker]:hidden">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400 transition-transform duration-200 hlamt-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            <span>What is e/H-LAM/T?</span>
          </div>
          <span className="text-xs text-gray-500 ml-2">AI classifies every contribution across these six dimensions</span>
        </summary>
        <div className="px-4 pb-4 pt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(HLAMT_LABELS).map(([key, { label, desc }]) => (
            <div key={key} className="bg-[#080c16] border border-[#1d2839] rounded-lg p-3">
              <div className="text-sm font-mono text-[#a6ed2a] mb-1 font-bold">{key}/</div>
              <div className="text-sm font-medium text-white mb-1">{label}</div>
              <div className="text-xs text-gray-400 leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </details>

      <form onSubmit={handleSubmit} className="space-y-4">
        {sessions.length > 0 && (
          <div>
            <label htmlFor="session-select" className="block text-sm font-medium text-gray-300 mb-2">
              Session (optional)
            </label>
            <select
              id="session-select"
              value={sessionId}
              onChange={e => setSessionId(e.target.value)}
              className="w-full bg-[#0a101d] border border-[#1d2839] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a6ed2a]"
            >
              <option value="">No session</option>
              {sessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.title}
                  {s.time_start && ` — ${new Date(s.time_start).toLocaleDateString()}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="contribution-text" className="sr-only">Your contribution</label>
          <textarea
            id="contribution-text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="What happened? What did you learn? What are you going to do about it?&#10;&#10;Write about a session you just attended, an idea someone sparked, a commitment you're making, or a pattern you're noticing across conversations.&#10;&#10;A paragraph or two is ideal. Name people and projects when you can — it helps build the graph."
            rows={12}
            required
            className="w-full bg-[#0a101d] border border-[#1d2839] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#a6ed2a] resize-y leading-relaxed text-base"
          />
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 mt-2">
            <span className="text-xs text-gray-600">
              AI classifies contribution type, extracts artifacts, and records relationships automatically.
            </span>
            <span className="text-xs text-gray-500">{text.length} chars</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-900/20 border border-red-800/30 rounded-lg text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={state === 'submitting' || !text.trim()}
          className="w-full bg-[#a6ed2a] text-[#080c16] hover:bg-[#b8f247] py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {state === 'submitting' ? 'Saving...' : 'Submit to the Commons'}
        </button>
      </form>

    </div>
  )
}
