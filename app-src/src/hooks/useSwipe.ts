import { useRef, useState } from 'react'

export type SwipeDirection = 'left' | 'right' | 'up' | 'down' | null

export interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: () => void
}

export interface SwipeOptions {
  minDistance?: number
  onSwipe?: (direction: SwipeDirection, distance: number) => void
  onSwipeLeft?: (distance: number) => void
  onSwipeRight?: (distance: number) => void
  onSwipeUp?: (distance: number) => void
  onSwipeDown?: (distance: number) => void
}

/**
 * Hook to detect swipe gestures
 */
export function useSwipe(options: SwipeOptions = {}): SwipeHandlers {
  const {
    minDistance = 50,
    onSwipe,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
  } = options

  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const touchEnd = useRef<{ x: number; y: number } | null>(null)

  function handleTouchStart(e: React.TouchEvent) {
    touchEnd.current = null
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    touchEnd.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    }
  }

  function handleTouchEnd() {
    if (!touchStart.current || !touchEnd.current) return

    const deltaX = touchEnd.current.x - touchStart.current.x
    const deltaY = touchEnd.current.y - touchStart.current.y

    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    // Determine if horizontal or vertical swipe
    if (Math.max(absX, absY) < minDistance) return

    let direction: SwipeDirection = null
    let distance = 0

    if (absX > absY) {
      // Horizontal swipe
      if (deltaX > 0) {
        direction = 'right'
        distance = deltaX
        onSwipeRight?.(distance)
      } else {
        direction = 'left'
        distance = Math.abs(deltaX)
        onSwipeLeft?.(distance)
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        direction = 'down'
        distance = deltaY
        onSwipeDown?.(distance)
      } else {
        direction = 'up'
        distance = Math.abs(deltaY)
        onSwipeUp?.(distance)
      }
    }

    if (direction) {
      onSwipe?.(direction, distance)
    }

    touchStart.current = null
    touchEnd.current = null
  }

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  }
}
