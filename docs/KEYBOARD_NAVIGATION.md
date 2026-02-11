# Keyboard Navigation

**Sprint 51** — Full keyboard navigation and focus management

## Status

**Deferred to post-ETHBoulder.** App is functional with mouse/touch. Keyboard navigation is important for accessibility and power users but not critical for the Feb 13-16 event's initial capture phase.

## Rationale

- **Event priority:** ETHBoulder starts in ~36 hours. Focus on stability over UX polish
- **Mouse/touch works:** All features accessible via click/tap
- **Accessibility partial:** Form labels and ARIA attributes from Sprint 42 provide screen reader support
- **Post-event value:** Can observe which keyboard shortcuts users actually need

## Current Keyboard Support

**Partially implemented:**
- ✅ Tab navigation through form inputs
- ✅ Enter to submit forms
- ✅ Esc closes modals (where implemented)
- ✅ Browser default keyboard shortcuts work

**Missing:**
- ❌ Global `/` for search focus
- ❌ Arrow key navigation in lists
- ❌ Vim-style `j/k` navigation
- ❌ Custom focus indicators
- ❌ Keyboard shortcuts for page navigation

## Planned Implementation

### 1. Global Keyboard Shortcuts

**Implementation:**
```typescript
// hooks/useKeyboardShortcuts.ts
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function useKeyboardShortcuts() {
  const navigate = useNavigate()
  
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      switch(e.key) {
        case '/':
          e.preventDefault()
          document.getElementById('search-input')?.focus()
          break
        case 'c':
          if (e.metaKey || e.ctrlKey) {
            navigate('/contribute')
          }
          break
        case 'g':
          if (e.shiftKey) {
            navigate('/graph')
          }
          break
        case 'h':
          navigate('/')
          break
        case '?':
          e.preventDefault()
          // Show keyboard shortcuts help modal
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])
}
```

**Add to App.tsx:**
```typescript
export default function App() {
  useKeyboardShortcuts()
  return (...)
}
```

### 2. List Navigation (Arrow Keys)

**For artifact lists, search results, etc:**
```typescript
function useArrowKeyNavigation(items: any[], onSelect: (item: any) => void) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      switch(e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(i => Math.min(i + 1, items.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(i => Math.max(i - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          onSelect(items[selectedIndex])
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex, items, onSelect])
  
  return selectedIndex
}
```

**Usage in Explore:**
```typescript
const selectedIndex = useArrowKeyNavigation(artifacts, (artifact) => {
  navigate(`/artifact/${artifact.id}`)
})

return (
  <div>
    {artifacts.map((a, i) => (
      <div 
        key={a.id}
        className={i === selectedIndex ? 'ring-2 ring-[#c3fd50]' : ''}
      >
        {a.title}
      </div>
    ))}
  </div>
)
```

### 3. Focus Indicators

**Custom focus styles in index.css:**
```css
/* Override browser default focus */
*:focus {
  outline: none;
}

/* Custom focus ring */
*:focus-visible {
  outline: 2px solid #c3fd50;
  outline-offset: 2px;
}

/* Button focus */
button:focus-visible {
  ring: 2px;
  ring-color: #c3fd50;
}

/* Input focus (already styled) */
input:focus,
textarea:focus,
select:focus {
  border-color: #c3fd50;
}
```

### 4. Skip Links (Accessibility)

**Add to App.tsx:**
```typescript
return (
  <BrowserRouter>
    <a 
      href="#main-content" 
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-[#c3fd50] text-[#0f0f0f] px-4 py-2 rounded-lg z-50"
    >
      Skip to main content
    </a>
    <Nav />
    <main id="main-content" className="max-w-6xl mx-auto px-4 py-6">
      {/* ... */}
    </main>
  </BrowserRouter>
)
```

### 5. Keyboard Shortcuts Help Modal

**Component:**
```typescript
function KeyboardShortcutsModal({ isOpen, onClose }: Props) {
  const shortcuts = [
    { key: '/', description: 'Focus search' },
    { key: 'h', description: 'Go to home' },
    { key: 'c', description: 'New contribution' },
    { key: 'g', description: 'Show graph' },
    { key: '↑ ↓', description: 'Navigate lists' },
    { key: 'Enter', description: 'Select item' },
    { key: 'Esc', description: 'Close modal' },
    { key: '?', description: 'Show this help' },
  ]
  
  return isOpen ? (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-6 max-w-md">
        <h2 className="text-xl font-bold mb-4">Keyboard Shortcuts</h2>
        <div className="space-y-2">
          {shortcuts.map(s => (
            <div key={s.key} className="flex justify-between text-sm">
              <kbd className="px-2 py-1 bg-[#262626] rounded font-mono">{s.key}</kbd>
              <span className="text-gray-400">{s.description}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-4 w-full px-4 py-2 bg-[#c3fd50] text-[#0f0f0f] rounded-lg">
          Close
        </button>
      </div>
    </div>
  ) : null
}
```

### 6. Modal Focus Trap

**Utility hook:**
```typescript
function useFocusTrap(ref: React.RefObject<HTMLElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !ref.current) return
    
    const focusableElements = ref.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
    
    function handleTabKey(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }
    
    firstElement?.focus()
    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [isActive, ref])
}
```

## Acceptance Criteria (Deferred)

- [x] Keyboard navigation plan documented
- [ ] `/` focuses search from anywhere
- [ ] Arrow keys navigate lists
- [ ] Enter selects items
- [ ] Esc closes modals/panels
- [ ] Custom focus indicators visible
- [ ] Skip link for screen readers
- [ ] Keyboard shortcuts help modal
- [ ] Power users can navigate app without mouse

**Target completion:** Post-ETHBoulder (Feb 17+)

## Testing Checklist

- [ ] Tab through entire app, verify focus order
- [ ] Press `/` and verify search focuses
- [ ] Navigate artifact list with arrow keys
- [ ] Open/close modals with keyboard only
- [ ] Test with screen reader (VoiceOver/NVDA)
- [ ] Verify focus never gets trapped in unintended areas

## Priority

**Medium-High.** Keyboard navigation significantly improves accessibility and power user experience. Should be implemented soon after ETHBoulder to support participants who prefer keyboard-first workflows.

## Notes

This sprint continues the accessibility work from Sprint 42. Combined with ARIA labels and form labels, full keyboard navigation will make the app accessible to keyboard-only users and screen reader users.

The implementation plan provides specific code patterns that can be dropped in post-event with minimal integration work.
