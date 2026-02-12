# Thread Status Indicators

**Sprint 66** — Visual lifecycle indicators for thread status

## Status

**Deferred to post-ETHBoulder.** Thread Status Indicators is the second sprint of Cycle 8 Ebb (Communication Quality), adding visual status management to threads. Part of long-term Discord replacement vision. Not critical for Feb 13-16 event.

## Rationale

- **Event priority:** ETHBoulder starts in ~36 hours
- **Dependency:** Requires Sprint 62 (Thread List UI) to be implemented first
- **Current flow works:** Contributions don't use thread lifecycle
- **Post-event value:** Status indicators become useful when platform transitions to ongoing discourse with thread resolution workflows

## Context: Thread Lifecycle Management

From Sprint 58 (Thread Data Model), threads have five lifecycle states:
1. **open** — Active discussion, no resolution yet
2. **tagged** — Categorized for later processing
3. **resolved** — Question answered or discussion concluded
4. **consolidated** — Key insights extracted into knowledge graph
5. **archived** — Historical record, no longer active

Sprint 66 makes this lifecycle visible in the UI with color-coded indicators, filters, and state transition actions.

## Design

### Status Badge Component

```tsx
// components/ThreadStatusBadge.tsx
import { Circle, Tag, CheckCircle, FileText, Archive } from 'lucide-react'

type ThreadStatus = 'open' | 'tagged' | 'resolved' | 'consolidated' | 'archived'

interface Props {
  status: ThreadStatus
  size?: 'sm' | 'md'
}

const STATUS_CONFIG: Record<ThreadStatus, {
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}> = {
  open: {
    label: 'Open',
    icon: Circle,
    color: 'text-[#c3fd50]',
    bgColor: 'bg-[#c3fd50]/10'
  },
  tagged: {
    label: 'Tagged',
    icon: Tag,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10'
  },
  resolved: {
    label: 'Resolved',
    icon: CheckCircle,
    color: 'text-green-400',
    bgColor: 'bg-green-400/10'
  },
  consolidated: {
    label: 'Consolidated',
    icon: FileText,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10'
  },
  archived: {
    label: 'Archived',
    icon: Archive,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10'
  }
}

export function ThreadStatusBadge({ status, size = 'md' }: Props) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon
  
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs'
    : 'px-2.5 py-1 text-sm'
  
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
  
  return (
    <span className={`
      inline-flex items-center gap-1.5 rounded-full
      ${sizeClasses}
      ${config.bgColor}
      ${config.color}
      font-medium
    `}>
      <Icon className={iconSize} />
      {config.label}
    </span>
  )
}
```

### Thread List with Status Filters

```tsx
// components/ThreadList.tsx (enhanced)
import { useState } from 'react'
import { ThreadStatusBadge } from './ThreadStatusBadge'

type ThreadStatus = 'open' | 'tagged' | 'resolved' | 'consolidated' | 'archived'

export function ThreadList() {
  const [statusFilter, setStatusFilter] = useState<ThreadStatus | 'all'>('all')
  const [threads, setThreads] = useState<Thread[]>([])
  
  const statusCounts = threads.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1
    return acc
  }, {} as Record<ThreadStatus, number>)
  
  const filteredThreads = statusFilter === 'all'
    ? threads
    : threads.filter(t => t.status === statusFilter)
  
  return (
    <div>
      {/* Status filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        <FilterTab
          active={statusFilter === 'all'}
          onClick={() => setStatusFilter('all')}
          count={threads.length}
        >
          All
        </FilterTab>
        
        <FilterTab
          active={statusFilter === 'open'}
          onClick={() => setStatusFilter('open')}
          count={statusCounts.open || 0}
          color="text-[#c3fd50]"
        >
          Open
        </FilterTab>
        
        <FilterTab
          active={statusFilter === 'tagged'}
          onClick={() => setStatusFilter('tagged')}
          count={statusCounts.tagged || 0}
          color="text-blue-400"
        >
          Tagged
        </FilterTab>
        
        <FilterTab
          active={statusFilter === 'resolved'}
          onClick={() => setStatusFilter('resolved')}
          count={statusCounts.resolved || 0}
          color="text-green-400"
        >
          Resolved
        </FilterTab>
        
        <FilterTab
          active={statusFilter === 'consolidated'}
          onClick={() => setStatusFilter('consolidated')}
          count={statusCounts.consolidated || 0}
          color="text-purple-400"
        >
          Consolidated
        </FilterTab>
        
        <FilterTab
          active={statusFilter === 'archived'}
          onClick={() => setStatusFilter('archived')}
          count={statusCounts.archived || 0}
          color="text-gray-500"
        >
          Archived
        </FilterTab>
      </div>
      
      {/* Thread list */}
      <div className="space-y-2">
        {filteredThreads.map(thread => (
          <ThreadListItem key={thread.id} thread={thread} />
        ))}
      </div>
    </div>
  )
}

function FilterTab({ 
  active, 
  onClick, 
  count, 
  children,
  color = 'text-gray-400'
}: {
  active: boolean
  onClick: () => void
  count: number
  children: React.ReactNode
  color?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors
        ${active 
          ? 'bg-[#c3fd50] text-[#0f0f0f] font-medium' 
          : `bg-[#1a1a1a] border border-[#262626] ${color} hover:border-[#c3fd50]/30`
        }
      `}
    >
      {children}
      <span className={`ml-1.5 ${active ? 'opacity-70' : 'opacity-50'}`}>
        {count}
      </span>
    </button>
  )
}
```

