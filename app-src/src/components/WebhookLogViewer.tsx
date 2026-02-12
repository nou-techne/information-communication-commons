import { useState } from 'react'
import { CheckCircle, XCircle, Clock, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'
import type { WebhookDelivery } from '../types/webhooks'

interface WebhookLogViewerProps {
  deliveries: WebhookDelivery[]
  onRetry?: (deliveryId: string) => void
}

const statusConfig = {
  sent: { icon: CheckCircle, color: '#10b981', label: 'Sent' },
  failed: { icon: XCircle, color: '#ef4444', label: 'Failed' },
  pending: { icon: Clock, color: '#f59e0b', label: 'Pending' },
  retrying: { icon: RefreshCw, color: '#3b82f6', label: 'Retrying' },
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function WebhookLogViewer({ deliveries, onRetry }: WebhookLogViewerProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (deliveries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        No webhook deliveries yet
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {deliveries.map(delivery => {
        const config = statusConfig[delivery.status]
        const Icon = config.icon
        const isExpanded = expandedIds.has(delivery.id)

        return (
          <div
            key={delivery.id}
            className="bg-[#0a101d] border border-[#1d2839] rounded-lg overflow-hidden"
          >
            <div className="flex items-center gap-3 p-4">
              <button
                onClick={() => toggleExpand(delivery.id)}
                className="text-gray-400 hover:text-white"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              <Icon className="w-5 h-5 flex-shrink-0" style={{ color: config.color }} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white">{delivery.event_type}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: config.color + '20', color: config.color }}
                  >
                    {config.label}
                  </span>
                  {delivery.response_status && (
                    <span className="text-xs text-gray-500">HTTP {delivery.response_status}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{timeAgo(delivery.created_at)}</span>
                  <span>Attempts: {delivery.attempts}</span>
                  {delivery.next_retry_at && (
                    <span>Next retry: {timeAgo(delivery.next_retry_at)}</span>
                  )}
                </div>
              </div>

              {delivery.status === 'failed' && onRetry && (
                <button
                  onClick={() => onRetry(delivery.id)}
                  className="text-gray-400 hover:text-white px-3 py-1.5 rounded border border-[#1d2839] hover:border-[#a6ed2a] transition-colors text-sm"
                >
                  Retry
                </button>
              )}
            </div>

            {isExpanded && (
              <div className="border-t border-[#1d2839] bg-[#080c16] p-4">
                <div className="mb-3">
                  <div className="text-xs font-bold text-gray-500 uppercase mb-1">Webhook URL</div>
                  <div className="text-xs text-gray-300 font-mono break-all">{delivery.url}</div>
                </div>

                {delivery.response_body && (
                  <div className="mb-3">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Response</div>
                    <pre className="text-xs text-gray-300 bg-black p-2 rounded overflow-x-auto max-h-48 overflow-y-auto">
                      {typeof delivery.response_body === 'string'
                        ? delivery.response_body
                        : JSON.stringify(delivery.response_body, null, 2)}
                    </pre>
                  </div>
                )}

                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase mb-1">Event ID</div>
                  <div className="text-xs text-gray-400 font-mono">{delivery.event_id}</div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
