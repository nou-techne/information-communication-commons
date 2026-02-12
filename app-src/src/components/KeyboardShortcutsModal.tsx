import { useEffect, useState } from 'react'
import { X, Keyboard } from 'lucide-react'
import { colors } from '../styles/tokens'

const shortcuts = [
  { keys: ['?'], description: 'Show keyboard shortcuts' },
  { keys: ['Esc'], description: 'Close modal or dialog' },
  { keys: ['Cmd', 'K'], description: 'Search' },
  { keys: ['/', 's'], description: 'Focus search' },
  { keys: ['c'], description: 'Create new thread' },
  { keys: ['r'], description: 'Reply to message' },
  { keys: ['e'], description: 'Edit message' },
  { keys: ['t'], description: 'Add tag' },
  { keys: ['Shift', 'Enter'], description: 'Send message' },
]

export function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Open on '?'
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement
        // Don't trigger if typing in input/textarea
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
        e.preventDefault()
        setIsOpen(true)
      }
      // Close on Escape
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 w-full max-w-2xl"
        onClick={e => e.stopPropagation()}
        style={{ borderColor: colors.border }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Keyboard className="w-6 h-6 text-[#c3fd50]" />
            <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {shortcuts.map((shortcut, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <span className="text-gray-300 text-sm">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, j) => (
                  <kbd
                    key={j}
                    className="px-2 py-1 text-xs font-mono rounded border"
                    style={{
                      backgroundColor: colors.bg,
                      borderColor: colors.border,
                      color: colors.textSecondary,
                    }}
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t" style={{ borderColor: colors.border }}>
          <p className="text-xs text-gray-500 text-center">
            Press <kbd className="px-1.5 py-0.5 text-xs font-mono rounded border border-gray-700 bg-[#0f0f0f]">?</kbd> anytime to show this help
          </p>
        </div>
      </div>
    </div>
  )
}
