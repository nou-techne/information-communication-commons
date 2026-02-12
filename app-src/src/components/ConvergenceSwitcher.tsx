import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Plus, Check } from 'lucide-react'
import { convergenceStore } from '../stores/convergence-store'
import type { Convergence } from '../types/convergence'

interface ConvergenceSwitcherProps {
  onNewConvergence?: () => void
}

export function ConvergenceSwitcher({ onNewConvergence }: ConvergenceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [active, setActive] = useState<Convergence | null>(null)
  const [convergences, setConvergences] = useState<Convergence[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load convergences and active selection
  useEffect(() => {
    loadData()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  function loadData() {
    setActive(convergenceStore.getActive())
    setConvergences(convergenceStore.list())
  }

  function selectConvergence(id: string) {
    convergenceStore.setActive(id)
    loadData()
    setIsOpen(false)
  }

  function handleNewConvergence() {
    setIsOpen(false)
    onNewConvergence?.()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded border border-[#262626] hover:border-[#c3fd50] bg-[#0f0f0f] hover:bg-[#1a1a1a] transition-colors"
      >
        <span className="text-sm font-medium">
          {active ? active.name : 'Select Convergence'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-64 bg-[#0a0a0a] border border-[#262626] rounded-lg shadow-2xl overflow-hidden z-50">
          <div className="max-h-96 overflow-y-auto">
            {convergences.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No convergences yet
              </div>
            ) : (
              convergences.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => selectConvergence(conv.id)}
                  className="w-full text-left px-4 py-3 hover:bg-[#1a1a1a] transition-colors border-b border-[#262626] last:border-b-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white truncate">
                          {conv.name}
                        </span>
                        {active?.id === conv.id && (
                          <Check className="w-4 h-4 text-[#c3fd50] flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {conv.location.city}, {conv.location.country}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(conv.startDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        -{' '}
                        {new Date(conv.endDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                        conv.status === 'active'
                          ? 'bg-green-500/20 text-green-400'
                          : conv.status === 'upcoming'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {conv.status}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          <button
            onClick={handleNewConvergence}
            className="w-full flex items-center gap-2 px-4 py-3 bg-[#1a1a1a] hover:bg-[#262626] transition-colors border-t border-[#262626]"
          >
            <Plus className="w-4 h-4 text-[#c3fd50]" />
            <span className="text-sm font-medium text-[#c3fd50]">New Convergence</span>
          </button>
        </div>
      )}
    </div>
  )
}
