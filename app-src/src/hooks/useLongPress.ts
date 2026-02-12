import { useRef, useCallback } from 'react'

export interface LongPressHandlers {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchEnd: () => void
  onTouchMove: () => void
  onMouseDown: (e: React.MouseEvent) => void
  onMouseUp: () => void
  onMouseLeave: () => void
}

export interface LongPressOptions {
  threshold?: number
  onLongPress: () => void
  onLongPressStart?: () => void
  onLongPressEnd?: () => void
}

/**
 * Hook to detect long press gestures
 */
export function useLongPress(options: LongPressOptions): LongPressHandlers {
  const {
    threshold = 500,
    onLongPress,
    onLongPressStart,
    onLongPressEnd,
  } = options

  const timerRef = useRef<NodeJS.Timeout>()
  const isLongPressRef = useRef(false)

  const start = useCallback(() => {
    isLongPressRef.current = false
    onLongPressStart?.()

    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      onLongPress()
    }, threshold)
  }, [threshold, onLongPress, onLongPressStart])

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = undefined
    }

    if (isLongPressRef.current) {
      onLongPressEnd?.()
    }

    isLongPressRef.current = false
  }, [onLongPressEnd])

  return {
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault()
      start()
    },
    onTouchEnd: clear,
    onTouchMove: clear, // Cancel on move
    onMouseDown: (e: React.MouseEvent) => {
      if (e.button === 0) { // Left click only
        start()
      }
    },
    onMouseUp: clear,
    onMouseLeave: clear,
  }
}
