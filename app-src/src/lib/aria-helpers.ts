// ARIA Helper Utilities

/**
 * Generate unique ID for aria-describedby references
 */
export function generateAriaId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Common ARIA labels for icon-only buttons
 */
export const ARIA_LABELS = {
  // Actions
  close: 'Close',
  delete: 'Delete',
  edit: 'Edit',
  save: 'Save',
  cancel: 'Cancel',
  submit: 'Submit',
  add: 'Add',
  remove: 'Remove',
  refresh: 'Refresh',
  sync: 'Sync',
  upload: 'Upload',
  download: 'Download',
  
  // Navigation
  back: 'Go back',
  forward: 'Go forward',
  home: 'Go to home',
  menu: 'Open menu',
  search: 'Search',
  
  // Toggles
  toggleSidebar: 'Toggle sidebar',
  toggleTheme: 'Toggle theme',
  toggleExpanded: 'Toggle expanded',
  
  // Status
  loading: 'Loading',
  error: 'Error',
  success: 'Success',
  warning: 'Warning',
} as const

/**
 * ARIA attributes for common component patterns
 */
export const ARIA_PATTERNS = {
  // Modal dialog
  modal: (labelId: string) => ({
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': labelId,
  }),
  
  // Alert
  alert: {
    role: 'alert',
    'aria-live': 'assertive',
  },
  
  // Status region
  status: {
    role: 'status',
    'aria-live': 'polite',
  },
  
  // Navigation
  nav: (label: string) => ({
    role: 'navigation',
    'aria-label': label,
  }),
  
  // Button (loading state)
  loadingButton: {
    'aria-busy': 'true',
    'aria-disabled': 'true',
  },
  
  // Toggle button
  toggle: (pressed: boolean) => ({
    role: 'switch',
    'aria-checked': pressed ? 'true' : 'false',
  }),
  
  // Tab panel
  tabPanel: (id: string, labelledBy: string) => ({
    role: 'tabpanel',
    id,
    'aria-labelledby': labelledBy,
  }),
  
  // List
  list: {
    role: 'list',
  },
  
  listItem: {
    role: 'listitem',
  },
} as const

/**
 * Screen reader only text (visually hidden)
 */
export function srOnly(text: string): React.CSSProperties {
  return {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  }
}

/**
 * Announce to screen readers
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', priority === 'assertive' ? 'alert' : 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Trap focus within an element
   */
  trapFocus(element: HTMLElement) {
    const focusableElements = element.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]
    
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable?.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable?.focus()
          e.preventDefault()
        }
      }
    }
    
    element.addEventListener('keydown', handleKeyDown)
    firstFocusable?.focus()
    
    return () => {
      element.removeEventListener('keydown', handleKeyDown)
    }
  },
  
  /**
   * Get first focusable element
   */
  getFirstFocusable(element: HTMLElement): HTMLElement | null {
    return element.querySelector(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
  },
  
  /**
   * Set focus to element after delay
   */
  focusAfterDelay(element: HTMLElement | null, delay: number = 100) {
    if (!element) return
    setTimeout(() => element.focus(), delay)
  },
}

/**
 * Keyboard shortcuts for common actions
 */
export const KEYBOARD_SHORTCUTS = {
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  SPACE: ' ',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  TAB: 'Tab',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const
