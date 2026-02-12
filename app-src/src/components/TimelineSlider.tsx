import { useState, useEffect, useCallback, useMemo } from 'react'
import { Play, Pause } from 'lucide-react'

interface TimelineSliderProps {
  artifacts: Array<{ id: string; created_at: string }>
  onTimeChange: (maxTime: Date) => void
  className?: string
}

const SPEEDS = [1, 2, 5] as const

export function TimelineSlider({ artifacts, onTimeChange, className = '' }: TimelineSliderProps) {
  const { minTime, maxTime } = useMemo(() => {
    if (artifacts.length === 0) return { minTime: 0, maxTime: 0 }
    const times = artifacts.map(a => new Date(a.created_at).getTime())
    return { minTime: Math.min(...times), maxTime: Math.max(...times) }
  }, [artifacts])

  const [value, setValue] = useState(maxTime)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(1)

  // Reset slider when artifacts change
  useEffect(() => {
    setValue(maxTime)
  }, [maxTime])

  // Notify parent of time changes
  useEffect(() => {
    onTimeChange(new Date(value))
  }, [value, onTimeChange])

  // Auto-play
  useEffect(() => {
    if (!playing || minTime === maxTime) return
    const interval = setInterval(() => {
      setValue(prev => {
        const next = prev + speed * 60000
        if (next >= maxTime) {
          setPlaying(false)
          return maxTime
        }
        return next
      })
    }, 100)
    return () => clearInterval(interval)
  }, [playing, speed, minTime, maxTime])

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(Number(e.target.value))
  }, [])

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  if (artifacts.length === 0) return null

  return (
    <div className={`flex items-center gap-3 px-4 py-2 bg-[#0a101d] border-t border-[#1d2839] ${className}`}>
      {/* Play/Pause */}
      <button
        onClick={() => {
          if (value >= maxTime) setValue(minTime)
          setPlaying(p => !p)
        }}
        className="p-1.5 rounded hover:bg-[#1d2839] text-[#a6ed2a] transition-colors"
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}
      </button>

      {/* Speed controls */}
      {SPEEDS.map(s => (
        <button
          key={s}
          onClick={() => setSpeed(s)}
          className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
            speed === s
              ? 'bg-[#a6ed2a] text-[#080c16] font-bold'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {s}x
        </button>
      ))}

      {/* Slider */}
      <input
        type="range"
        min={minTime}
        max={maxTime}
        value={value}
        onChange={handleSliderChange}
        className="flex-1 h-1 appearance-none bg-[#1d2839] rounded-full cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#a6ed2a]
          [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(195,253,80,0.4)]
          [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-[#a6ed2a] [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
      />

      {/* Timestamp */}
      <span className="text-xs text-gray-400 whitespace-nowrap min-w-[110px] text-right">
        {formatTime(value)}
      </span>
    </div>
  )
}
