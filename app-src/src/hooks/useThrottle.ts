import { useRef, useCallback, useEffect } from 'react'

/**
 * Throttle a function - limits how often it can be called
 */
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 100
): T {
  const lastCall = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const throttledFn = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      const timeSinceLastCall = now - lastCall.current

      if (timeSinceLastCall >= delay) {
        lastCall.current = now
        fn(...args)
      } else {
        // Schedule for later
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
          lastCall.current = Date.now()
          fn(...args)
        }, delay - timeSinceLastCall)
      }
    },
    [fn, delay]
  ) as T

  return throttledFn
}
