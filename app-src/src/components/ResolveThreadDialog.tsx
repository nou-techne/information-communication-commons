import { useState } from 'react'
import { X, CheckCircle } from 'lucide-react'

interface ResolveThreadDialogProps {
  threadTitle: string
  onResolve: (data: { reason: string; summary: string }) => void
  onClose: () => void
}

const REASONS = [
  'Consensus reached',
  'Question answered',
  'Action items identified',
  'Decision made',
  'Information gathered',
  'Other',
]

export function ResolveThreadDialog({ threadTitle, onResolve, onClose }: ResolveThreadDialogProps) {
  const [reason, setReason] = useState(REASONS[0])
  const [summary, setSummary] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleResolve() {
    if (!summary.trim()) return
    setSubmitting(true)
    onResolve({ reason, summary: summary.trim() })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#a78bfa]" />
            <h2 className="text-lg font-bold">Resolve Thread</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        
        <p className="text-sm text-gray-400 mb-4">Resolving: <span className="text-white">{threadTitle}</span></p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Reason</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full bg-[#0f0f0f] border border-[#262626] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#a78bfa]"
            >
              {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Resolution Summary</label>
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="Summarize the resolution or key takeaways..."
              rows={4}
              className="w-full bg-[#0f0f0f] border border-[#262626] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#a78bfa] text-sm resize-none"
            />
          </div>
          <button
            onClick={handleResolve}
            disabled={!summary.trim() || submitting}
            className="w-full bg-[#a78bfa] text-white font-medium py-2 rounded-lg hover:bg-[#c4b5fd] transition-colors text-sm disabled:opacity-50"
          >
            {submitting ? 'Resolving...' : 'Resolve Thread'}
          </button>
        </div>
      </div>
    </div>
  )
}
