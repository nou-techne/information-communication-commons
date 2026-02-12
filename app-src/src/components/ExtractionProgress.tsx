import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface ExtractionProgressProps {
  startedAt: string | number  // ISO string or timestamp
  compact?: boolean           // smaller version for feed cards
}

export function ExtractionProgress({ startedAt, compact = false }: ExtractionProgressProps) {
  const [progress, setProgress] = useState(0)
  const [avgMs, setAvgMs] = useState(15000)

  useEffect(() => {
    // Fetch average extraction time
    supabase.rpc('avg_extraction_time_ms').then(({ data }) => {
      if (data && data > 0) setAvgMs(data)
    })
  }, [])

  useEffect(() => {
    const startMs = typeof startedAt === 'number' ? startedAt : new Date(startedAt).getTime()
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startMs
      // Progress approaches 95% asymptotically, never hits 100% until actually complete
      const pct = Math.min(95, (elapsed / avgMs) * 85)
      setProgress(pct)
    }, 200)

    return () => clearInterval(interval)
  }, [startedAt, avgMs])

  const avgSeconds = Math.round(avgMs / 1000)

  if (compact) {
    return (
      <div className="w-full">
        <div className="h-1 bg-[#262626] rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-400 rounded-full transition-all duration-200 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">Extracting knowledge...</span>
        <span className="text-xs font-mono text-gray-400">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 bg-[#262626] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#c3fd50] rounded-full transition-all duration-200 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-600 mt-2 text-center">
        Avg. extraction: ~{avgSeconds}s (based on last 5)
      </p>
    </div>
  )
}
