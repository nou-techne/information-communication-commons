// Responsive Thread View Utilities

/**
 * Mobile-optimized styles for thread view
 */
export const RESPONSIVE_THREAD_STYLES = {
  // Touch target minimum (WCAG 2.5.5)
  minTouchTarget: '44px',
  
  // Message card mobile styles
  messageCard: {
    mobile: {
      width: '100%',
      padding: '1rem',
      marginBottom: '0.5rem',
    },
    desktop: {
      maxWidth: '90%',
      padding: '1.5rem',
      marginBottom: '1rem',
    },
  },
  
  // Thread sidebar responsive
  threadSidebar: {
    mobile: {
      position: 'fixed' as const,
      top: '0',
      right: '0',
      height: '100%',
      width: '85vw',
      maxWidth: '320px',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease',
    },
    desktop: {
      position: 'relative' as const,
      width: '300px',
      height: 'auto',
      transform: 'none',
    },
  },
  
  // Reply composer mobile
  replyComposer: {
    mobile: {
      position: 'fixed' as const,
      bottom: '0',
      left: '0',
      right: '0',
      padding: '1rem',
      backgroundColor: '#060a14',
      borderTop: '1px solid #1d2839',
      zIndex: 10,
    },
    desktop: {
      position: 'relative' as const,
      padding: '1.5rem',
      marginTop: '1rem',
    },
  },
}

/**
 * Calculate responsive tap target size
 */
export function getTouchTargetStyle(size: 'small' | 'medium' | 'large' = 'medium') {
  const sizes = {
    small: '44px',
    medium: '48px',
    large: '56px',
  }
  
  return {
    minWidth: sizes[size],
    minHeight: sizes[size],
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
}

/**
 * Message list padding for bottom composer
 */
export function getMessageListPadding(hasFixedComposer: boolean): React.CSSProperties {
  return {
    paddingBottom: hasFixedComposer ? '100px' : '1rem',
  }
}

/**
 * Responsive thread layout breakpoints
 */
export const THREAD_BREAKPOINTS = {
  // Stack sidebar below on mobile
  stackSidebar: 768,
  // Collapse sidebar by default
  collapseSidebar: 1024,
  // Full layout
  fullLayout: 1280,
}

/**
 * Check if sidebar should be collapsed by default
 */
export function shouldCollapseSidebar(width: number): boolean {
  return width < THREAD_BREAKPOINTS.collapseSidebar
}

/**
 * Message card responsive classes
 */
export function getMessageCardClasses(isMobile: boolean): string {
  const base = 'bg-[#0a101d] border border-[#1d2839] rounded-lg'
  
  if (isMobile) {
    return `${base} w-full p-4 mb-2`
  }
  
  return `${base} max-w-[90%] p-6 mb-4`
}

/**
 * Action button classes for touch targets
 */
export function getActionButtonClasses(isMobile: boolean): string {
  const base = 'inline-flex items-center justify-center rounded transition-colors'
  const touch = 'min-w-[44px] min-h-[44px]'
  const desktop = 'px-3 py-2'
  
  return `${base} ${isMobile ? touch : desktop}`
}

/**
 * Thread header mobile optimization
 */
export function getThreadHeaderClasses(isMobile: boolean): string {
  if (isMobile) {
    return 'sticky top-0 z-20 bg-[#060a14] border-b border-[#1d2839] p-4'
  }
  
  return 'mb-6'
}

/**
 * Composer textarea mobile styles
 */
export function getComposerTextareaStyle(isMobile: boolean): React.CSSProperties {
  return {
    minHeight: isMobile ? '80px' : '100px',
    maxHeight: isMobile ? '200px' : '300px',
    fontSize: isMobile ? '16px' : '14px', // Prevent iOS zoom on focus
  }
}
