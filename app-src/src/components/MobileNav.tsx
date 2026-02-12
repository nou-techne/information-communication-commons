import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useBreakpointAtLeast } from '../hooks/useBreakpoint'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export function MobileNav({ isOpen, onClose, children }: MobileNavProps) {
  const isDesktop = useBreakpointAtLeast('desktop')
  const drawerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number>(0)
  const touchCurrentX = useRef<number>(0)

  // Close drawer on desktop
  useEffect(() => {
    if (isDesktop && isOpen) {
      onClose()
    }
  }, [isDesktop, isOpen, onClose])

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

  // Close on Escape key
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

  // Swipe gesture handling
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchCurrentX.current = e.touches[0].clientX
  }

  function handleTouchMove(e: React.TouchEvent) {
    touchCurrentX.current = e.touches[0].clientX
    const diff = touchCurrentX.current - touchStartX.current

    // Only allow swipe left (to close)
    if (diff < 0 && drawerRef.current) {
      const translate = Math.abs(diff)
      drawerRef.current.style.transform = `translateX(-${translate}px)`
    }
  }

  function handleTouchEnd() {
    const diff = touchCurrentX.current - touchStartX.current

    if (drawerRef.current) {
      drawerRef.current.style.transform = ''
    }

    // Close if swiped more than 100px to the left
    if (diff < -100) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-40 transition-opacity"
        onClick={onClose}
        style={{ opacity: isOpen ? 1 : 0 }}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-[#0a0a0a] border-r border-[#262626] z-50 transition-transform overflow-y-auto"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#262626]">
          <h2 className="text-lg font-bold">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#1a1a1a] rounded transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </>
  )
}
