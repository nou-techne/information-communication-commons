import { MessageSquare, Tag, CheckCircle, Archive, Merge, Clock } from 'lucide-react'

interface TimelineEvent {
  id: string
  type: 'message' | 'status_change' | 'resolution' | 'tag_added' | 'consolidation'
  content: string
  actor: string
  timestamp: string
  metadata?: Record<string, string>
}

interface ThreadTimelineProps {
  events: TimelineEvent[]
}

const EVENT_CONFIG: Record<TimelineEvent['type'], { icon: typeof MessageSquare; color: string; label: string }> = {
  message: { icon: MessageSquare, color: '#c3fd50', label: 'Message' },
  status_change: { icon: Clock, color: '#60a5fa', label: 'Status' },
  resolution: { icon: CheckCircle, color: '#a78bfa', label: 'Resolved' },
  tag_added: { icon: Tag, color: '#fbbf24', label: 'Tagged' },
  consolidation: { icon: Merge, color: '#fb923c', label: 'Consolidated' },
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function ThreadTimeline({ events }: ThreadTimelineProps) {
  if (events.length === 0) {
    return <div className="text-center text-gray-500 text-sm py-4">No activity yet</div>
  }

  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[#262626]" />

      {events.map((event, i) => {
        const config = EVENT_CONFIG[event.type]
        const Icon = config.icon

        return (
          <div key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
            {/* Icon dot */}
            <div
              className="absolute -left-6 w-6 h-6 rounded-full flex items-center justify-center bg-[#0f0f0f] border-2"
              style={{ borderColor: config.color }}
            >
              <Icon className="w-3 h-3" style={{ color: config.color }} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 ml-2">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-medium" style={{ color: config.color }}>{config.label}</span>
                <span className="text-xs text-gray-600">{timeAgo(event.timestamp)}</span>
              </div>
              <p className="text-sm text-gray-300 truncate">{event.content}</p>
              <span className="text-xs text-gray-500">{event.actor}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
