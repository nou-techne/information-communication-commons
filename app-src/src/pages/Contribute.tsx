import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
const WEBHOOK_URL = 'https://hook.us1.make.com/bipq9blpdjf3ekou38lxxfz80j8m6s3y'

type ProcessingState = 'idle' | 'submitting' | 'done' | 'error'

const HLAMT_LABELS: Record<string, { label: string; desc: string }> = {
  e: { label: 'Ecology', desc: 'Environmental context, place, watershed, seasonal patterns' },
  H: { label: 'Human', desc: 'People, capabilities, relationships, lived experience' },
  L: { label: 'Language', desc: 'Shared vocabulary, frameworks, naming, definitions' },
  A: { label: 'Artifacts', desc: 'Tools, documents, code, physical objects, infrastructure' },
  M: { label: 'Methodology', desc: 'Processes, workflows, practices, coordination patterns' },
  T: { label: 'Training', desc: 'Learning, skill development, transformation, practice' },
}

const PROMPTS: Record<string, string> = {
  open: "What happened? What did you observe, learn, discuss, or decide? Write naturally — we'll handle the rest.",
  session: "Describe what happened in this session. Key ideas, proposals, tensions, commitments — whatever stood out.",
  idea: "Describe an idea that emerged. What is it? Why does it matter? What does it connect to?",
  commitment: "What are you committing to? What will you do, by when, and why?",
}

export function Contribute() {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [context, setContext] = useState('open')
  const [state, setState] = useState<ProcessingState>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return

    setState('submitting')
    setError('')

    try {
      // Send to Make.com webhook (transcript ingestion scenario)
      // The scenario sends to Claude for extraction, then calls ingest_extraction() RPC
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text,
          source: 'app-contribute',
          context_type: context,
          convergence: 'ethboulder-2026',
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) throw new Error('Failed to submit')

      // The webhook processes asynchronously — we show a success state
      // and direct the user to check the Garden for their new artifacts
      setState('done')
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-[#1a2a44] flex items-center justify-center mx-auto mb-6">
            <span className="text-[#5b9de4] text-2xl font-bold">+</span>
          </div>
          <h2 className="text-xl font-bold mb-3">Contribution received</h2>
          <p className="text-gray-400 mb-2 max-w-md mx-auto">
            Your text is being processed. The AI extraction pipeline will identify ideas, proposals, commitments, and connections — and add them to the knowledge graph.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            This usually takes 30–60 seconds.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setState('idle'); setText(''); }}
              className="px-6 py-2.5 bg-[#1a2a44] text-white rounded-lg hover:bg-[#243656] transition-colors text-sm"
            >
              Contribute more
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 bg-[#3d7cc9] text-white rounded-lg hover:bg-[#5b9de4] transition-colors text-sm"
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
        Write naturally about what you experienced, learned, or want to commit to. 
        AI will extract ideas, proposals, commitments, and connections for the knowledge graph.
      </p>

      {/* Context selector */}
      <div className="flex gap-1 mb-6 bg-[#111d33] rounded-lg p-1">
        {Object.entries({
          open: 'Open',
          session: 'Session Notes',
          idea: 'Idea',
          commitment: 'Commitment',
        }).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setContext(key)}
            className={`flex-1 py-2 text-sm rounded-md transition-colors ${
              context === key
                ? 'bg-[#1a2a44] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={PROMPTS[context]}
            rows={10}
            required
            className="w-full bg-[#111d33] border border-[#1a2a44] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#5b9de4] resize-y leading-relaxed"
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-600">
              The extraction pipeline identifies artifacts, classifies them by e/H-LAM/T dimension, and records relationships.
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
          className="w-full bg-[#3d7cc9] hover:bg-[#5b9de4] text-white py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {state === 'submitting' ? 'Sending to extraction pipeline...' : 'Submit to the Commons'}
        </button>
      </form>

      {/* e/H-LAM/T reference */}
      <details className="mt-8">
        <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-300 transition-colors">
          What is e/H-LAM/T?
        </summary>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(HLAMT_LABELS).map(([key, { label, desc }]) => (
            <div key={key} className="bg-[#111d33] border border-[#1a2a44] rounded-lg p-3">
              <div className="text-xs font-mono text-[#5b9de4] mb-1">{key}/</div>
              <div className="text-sm font-medium text-gray-300 mb-1">{label}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}
