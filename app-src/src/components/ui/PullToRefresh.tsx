import { useState, useRef, useEffect, ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  threshold?: number
  children: ReactNode
  disabled?: boolean
}

export function PullToRefresh({
  onRefresh,
  threshold = 80,
  children,
  disabled = false,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isReleased, setIsReleased] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef<number>(0)
  const isDragging = useRef<boolean>(false)

  function handleTouchStart(e: React.TouchEvent) {
    if (disabled || isRefreshing) return

    // Only trigger if scrolled to top
    const scrollTop = containerRef.current?.scrollTop || 0
    if (scrollTop === 0) {
      startY.current = e.touches[0].clientY
      isDragging.current = true
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isDragging.current || disabled || isRefreshing) return

    const currentY = e.touches[0].clientY
    const distance = currentY - startY.current

    // Only allow pulling down
    if (distance > 0) {
      // Apply resistance (diminishing returns as you pull further)
      const resistance = 0.5
      const adjustedDistance = Math.pow(distance, resistance * 2)
      setPullDistance(Math.min(adjustedDistance, threshold * 1.5))
    }
  }

  async function handleTouchEnd() {
    if (!isDragging.current || disabled) return

    isDragging.current = false

    if (pullDistance >= threshold && !isRefreshing) {
      setIsReleased(true)
      setIsRefreshing(true)

      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setIsReleased(false)
        setPullDistance(0)
      }
    } else {
      // Spring back animation
      setPullDistance(0)
    }
  }

  const progress = Math.min(pullDistance / threshold, 1)
  const shouldTrigger = pullDistance >= threshold

  return (
    <div
      ref={containerRef}
      className="relative h-full overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none transition-all duration-200"
        style={{
          height: `${Math.max(pullDistance, 0)}px`,
          opacity: pullDistance > 0 ? 1 : 0,
        }}
      >
        <div
          className={`flex items-center justify-center transition-transform ${
            isRefreshing ? 'animate-spin' : ''
          }`}
          style={{
            transform: isRefreshing
              ? 'rotate(360deg)'
              : `rotate(${progress * 360}deg)`,
          }}
        >
          <RefreshCw
            className={`w-6 h-6 transition-colors ${
              shouldTrigger || isRefreshing ? 'text-[#a6ed2a]' : 'text-gray-500'
            }`}
          />
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: `translateY(${isRefreshing ? threshold : pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
