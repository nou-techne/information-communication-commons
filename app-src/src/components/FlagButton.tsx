import { useState } from 'react'
import { Flag, X } from 'lucide-react'
import { moderationStore } from '../stores/moderation-store'
import type { FlagReason, ContentFlag } from '../types/moderation'
import { FLAG_REASON_METADATA, createFlag } from '../types/moderation'
import { Button } from './Button'
import { Textarea } from './ui/Textarea'

interface FlagButtonProps {
  contentId: string
  contentType: ContentFlag['contentType']
  onFlagged?: () => void
}

export function FlagButton({ contentId, contentType, onFlagged }: FlagButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedReason, setSelectedReason] = useState<FlagReason | null>(null)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if already flagged
  const existingFlags = moderationStore.getForContent(contentId)
  const isFlagged = existingFlags.length > 0

  async function handleSubmit() {
    if (!selectedReason) return

    setIsSubmitting(true)

    try {
      const flag = createFlag({
        contentId,
        contentType,
        reason: selectedReason,
        reporterId: 'current-user', // TODO: Get from auth context
        notes: notes.trim() || undefined,
      })

      moderationStore.add(flag)
      
      setIsOpen(false)
      setSelectedReason(null)
      setNotes('')
      onFlagged?.()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Flag button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`p-2 rounded transition-colors ${
          isFlagged
            ? 'text-orange-500 hover:bg-[#1a1a1a]'
            : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1a]'
        }`}
        title={isFlagged ? 'Already flagged' : 'Report content'}
        aria-label="Flag content"
      >
        <Flag className="w-4 h-4" />
      </button>

      {/* Flag dialog */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#262626]">
              <h3 className="text-lg font-bold">Report Content</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-[#1a1a1a] rounded transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Reason for flagging
                </label>
                <div className="space-y-2">
                  {(Object.keys(FLAG_REASON_METADATA) as FlagReason[]).map(reason => (
                    <label
                      key={reason}
                      className={`flex items-start gap-3 p-3 rounded border transition-colors cursor-pointer ${
                        selectedReason === reason
                          ? 'border-[#c3fd50] bg-[#c3fd50]/10'
                          : 'border-[#262626] hover:border-[#3a3a3a]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="flag-reason"
                        value={reason}
                        checked={selectedReason === reason}
                        onChange={() => setSelectedReason(reason)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {FLAG_REASON_METADATA[reason].label}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {FLAG_REASON_METADATA[reason].description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="flag-notes" className="block text-sm font-medium mb-2">
                  Additional notes (optional)
                </label>
                <Textarea
                  id="flag-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Provide additional context..."
                  rows={3}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-[#262626]">
              <Button
                variant="secondary"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedReason || isSubmitting}
                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Flagged content indicator (subtle badge)
 */
export function FlaggedIndicator({ count = 1 }: { count?: number }) {
  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-600/20 text-orange-400 text-xs"
      title={`Flagged ${count} time${count > 1 ? 's' : ''}`}
    >
      <Flag className="w-3 h-3" />
      {count > 1 && <span>{count}</span>}
    </div>
  )
}
