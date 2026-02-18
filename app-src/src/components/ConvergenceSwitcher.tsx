/**
 * Convergence Switcher — Toggle between ETHBoulder and Techne
 * Sprint Q97
 */

import { useConvergence } from '../contexts/ConvergenceContext'
import { TECHNE_CONFIG } from '../lib/convergence'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

const CONVERGENCES = [
  { id: '00000000-0000-0000-0000-000000000100', name: 'ETHBoulder 2026', badge: 'Event' },
  { id: TECHNE_CONFIG.id, name: 'Techne', badge: 'Cooperative' },
]

export function ConvergenceSwitcher() {
  const { convergence } = useConvergence()
  const [open, setOpen] = useState(false)

  const current = CONVERGENCES.find(c => c.id === convergence.id) || CONVERGENCES[0]

  function switchTo(id: string) {
    setOpen(false)
    if (id === TECHNE_CONFIG.id) {
      window.location.href = '/techne'
    } else {
      window.location.href = '/'
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs px-2 py-1 rounded border border-white/10 hover:border-white/20 transition-colors"
      >
        <span className="w-2 h-2 rounded-full" style={{ background: convergence.theme_primary }} />
        <span className="text-white/60">{current.name}</span>
        <ChevronDown className="w-3 h-3 text-white/30" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 bg-[#0a101d] border border-white/10 rounded shadow-lg z-50 min-w-[180px]">
          {CONVERGENCES.map(c => (
            <button
              key={c.id}
              onClick={() => switchTo(c.id)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors ${
                c.id === convergence.id ? 'text-white' : 'text-white/50'
              }`}
            >
              <span>{c.name}</span>
              <span className="text-[9px] text-white/30 uppercase tracking-wider">{c.badge}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
