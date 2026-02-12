import { useEffect, useRef } from 'react'

interface SkipNavigationProps {
  targetId?: string
}

export function SkipNavigation({ targetId = 'main-content' }: SkipNavigationProps) {
  const linkRef = useRef<HTMLAnchorElement>(null)

  function handleSkip(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    const target = document.getElementById(targetId)
    if (target) {
      target.focus()
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <a
      ref={linkRef}
      href={`#${targetId}`}
      onClick={handleSkip}
      className="skip-navigation"
      style={{
        position: 'absolute',
        left: '-9999px',
        zIndex: 999,
        padding: '1rem',
        background: '#a6ed2a',
        color: '#060a14',
        textDecoration: 'none',
        fontWeight: 'bold',
        borderRadius: '0 0 4px 0',
      }}
      onFocus={(e) => {
        e.currentTarget.style.left = '0'
      }}
      onBlur={(e) => {
        e.currentTarget.style.left = '-9999px'
      }}
    >
      Skip to main content
    </a>
  )
}

/**
 * Hook to manage focus on route changes
 */
export function useFocusOnRouteChange() {
  useEffect(() => {
    // Focus main heading on route change
    const mainHeading = document.querySelector('h1')
    if (mainHeading) {
      // Make heading focusable
      if (!mainHeading.hasAttribute('tabindex')) {
        mainHeading.setAttribute('tabindex', '-1')
      }
      mainHeading.focus()
      
      // Remove tabindex after focus to restore natural tab order
      setTimeout(() => {
        mainHeading.removeAttribute('tabindex')
      }, 100)
    }
  }, [])
}

/**
 * Hook to trap focus within a modal
 */
export function useFocusTrap(isActive: boolean, containerRef: React.RefObject<HTMLElement>) {
  const previousFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    // Store element that had focus before modal opened
    previousFocus.current = document.activeElement as HTMLElement

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )

    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    // Focus first element
    firstFocusable?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          lastFocusable?.focus()
          e.preventDefault()
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          firstFocusable?.focus()
          e.preventDefault()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    // Cleanup and restore focus
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      
      // Restore focus to element that opened the modal
      if (previousFocus.current) {
        previousFocus.current.focus()
      }
    }
  }, [isActive, containerRef])
}

/**
 * Focus management utility component
 */
export function FocusManager() {
  useFocusOnRouteChange()
  return null
}
