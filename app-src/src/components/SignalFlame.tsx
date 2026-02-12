import { Flame } from 'lucide-react'

interface SignalFlameProps {
  count: number
  className?: string
  showCount?: boolean
}

/**
 * CS-19: Universal flame component for coordination signals.
 * Size scales with count. Consistent orange color.
 */
export function SignalFlame({ count, className = '', showCount = true }: SignalFlameProps) {
  if (count <= 0) return null

  const size = count <= 2 ? 'w-3 h-3' : count <= 5 ? 'w-4 h-4' : 'w-5 h-5'
  const animate = count >= 6 ? 'animate-pulse' : ''

  return (
    <span
      className={`inline-flex items-center gap-1 text-orange-400 ${className}`}
      role="status"
      aria-label={`${count} coordination signal${count !== 1 ? 's' : ''}`}
    >
      <Flame className={`${size} ${animate}`} />
      {showCount && <span className="text-xs font-medium">{count}</span>}
    </span>
  )
}
