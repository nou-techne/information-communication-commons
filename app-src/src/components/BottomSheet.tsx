import { useEffect, useRef } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { useSwipe } from '../hooks/useSwipe'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  snapPoints?: number[] // Heights in px: [min, mid, max]
}

export function BottomSheet({ 
  isOpen, 
  onClose, 
  title, 
  children,
  snapPoints = [200, 400, 600]
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragHandleRef = useRef<HTMLDivElement>(null)

  const swipeHandlers = useSwipe({
    minDistance: 50,
    onSwipeDown: (distance) => {
      if (distance > 100) {
        onClose()
      }
    },
  })

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#262626] rounded-t-2xl z-50 transition-transform"
        style={{
          maxHeight: '90vh',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {/* Drag handle */}
        <div
          ref={dragHandleRef}
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
          {...swipeHandlers}
        >
          <div className="w-12 h-1 bg-[#262626] rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 pb-3 border-b border-[#262626]">
            <h3 className="text-lg font-bold">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#1a1a1a] rounded transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: '80vh' }}>
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}
