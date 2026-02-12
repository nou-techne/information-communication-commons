import { useState, useEffect } from 'react'
import { Flag, Check, X, Trash2 } from 'lucide-react'
import { moderationStore } from '../stores/moderation-store'
import type { ContentFlag, FlagReason } from '../types/moderation'
import { FLAG_REASON_METADATA } from '../types/moderation'
import { Button } from '../components/Button'
import { Card } from '../components/ui/Card'

export default function ModerationPage() {
  const [flags, setFlags] = useState<ContentFlag[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'dismissed' | 'actioned'>('pending')

  function loadFlags() {
    const allFlags = filter === 'all' 
      ? moderationStore.list()
      : moderationStore.filterByStatus(filter)
    
    setFlags(allFlags.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ))
  }

  useEffect(() => {
    loadFlags()
  }, [filter])

  function handleApprove(id: string) {
    moderationStore.review(id, {
      status: 'actioned',
      reviewedBy: 'current-user', // TODO: Get from auth context
      action: 'hide',
    })
    loadFlags()
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  function handleDismiss(id: string) {
    moderationStore.review(id, {
      status: 'dismissed',
      reviewedBy: 'current-user',
    })
    loadFlags()
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  function handleBulkApprove() {
    moderationStore.bulkApprove(
      Array.from(selectedIds),
      'current-user',
      'hide'
    )
    setSelectedIds(new Set())
    loadFlags()
  }

  function handleBulkDismiss() {
    moderationStore.bulkDismiss(
      Array.from(selectedIds),
      'current-user'
    )
    setSelectedIds(new Set())
    loadFlags()
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === flags.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(flags.map(f => f.id)))
    }
  }

  const counts = moderationStore.countByStatus()

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Moderation Queue</h1>
          <p className="text-gray-400">Review and action flagged content</p>
        </div>
        <div className="flex items-center gap-2">
          <Flag className="w-5 h-5 text-[#c3fd50]" />
          <span className="text-2xl font-bold">{counts.pending}</span>
          <span className="text-gray-500">pending</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'reviewed', 'dismissed', 'actioned'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded transition-colors ${
              filter === status
                ? 'bg-[#c3fd50] text-black'
                : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#262626]'
            }`}
          >
            {status} {status !== 'all' && `(${counts[status] || 0})`}
          </button>
        ))}
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 mb-4 p-4 bg-[#1a1a1a] border border-[#262626] rounded-lg">
          <span className="text-sm text-gray-400">
            {selectedIds.size} selected
          </span>
          <Button
            onClick={handleBulkApprove}
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="w-4 h-4 mr-2" />
            Approve All
          </Button>
          <Button
            onClick={handleBulkDismiss}
            variant="secondary"
          >
            <X className="w-4 h-4 mr-2" />
            Dismiss All
          </Button>
        </div>
      )}

      {/* Queue list */}
      {flags.length === 0 ? (
        <Card className="p-8 text-center">
          <Flag className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">No flagged content</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Select all */}
          {flags.length > 1 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-[#0f0f0f] rounded">
              <input
                type="checkbox"
                checked={selectedIds.size === flags.length}
                onChange={toggleSelectAll}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-400">Select all</span>
            </div>
          )}

          {flags.map(flag => (
            <Card key={flag.id} className="p-4">
              <div className="flex gap-4">
                <input
                  type="checkbox"
                  checked={selectedIds.has(flag.id)}
                  onChange={() => toggleSelect(flag.id)}
                  className="w-4 h-4 mt-1"
                />

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        getReasonColor(flag.reason)
                      }`}>
                        {FLAG_REASON_METADATA[flag.reason].label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {flag.contentType}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(flag.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {flag.notes && (
                    <p className="text-sm text-gray-300 mb-2">{flag.notes}</p>
                  )}

                  <div className="text-xs text-gray-500 mb-3">
                    Reported by {flag.reporterName || flag.reporterId}
                  </div>

                  {flag.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(flag.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDismiss(flag.id)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function getReasonColor(reason: FlagReason): string {
  const severity = FLAG_REASON_METADATA[reason].severity
  
  switch (severity) {
    case 'critical':
      return 'bg-red-600 text-white'
    case 'high':
      return 'bg-orange-600 text-white'
    case 'medium':
      return 'bg-yellow-600 text-black'
    case 'low':
      return 'bg-blue-600 text-white'
  }
}
