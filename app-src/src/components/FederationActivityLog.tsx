import { useState } from 'react'
import { RefreshCw, Upload, Download, AlertCircle, CheckCircle, XCircle, Filter } from 'lucide-react'
import { Card, CardHeader, CardBody } from './ui/Card'

export type FederationEventType = 
  | 'sync-started'
  | 'sync-completed'
  | 'items-sent'
  | 'items-received'
  | 'conflict-resolved'
  | 'error'

export interface FederationEvent {
  id: string
  type: FederationEventType
  timestamp: string
  peerId?: string
  peerName?: string
  message: string
  metadata?: {
    itemCount?: number
    itemsSent?: number
    itemsReceived?: number
    conflictStrategy?: string
    errorDetails?: string
  }
}

interface FederationActivityLogProps {
  events: FederationEvent[]
  maxHeight?: string
}

export function FederationActivityLog({ events, maxHeight = '400px' }: FederationActivityLogProps) {
  const [filterType, setFilterType] = useState<FederationEventType | 'all'>('all')

  function getEventIcon(type: FederationEventType) {
    switch (type) {
      case 'sync-started':
        return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
      case 'sync-completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'items-sent':
        return <Upload className="w-4 h-4 text-[#a6ed2a]" />
      case 'items-received':
        return <Download className="w-4 h-4 text-blue-400" />
      case 'conflict-resolved':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />
    }
  }

  function getEventColor(type: FederationEventType) {
    switch (type) {
      case 'sync-started':
        return 'border-blue-500/30'
      case 'sync-completed':
        return 'border-green-500/30'
      case 'items-sent':
        return 'border-[#a6ed2a]/30'
      case 'items-received':
        return 'border-blue-500/30'
      case 'conflict-resolved':
        return 'border-yellow-500/30'
      case 'error':
        return 'border-red-500/30'
    }
  }

  function formatTimestamp(timestamp: string) {
    const date = new Date(timestamp)
    const now = Date.now()
    const diff = now - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (seconds < 60) return `${seconds}s ago`
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const filteredEvents = filterType === 'all' 
    ? events 
    : events.filter(e => e.type === filterType)

  const eventTypes: Array<{ type: FederationEventType | 'all'; label: string }> = [
    { type: 'all', label: 'All' },
    { type: 'sync-started', label: 'Sync Started' },
    { type: 'sync-completed', label: 'Completed' },
    { type: 'items-sent', label: 'Sent' },
    { type: 'items-received', label: 'Received' },
    { type: 'conflict-resolved', label: 'Conflicts' },
    { type: 'error', label: 'Errors' },
  ]

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h3 className="font-bold">Activity Log</h3>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as FederationEventType | 'all')}
            className="bg-[#080c16] border border-[#1d2839] rounded px-2 py-1 text-xs text-gray-300"
          >
            {eventTypes.map(({ type, label }) => (
              <option key={type} value={type}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardBody>
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No federation activity yet
          </div>
        ) : (
          <div
            className="space-y-2 overflow-y-auto pr-2"
            style={{ maxHeight }}
          >
            {filteredEvents.map(event => (
              <div
                key={event.id}
                className={`p-3 rounded border-l-2 ${getEventColor(event.type)} bg-[#0a101d]`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getEventIcon(event.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="text-sm text-white">{event.message}</div>
                      <div className="text-xs text-gray-500 whitespace-nowrap">
                        {formatTimestamp(event.timestamp)}
                      </div>
                    </div>
                    {event.peerName && (
                      <div className="text-xs text-gray-400 mb-1">
                        Peer: {event.peerName}
                      </div>
                    )}
                    {event.metadata && (
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        {event.metadata.itemsSent !== undefined && (
                          <span>↑ {event.metadata.itemsSent} sent</span>
                        )}
                        {event.metadata.itemsReceived !== undefined && (
                          <span>↓ {event.metadata.itemsReceived} received</span>
                        )}
                        {event.metadata.itemCount !== undefined && (
                          <span>{event.metadata.itemCount} items</span>
                        )}
                        {event.metadata.conflictStrategy && (
                          <span>Strategy: {event.metadata.conflictStrategy}</span>
                        )}
                        {event.metadata.errorDetails && (
                          <div className="w-full mt-1 text-red-400 text-xs">
                            {event.metadata.errorDetails}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
