import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Play, Pause, SkipBack, SkipForward, Clock } from 'lucide-react'

interface ReplayEntry {
  seq: number
  contribution_id: string
  content: string
  chain_hash: string
  parent_hash: string
  status: string
  created_at: string
  artifact_count: number
  artifacts: { id: string; title: string; type: string; rea_role: string; summary: string }[]
}

interface ReplaySliderProps {
  maxSeq: number
  onSeqChange: (seq: number, entries: ReplayEntry[]) => void
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function ReplaySlider({ maxSeq, onSeqChange }: ReplaySliderProps) {
  const [currentSeq, setCurrentSeq] = useState(maxSeq)
  const [playing, setPlaying] = useState(false)
  const [entries, setEntries] = useState<ReplayEntry[]>([])
  const [currentEntry, setCurrentEntry] = useState<ReplayEntry | null>(null)

  const loadReplay = useCallback(async (seq: number) => {
    const { data } = await supabase.rpc('replay_chain', { p_from_seq: 1, p_to_seq: seq })
    if (data) {
      setEntries(data)
      setCurrentEntry(data[data.length - 1] || null)
      onSeqChange(seq, data)
    }
  }, [onSeqChange])

  useEffect(() => {
    loadReplay(currentSeq)
  }, [currentSeq])

  useEffect(() => {
    if (!playing) return
    if (currentSeq >= maxSeq) {
      setPlaying(false)
      return
    }
    const timer = setTimeout(() => {
      setCurrentSeq(s => Math.min(s + 1, maxSeq))
    }, 1500)
    return () => clearTimeout(timer)
  }, [playing, currentSeq, maxSeq])

  return (
    <div className="rounded-lg border border-[#1d2839] bg-[#0a101d] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-[#a6ed2a]" />
        <h3 className="text-sm font-semibold text-white">Graph Replay</h3>
        <span className="ml-auto text-xs text-gray-500">
          State #{currentSeq} of {maxSeq}
        </span>
      </div>

      {/* Slider */}
      <div className="mb-3">
        <input
          type="range"
          min={1}
          max={maxSeq}
          value={currentSeq}
          onChange={(e) => {
            setPlaying(false)
            setCurrentSeq(Number(e.target.value))
          }}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #a6ed2a 0%, #a6ed2a ${(currentSeq / maxSeq) * 100}%, #1d2839 ${(currentSeq / maxSeq) * 100}%, #1d2839 100%)`
          }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mb-3">
        <button
          onClick={() => { setPlaying(false); setCurrentSeq(1) }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1d2839] transition-colors"
          aria-label="Reset to start"
        >
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          onClick={() => setPlaying(!playing)}
          className="p-2 rounded-lg bg-[#a6ed2a] text-[#080c16] hover:bg-[#b8f247] transition-colors"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <button
          onClick={() => { setPlaying(false); setCurrentSeq(maxSeq) }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1d2839] transition-colors"
          aria-label="Skip to end"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Current entry info */}
      {currentEntry && (
        <div className="border-t border-[#1d2839] pt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-gray-500">
              #{currentEntry.seq} · {currentEntry.chain_hash?.slice(0, 12)}…
            </span>
            <span className="text-xs text-gray-600">{timeAgo(currentEntry.created_at)}</span>
          </div>
          <p className="text-sm text-gray-300 line-clamp-2 mb-2">{currentEntry.content?.slice(0, 200)}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{currentEntry.artifact_count} artifact{currentEntry.artifact_count !== 1 ? 's' : ''} extracted</span>
            <span>·</span>
            <span>{entries.reduce((sum, e) => sum + e.artifact_count, 0)} total in graph</span>
          </div>
        </div>
      )}

      {/* Timeline dots */}
      <div className="flex gap-1 mt-3">
        {Array.from({ length: maxSeq }, (_, i) => i + 1).map(seq => (
          <button
            key={seq}
            onClick={() => { setPlaying(false); setCurrentSeq(seq) }}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              seq <= currentSeq ? 'bg-[#a6ed2a]' : 'bg-[#1d2839]'
            } ${seq === currentSeq ? 'ring-1 ring-[#a6ed2a] ring-offset-1 ring-offset-[#0a101d]' : ''}`}
            aria-label={`Jump to state ${seq}`}
          />
        ))}
      </div>
    </div>
  )
}
