import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Zap, Check, Plus, Compass, ArrowRight, AlertCircle } from 'lucide-react'

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
  const [text, setText] = useState('')
  const [state, setState] = useState<ProcessingState>('idle')
  const [error, setError] = useState('')
  const [contributionId, setContributionId] = useState<string | null>(null)
  const [artifactCount, setArtifactCount] = useState(0)
  const [createdArtifacts, setCreatedArtifacts] = useState<CreatedArtifact[]>([])

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

      // Insert contribution with optional participant_id
      const { data: newContribution, error: insertError } = await supabase
        .from('contributions')
        .insert({
          content: text,
          convergence_id: CONVERGENCE_ID,
          participant_id: participantId,
          status: 'pending',
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      // Save contribution ID and transition to extracting state
      setContributionId(newContribution.id)
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
          <div className="w-16 h-16 rounded-full bg-[#262626] flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Zap className="w-8 h-8 text-[#c3fd50]" />
          </div>
          <h2 className="text-xl font-bold mb-3">Extracting knowledge...</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            AI is analyzing your contribution, identifying artifacts, tagging by dimension, and linking to the knowledge graph.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#c3fd50] animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-[#c3fd50] animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-[#c3fd50] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  if (state === 'done') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-[#c3fd50] flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-[#0f0f0f]" strokeWidth={3} />
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
                    className="block bg-[#1a1a1a] border border-[#262626] rounded-lg p-3 hover:border-[#c3fd50] transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#262626] text-gray-400">{artifact.type}</span>
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
              className="px-6 py-2.5 bg-[#262626] text-white rounded-lg hover:bg-[#333333] transition-colors text-sm"
            >
              Contribute more
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 bg-[#c3fd50] text-[#0f0f0f] rounded-lg hover:bg-[#d4fe80] transition-colors text-sm"
            >
              Explore
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Contribute</h1>
      <p className="text-gray-400 text-sm mb-6">
        Share what you observed, learned, built, or committed to. Write naturally — AI will figure out the rest.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="What's on your mind? Session notes, an idea, a commitment, a reflection — just write. The AI will identify what kind of contribution this is, extract the key concepts, classify by e/H-LAM/T dimension, and connect it to the knowledge graph."
            rows={12}
            required
            className="w-full bg-[#1a1a1a] border border-[#262626] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#c3fd50] resize-y leading-relaxed text-base"
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
          className="w-full bg-[#c3fd50] text-[#0f0f0f] hover:bg-[#d4fe80] py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {state === 'submitting' ? 'Saving...' : 'Submit to the Commons'}
        </button>
      </form>

      <details className="mt-8">
        <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-300 transition-colors">
          What is e/H-LAM/T?
        </summary>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(HLAMT_LABELS).map(([key, { label, desc }]) => (
            <div key={key} className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-3">
              <div className="text-xs font-mono text-[#c3fd50] mb-1">{key}/</div>
              <div className="text-sm font-medium text-gray-300 mb-1">{label}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}
