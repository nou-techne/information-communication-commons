import { useState, useEffect } from 'react'
import { getBreakpoint, type Breakpoint } from '../styles/breakpoints'

/**
 * Hook to reactively track current responsive breakpoint
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() => 
    getBreakpoint(window.innerWidth)
  )

  useEffect(() => {
    function handleResize() {
      const newBreakpoint = getBreakpoint(window.innerWidth)
      setBreakpoint(newBreakpoint)
    }

    window.addEventListener('resize', handleResize)
    
    // Call once to ensure correct initial value
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return breakpoint
}

/**
 * Hook to check if current breakpoint matches
 */
export function useBreakpointMatch(target: Breakpoint | Breakpoint[]): boolean {
  const current = useBreakpoint()
  const targets = Array.isArray(target) ? target : [target]
  return targets.includes(current)
}

/**
 * Hook to check if breakpoint is at least a certain size
 */
export function useBreakpointAtLeast(target: Breakpoint): boolean {
  const current = useBreakpoint()
  const order: Breakpoint[] = ['mobile', 'tablet', 'desktop', 'wide']
  const currentIndex = order.indexOf(current)
  const targetIndex = order.indexOf(target)
  return currentIndex >= targetIndex
}
