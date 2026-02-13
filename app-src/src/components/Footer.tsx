import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useConvergence } from '../contexts/ConvergenceContext'

interface ChainHead {
  head_seq: number
  head_hash: string
  total_contributions: number
  total_artifacts: number
  chain_intact: boolean
  last_contribution_at: string
}

function useCountdown(opensAt: string | null) {
  const [remaining, setRemaining] = useState<{ days: number; hours: number; minutes: number; seconds: number; isOpen: boolean } | null>(null)

  useEffect(() => {
    if (!opensAt) { setRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, isOpen: true }); return }
    const target = new Date(opensAt).getTime()

    function update() {
      const diff = target - Date.now()
      if (diff <= 0) {
        setRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, isOpen: true })
      } else {
        const days = Math.floor(diff / 86400000)
        const hours = Math.floor((diff % 86400000) / 3600000)
        const minutes = Math.floor((diff % 3600000) / 60000)
        const seconds = Math.floor((diff % 60000) / 1000)
        setRemaining({ days, hours, minutes, seconds, isOpen: false })
      }
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [opensAt])

  return remaining
}

export function Footer() {
  const year = new Date().getFullYear()
  const { convergence } = useConvergence()
  const [head, setHead] = useState<ChainHead | null>(null)
  const countdown = useCountdown(convergence.opens_at)

  useEffect(() => {
    loadChain()
    const interval = setInterval(loadChain, 15000)
    const sub = supabase.channel('footer-chain')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contributions' }, loadChain)
      .subscribe()
    return () => { clearInterval(interval); supabase.removeChannel(sub) }
  }, [])

  async function loadChain() {
    const { data } = await supabase.rpc('chain_head')
    if (data && data.length > 0) setHead(data[0])
    else setHead(null)
  }

  const isOpen = countdown?.isOpen ?? false
  const hasChain = head && head.head_seq > 0

  // LED: green = open + chain intact, amber = open + no data, blue = countdown, red = chain broken
  let ledColor = '#3b82f6' // blue: countdown
  let ledLabel = 'Countdown'
  if (isOpen && hasChain && head?.chain_intact) {
    ledColor = '#22c55e' // green: live + intact
    ledLabel = 'Live'
  } else if (isOpen && hasChain && !head?.chain_intact) {
    ledColor = '#ef4444' // red: chain broken
    ledLabel = 'Chain Error'
  } else if (isOpen && !hasChain) {
    ledColor = '#f59e0b' // amber: open but empty
    ledLabel = 'Awaiting Data'
  }

  return (
    <footer className="border-t border-[#1d2839] bg-[#060a14] mt-auto">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        {/* Chain Status Row */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
          {/* LED + Status */}
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-2">
              {/* LED indicator */}
              <div className="relative">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: ledColor }}
                />
                {(isOpen && hasChain && head?.chain_intact) && (
                  <div
                    className="absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping opacity-75"
                    style={{ backgroundColor: ledColor }}
                  />
                )}
              </div>
              <span className="text-xs font-medium" style={{ color: ledColor }}>{ledLabel}</span>

              {/* Countdown inline with LED on mobile */}
              {!isOpen && countdown && (
                <div className="flex items-center gap-1.5 text-xs font-mono ml-1">
                  <span className="text-gray-500">in</span>
                  {countdown.days > 0 && <span className="text-white">{countdown.days}d</span>}
                  <span className="text-white">{String(countdown.hours).padStart(2, '0')}h</span>
                  <span className="text-white">{String(countdown.minutes).padStart(2, '0')}m</span>
                  <span className="text-gray-400">{String(countdown.seconds).padStart(2, '0')}s</span>
                </div>
              )}
            </div>

            {isOpen && hasChain && head && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs">
                <span className="text-gray-500">Chain</span>
                <span className="font-mono text-white">#{head.head_seq}</span>
                <span className="hidden sm:inline text-gray-600">|</span>
                <span className="font-mono text-gray-500" title={head.head_hash}>{head.head_hash?.slice(0, 8)}<span className="hidden sm:inline">{head.head_hash?.slice(8, 12)}</span></span>
                <span className="text-gray-600">&middot;</span>
                <span className="text-gray-400">{head.total_contributions} contrib</span>
                <span className="text-gray-600">&middot;</span>
                <span className="text-gray-400">{head.total_artifacts} artifacts</span>
              </div>
            )}

            {isOpen && !hasChain && (
              <span className="text-xs text-gray-500">Awaiting first contribution.</span>
            )}
          </div>

          {/* Integrity badge */}
          {isOpen && hasChain && head && (
            <div className={`self-start sm:self-auto text-[10px] sm:text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${
              head.chain_intact 
                ? 'border-emerald-800/50 bg-emerald-900/20 text-emerald-400' 
                : 'border-red-800/50 bg-red-900/20 text-red-400'
            }`}>
              {head.chain_intact ? 'Chain Intact' : 'Chain Broken'}
            </div>
          )}
        </div>

        {/* Links Row */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-[11px] sm:text-xs text-gray-500 pt-2 sm:pt-3 border-t border-[#1d2839]/50">
          <div className="flex items-center gap-1.5">
            <a href="https://regenhub.xyz" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">RegenHub</a>
            <span>/</span>
            <a href="https://techne.institute" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">Techne</a>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">Terms</a>
            <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">Privacy</a>
            <a href="/license.html" className="hover:text-gray-300 transition-colors">License</a>
          </div>
          <div className="text-gray-600">&copy; {year} commons.id</div>
        </div>
      </div>
    </footer>
  )
}
