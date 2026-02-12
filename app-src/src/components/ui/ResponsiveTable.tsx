import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useBreakpointAtLeast } from '../../hooks/useBreakpoint'

export interface TableColumn<T> {
  key: keyof T | string
  label: string
  priority?: number // Lower number = higher priority, shown on mobile
  render?: (item: T) => React.ReactNode
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  keyExtractor: (item: T) => string
  mobilePriorityThreshold?: number
}

export function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  mobilePriorityThreshold = 2,
}: ResponsiveTableProps<T>) {
  const isDesktop = useBreakpointAtLeast('tablet')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  function toggleRow(key: string) {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  // Desktop: traditional table
  if (isDesktop) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#262626]">
              {columns.map(col => (
                <th
                  key={String(col.key)}
                  className="text-left py-3 px-4 text-gray-400 font-medium"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(item => {
              const key = keyExtractor(item)
              return (
                <tr key={key} className="border-b border-[#262626] hover:bg-[#1a1a1a]">
                  {columns.map(col => (
                    <td key={String(col.key)} className="py-3 px-4">
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  // Mobile: card layout
  const priorityColumns = columns
    .filter(col => (col.priority || 999) <= mobilePriorityThreshold)
    .sort((a, b) => (a.priority || 999) - (b.priority || 999))

  const hiddenColumns = columns.filter(
    col => (col.priority || 999) > mobilePriorityThreshold
  )

  return (
    <div className="space-y-2">
      {data.map(item => {
        const key = keyExtractor(item)
        const isExpanded = expandedRows.has(key)

        return (
          <div
            key={key}
            className="bg-[#1a1a1a] border border-[#262626] rounded-lg overflow-hidden"
          >
            {/* Priority columns */}
            <div className="p-4">
              {priorityColumns.map(col => (
                <div key={String(col.key)} className="mb-2 last:mb-0">
                  <div className="text-xs text-gray-500 mb-1">{col.label}</div>
                  <div className="text-sm text-white">
                    {col.render ? col.render(item) : item[col.key]}
                  </div>
                </div>
              ))}
            </div>

            {/* Expand button and hidden columns */}
            {hiddenColumns.length > 0 && (
              <>
                <button
                  onClick={() => toggleRow(key)}
                  className="w-full flex items-center justify-between px-4 py-2 bg-[#0f0f0f] hover:bg-[#1a1a1a] transition-colors text-sm text-gray-400"
                >
                  <span>
                    {isExpanded ? 'Show less' : `Show ${hiddenColumns.length} more`}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-4 border-t border-[#262626] space-y-3">
                    {hiddenColumns.map(col => (
                      <div key={String(col.key)}>
                        <div className="text-xs text-gray-500 mb-1">{col.label}</div>
                        <div className="text-sm text-white">
                          {col.render ? col.render(item) : item[col.key]}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
