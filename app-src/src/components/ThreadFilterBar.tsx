import { useState } from 'react'

export interface ThreadFilters {
  status: string | null
  dimension: string | null
  minMessages: number | null
}

interface ThreadFilterBarProps {
  onFilterChange: (filters: ThreadFilters) => void
  statusCounts?: Record<string, number>
  dimensions?: string[]
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open', color: '#a6ed2a' },
  { value: 'tagged', label: 'Tagged', color: '#60a5fa' },
  { value: 'resolved', label: 'Resolved', color: '#a78bfa' },
  { value: 'consolidated', label: 'Consolidated', color: '#fb923c' },
  { value: 'archived', label: 'Archived', color: '#9ca3af' },
]

const MESSAGE_COUNTS = [
  { value: 5, label: '5+ msgs' },
  { value: 10, label: '10+ msgs' },
  { value: 25, label: '25+ msgs' },
]

export function ThreadFilterBar({ onFilterChange, statusCounts = {}, dimensions = [] }: ThreadFilterBarProps) {
  const [filters, setFilters] = useState<ThreadFilters>({ status: null, dimension: null, minMessages: null })

  function toggle(key: keyof ThreadFilters, value: any) {
    const next = { ...filters, [key]: filters[key] === value ? null : value }
    setFilters(next)
    onFilterChange(next)
  }

  return (
    <div className="flex flex-wrap gap-2 py-2">
      {/* Status chips */}
      {STATUS_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => toggle('status', opt.value)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
            filters.status === opt.value
              ? 'border-current'
              : 'border-[#1d2839] text-gray-500 hover:text-gray-300'
          }`}
          style={filters.status === opt.value ? { color: opt.color, borderColor: opt.color } : undefined}
        >
          {opt.label}
          {statusCounts[opt.value] !== undefined && (
            <span className="ml-1 opacity-60">({statusCounts[opt.value]})</span>
          )}
        </button>
      ))}

      {/* Separator */}
      {dimensions.length > 0 && <div className="w-px bg-[#1d2839] my-1" />}

      {/* Dimension chips */}
      {dimensions.map(dim => (
        <button
          key={dim}
          onClick={() => toggle('dimension', dim)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
            filters.dimension === dim
              ? 'border-[#a6ed2a] text-[#a6ed2a]'
              : 'border-[#1d2839] text-gray-500 hover:text-gray-300'
          }`}
        >
          {dim}
        </button>
      ))}

      {/* Message count chips */}
      {MESSAGE_COUNTS.map(opt => (
        <button
          key={opt.value}
          onClick={() => toggle('minMessages', opt.value)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
            filters.minMessages === opt.value
              ? 'border-[#a6ed2a] text-[#a6ed2a]'
              : 'border-[#1d2839] text-gray-500 hover:text-gray-300'
          }`}
        >
          {opt.label}
        </button>
      ))}

      {/* Clear all */}
      {(filters.status || filters.dimension || filters.minMessages) && (
        <button
          onClick={() => {
            const cleared = { status: null, dimension: null, minMessages: null }
            setFilters(cleared)
            onFilterChange(cleared)
          }}
          className="px-3 py-1 rounded-full text-xs font-medium text-gray-500 hover:text-white transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  )
}