### Status Transition Actions

```tsx
// components/ThreadActions.tsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { MoreHorizontal, Tag, CheckCircle, FileText, Archive, RotateCcw } from 'lucide-react'

interface Props {
  threadId: string
  currentStatus: ThreadStatus
  onStatusChange?: (newStatus: ThreadStatus) => void
}

export function ThreadActions({ threadId, currentStatus, onStatusChange }: Props) {
  const [showMenu, setShowMenu] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  
  async function updateStatus(newStatus: ThreadStatus) {
    setTransitioning(true)
    
    try {
      const { error } = await supabase
        .from('threads')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', threadId)
      
      if (error) throw error
      
      onStatusChange?.(newStatus)
      setShowMenu(false)
    } catch (err) {
      console.error('Failed to update thread status:', err)
      alert('Failed to update status')
    } finally {
      setTransitioning(false)
    }
  }
  
  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-1.5 hover:bg-[#262626] rounded transition-colors"
        disabled={transitioning}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      
      {showMenu && (
        <div className="absolute right-0 mt-1 bg-[#1a1a1a] border border-[#262626] rounded-lg shadow-lg py-1 z-10 min-w-[150px]">
          <div className="px-3 py-1.5 text-xs text-gray-500 border-b border-[#262626]">
            Change status
          </div>
          
          {currentStatus !== 'open' && (
            <StatusMenuItem
              icon={RotateCcw}
              label="Reopen"
              onClick={() => updateStatus('open')}
              disabled={transitioning}
            />
          )}
          
          {currentStatus !== 'tagged' && (
            <StatusMenuItem
              icon={Tag}
              label="Tag for review"
              onClick={() => updateStatus('tagged')}
              disabled={transitioning}
            />
          )}
          
          {currentStatus !== 'resolved' && (
            <StatusMenuItem
              icon={CheckCircle}
              label="Mark resolved"
              onClick={() => updateStatus('resolved')}
              disabled={transitioning}
            />
          )}
          
          {currentStatus !== 'consolidated' && (
            <StatusMenuItem
              icon={FileText}
              label="Consolidate"
              onClick={() => updateStatus('consolidated')}
              disabled={transitioning}
            />
          )}
          
          {currentStatus !== 'archived' && (
            <StatusMenuItem
              icon={Archive}
              label="Archive"
              onClick={() => updateStatus('archived')}
              disabled={transitioning}
            />
          )}
        </div>
      )}
    </div>
  )
}

function StatusMenuItem({ 
  icon: Icon, 
  label, 
  onClick, 
  disabled 
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#262626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  )
}
```

### Keyboard Shortcuts

```tsx
// Global keyboard shortcuts for status transitions
useEffect(() => {
  function handleKeyPress(e: KeyboardEvent) {
    if (!selectedThread) return
    
    // Ctrl/Cmd + Shift + key
    if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
      switch (e.key.toLowerCase()) {
        case 'o':
          e.preventDefault()
          updateThreadStatus(selectedThread.id, 'open')
          break
        case 't':
          e.preventDefault()
          updateThreadStatus(selectedThread.id, 'tagged')
          break
        case 'r':
          e.preventDefault()
          updateThreadStatus(selectedThread.id, 'resolved')
          break
        case 'c':
          e.preventDefault()
          updateThreadStatus(selectedThread.id, 'consolidated')
          break
        case 'a':
          e.preventDefault()
          updateThreadStatus(selectedThread.id, 'archived')
          break
      }
    }
  }
  
  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [selectedThread])
```

