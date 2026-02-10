import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type ProcessingState = 'idle' | 'submitting' | 'done' | 'error'

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return

    setState('submitting')
    setError('')

    try {
      // Insert directly into contributions table
      const { error: insertError } = await supabase.from('contributions').insert({
        content: text,
        convergence_id: CONVERGENCE_ID,
        status: 'pending',
      })

      if (insertError) throw insertError

      // Fire Make.com webhook for AI extraction (fire and forget)
      fetch('https://hook.us1.make.com/bipq9blpdjf3ekou38lxxfz80j8m6s3y', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text,
          convergence: CONVERGENCE_ID,
          context_type: 'auto',
          source: 'app-contribute',
        }),
      }).catch(() => {})

      setState('done')
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-[#262626] flex items-center justify-center mx-auto mb-6">
            <span className="text-[#c3fd50] text-2xl font-bold">+</span>
          </div>
          <h2 className="text-xl font-bold mb-3">Contribution received</h2>
          <p className="text-gray-400 mb-2 max-w-md mx-auto">
            Your contribution has been saved. The AI extraction pipeline will process it shortly — identifying ideas, proposals, commitments, and connections for the knowledge graph.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Extraction typically takes 30–60 seconds.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setState('idle'); setText(''); }}
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
            className="w-full bg-[#1a1a1a] border border-[#262626] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#c3fd50] resize-y leading-relaxed"
          />
          <div className="flex justify-between mt-2">
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
