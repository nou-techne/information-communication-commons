# Component Library Documentation

**Sprint 52** — Document shared components with props, examples, usage guidelines

## Status

**Deferred to post-ETHBoulder.** Component documentation is valuable for future development and maintenance but not critical for the Feb 13-16 event. Current components are functional and self-explanatory from their TypeScript definitions.

## Rationale

- **Event priority:** ETHBoulder starts in ~36 hours. Focus on event readiness over developer documentation
- **Current codebase navigable:** TypeScript provides inline documentation via types and interfaces
- **Single maintainer:** Currently one developer (Nou). Documentation becomes critical when team grows
- **Post-event value:** After ETHBoulder, documenting patterns observed during event will produce more useful guidance

## Current Component Structure

**Location:** `app-src/src/components/`

**Existing components:**
- `ErrorBoundary.tsx` — React error boundary with logging (Sprint 44)

**Common patterns in pages:**
- Most "components" are currently page-level (in `pages/`)
- Minimal shared component extraction so far
- Tailwind CSS for styling (utility-first, inline)
- Lucide React for icons

## Planned Documentation Structure

### 1. Component Library README

**Create:** `app-src/src/components/README.md`

```markdown
# Component Library

Shared, reusable components for commons.id

## Design Principles

- **Composition over configuration** — Small, focused components
- **TypeScript-first** — Types are documentation
- **Tailwind utility classes** — No CSS modules
- **Lucide icons only** — No emoji in UI
- **Accessible by default** — ARIA labels, keyboard nav

## File Structure

components/
├── ErrorBoundary.tsx    — Error boundary with Supabase logging
├── Button.tsx           — (planned) Primary/secondary button variants
├── Card.tsx             — (planned) Container with border/padding
├── Modal.tsx            — (planned) Dialog overlay with focus trap
└── README.md            — This file

## Usage

Import components from relative path:

\`\`\`typescript
import { ErrorBoundary } from '../components/ErrorBoundary'
\`\`\`

## Contributing

1. Create component in `components/`
2. Export named export (not default)
3. Add TypeScript interface for props
4. Document props with JSDoc comments
5. Add usage example in component file
6. Update this README
```

### 2. Component Documentation Template

**Pattern for every component:**

```typescript
/**
 * Button component with variant styles.
 * 
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Submit
 * </Button>
 * ```
 */
interface ButtonProps {
  /** Button text or content */
  children: React.ReactNode
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'ghost'
  /** Click handler */
  onClick?: () => void
  /** Disabled state */
  disabled?: boolean
  /** Button type for forms */
  type?: 'button' | 'submit' | 'reset'
  /** Accessible label (overrides children for screen readers) */
  'aria-label'?: string
}

export function Button({ 
  children, 
  variant = 'primary', 
  onClick,
  disabled = false,
  type = 'button',
  'aria-label': ariaLabel,
}: ButtonProps) {
  const variantClasses = {
    primary: 'bg-[#c3fd50] text-[#0f0f0f] hover:bg-[#d4fe80]',
    secondary: 'bg-[#262626] text-gray-300 hover:bg-[#333]',
    ghost: 'text-gray-400 hover:text-white',
  }
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`px-4 py-2 rounded-lg transition-colors font-medium ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  )
}

// Usage examples (at bottom of file for reference)
export const ButtonExamples = () => (
  <>
    <Button variant="primary">Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="ghost">Ghost</Button>
    <Button disabled>Disabled</Button>
  </>
)
```

### 3. Storybook (Optional, Long-term)

**For visual component development:**

```bash
npm install -D @storybook/react @storybook/addon-essentials
npx storybook init
```

**Create stories:**
```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
  },
}

export const Secondary: Story = {
  args: {
    children: 'Button',
    variant: 'secondary',
  },
}
```

**Why defer Storybook:** Adds ~50MB of dependencies, requires build configuration, creates parallel development environment. Valuable when team grows but overkill for single developer pre-event.

### 4. Component Extraction Candidates

**After ETHBoulder, consider extracting:**

**Button** — Used in multiple forms with consistent styling
```typescript
// Replace inline buttons like:
<button className="px-4 py-2 bg-[#c3fd50] text-[#0f0f0f] rounded-lg">Submit</button>

// With:
<Button variant="primary">Submit</Button>
```

**Card** — Common container pattern
```typescript
interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-[#1a1a1a] border border-[#262626] rounded-lg p-4 ${className}`}>
      {children}
    </div>
  )
}
```

**Modal** — Dialog overlay with focus trap
```typescript
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  useFocusTrap(modalRef, isOpen)  // From Sprint 51 keyboard nav
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-6 max-w-2xl">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        {children}
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-[#262626] text-white rounded-lg">
          Close
        </button>
      </div>
    </div>
  )
}
```

**Loading** — Consistent loading states
```typescript
export function Loading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-gray-500">{text}</div>
    </div>
  )
}
```

**Badge** — Inline tags/labels
```typescript
interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error'
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const variants = {
    default: 'bg-[#262626] text-gray-300',
    success: 'bg-green-900/30 text-green-400',
    warning: 'bg-yellow-900/30 text-yellow-400',
    error: 'bg-red-900/30 text-red-400',
  }
  
  return (
    <span className={`px-2 py-0.5 rounded text-xs ${variants[variant]}`}>
      {children}
    </span>
  )
}
```

## Design System Tokens

**Document in `app-src/src/lib/design-tokens.ts`:**

```typescript
export const colors = {
  primary: '#c3fd50',
  primaryHover: '#d4fe80',
  background: '#0f0f0f',
  surface: '#1a1a1a',
  border: '#262626',
  text: {
    primary: '#ffffff',
    secondary: '#999999',
    tertiary: '#666666',
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  rea: {
    resource: '#10b981',
    event: '#f59e0b',
    agent: '#3b82f6',
  },
}

export const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
}

export const radius = {
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
}
```

## Acceptance Criteria (Deferred)

- [x] Component documentation plan created
- [ ] Component library README written
- [ ] Every shared component has JSDoc comments
- [ ] Every shared component has usage example
- [ ] Props documented with TypeScript interfaces
- [ ] Design system tokens extracted
- [ ] 5+ components documented (Button, Card, Modal, Loading, Badge)

**Target completion:** Post-ETHBoulder (Feb 17+)

## Priority

**Medium.** Component documentation becomes critical when:
- Team grows beyond single developer
- Components are shared across multiple projects
- New contributors need onboarding

For now, TypeScript types provide sufficient inline documentation.

## Notes

This sprint demonstrates that good TypeScript types ARE documentation. The value of additional docs (README, examples, Storybook) scales with team size. For a single developer pre-event, comprehensive component docs are premature optimization.

Post-event, extracting common patterns into shared components (Button, Card, Modal) will reduce code duplication and make the docs valuable.