### Auto-consolidate Resolved Threads

```tsx
// Worker function: consolidate resolved threads after 7 days
async function autoConsolidateResolvedThreads() {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const { data: threads } = await supabase
    .from('threads')
    .select('id, title')
    .eq('status', 'resolved')
    .lt('updated_at', sevenDaysAgo.toISOString())
  
  for (const thread of threads || []) {
    // Call consolidate_thread() function from Sprint 58
    await supabase.rpc('consolidate_thread', {
      p_thread_id: thread.id
    })
    
    console.log(`Auto-consolidated thread: ${thread.title}`)
  }
}

// Run daily via cron
```

### Status Analytics

```sql
-- Thread status distribution
CREATE VIEW thread_status_analytics AS
SELECT 
  status,
  COUNT(*) as thread_count,
  COUNT(DISTINCT author_id) as unique_authors,
  AVG(message_count) as avg_messages,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) / 3600 as avg_lifetime_hours
FROM threads
GROUP BY status;

-- Status transition log (audit trail)
CREATE TABLE thread_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES participants(id),
  changed_at TIMESTAMPTZ DEFAULT now(),
  note TEXT,
  
  INDEX idx_history_thread ON thread_status_history(thread_id),
  INDEX idx_history_timestamp ON thread_status_history(changed_at)
);

-- Trigger to log status changes
CREATE OR REPLACE FUNCTION log_thread_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO thread_status_history (thread_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER thread_status_change_log
AFTER UPDATE ON threads
FOR EACH ROW
EXECUTE FUNCTION log_thread_status_change();
```

### Mobile Status Indicator

```tsx
// Compact status dot for mobile list view
export function ThreadStatusDot({ status }: { status: ThreadStatus }) {
  const config = STATUS_CONFIG[status]
  
  return (
    <div 
      className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}`}
      title={config.label}
    />
  )
}

// Mobile thread list item
<div className="flex items-center gap-3">
  <ThreadStatusDot status={thread.status} />
  <div className="flex-1 min-w-0">
    <h3 className="font-medium truncate">{thread.title}</h3>
    <p className="text-xs text-gray-500">{thread.message_count} messages</p>
  </div>
</div>
```

## Acceptance Criteria (Deferred)

- [x] Thread status indicators design documented
- [ ] Status badge component with 5 states (open/tagged/resolved/consolidated/archived)
- [ ] Color-coded visual indicators (green/blue/green/purple/gray)
- [ ] Filter tabs show count per status
- [ ] Clicking filter shows only threads with that status
- [ ] Thread actions menu allows status transitions
- [ ] Keyboard shortcuts for status changes (Ctrl+Shift+O/T/R/C/A)
- [ ] Status transition logged to audit trail
- [ ] Auto-consolidate resolved threads after 7 days
- [ ] Status analytics view shows distribution
- [ ] Mobile: compact status dot indicator

**Target completion:** Post-ETHBoulder (Feb 17+), after Sprint 62 (Thread List UI)

## Priority

**Medium (deferred).** Status indicators are workflow quality-of-life. Priority increases when:
- Thread UI is live (Sprint 62)
- Platform has many active threads
- Moderation/curation workflows needed
- Users request better thread organization

## Notes

Thread status indicators make the lifecycle visible and actionable. The five-state model from Sprint 58 maps to common community management patterns:

- **Open** → Default state, active discussion
- **Tagged** → Flagged for review/categorization
- **Resolved** → Question answered, no further action needed
- **Consolidated** → Insights extracted into knowledge graph (Sprint 58's `consolidate_thread()` function)
- **Archived** → Historical record, hidden from default views

The auto-consolidation workflow (resolved → consolidated after 7 days) ensures valuable threads don't stay in limbo. The consolidation function extracts key messages as contributions, feeds the AI extraction pipeline, and updates the knowledge graph.

The keyboard shortcuts (Ctrl+Shift+[key]) match common productivity tools. The audit trail (status history table) provides accountability and analytics.

Next sprint: Sprint 67 (Notification Preferences) adds per-channel notification controls and unread badges.