import { useState } from 'react'
import { Info, ChevronDown, ChevronUp } from 'lucide-react'
import { NODE_TYPE_METADATA, getAllNodeTypes } from '../types/graph-taxonomy'
import { EDGE_TYPE_METADATA, getAllEdgeTypes } from '../types/edge-types'

interface GraphLegendProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  defaultExpanded?: boolean
}

export function GraphLegend({ position = 'bottom-right', defaultExpanded = false }: GraphLegendProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  }

  const nodeTypes = getAllNodeTypes()
  const edgeTypes = getAllEdgeTypes()

  return (
    <div className={`fixed ${positionClasses[position]} z-40`}>
      <div className="bg-[#060a14] border border-[#1d2839] rounded-lg shadow-2xl overflow-hidden max-w-xs">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 hover:bg-[#0a101d] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#a6ed2a]" />
            <span className="text-sm font-medium">Graph Legend</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {/* Content */}
        {isExpanded && (
          <div className="p-3 pt-0 space-y-4 max-h-96 overflow-y-auto">
            {/* Node Types */}
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase mb-2">Node Types</div>
              <div className="space-y-1.5">
                {nodeTypes.map(type => {
                  const meta = NODE_TYPE_METADATA[type]
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: meta.color }}
                      />
                      <span className="text-xs text-gray-300">{meta.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Edge Types */}
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase mb-2">Edge Types</div>
              <div className="space-y-1.5">
                {edgeTypes.slice(0, 8).map(type => {
                  const meta = EDGE_TYPE_METADATA[type]
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <div className="flex items-center flex-shrink-0 w-6">
                        <div
                          className="h-0.5 w-full"
                          style={{
                            backgroundColor: meta.color,
                            borderStyle: meta.directed ? 'solid' : 'dashed',
                          }}
                        />
                        {meta.directed && (
                          <div
                            className="w-0 h-0 -ml-1"
                            style={{
                              borderLeft: `4px solid ${meta.color}`,
                              borderTop: '3px solid transparent',
                              borderBottom: '3px solid transparent',
                            }}
                          />
                        )}
                      </div>
                      <span className="text-xs text-gray-300">{meta.label}</span>
                    </div>
                  )
                })}
                {edgeTypes.length > 8 && (
                  <div className="text-xs text-gray-500 italic">+{edgeTypes.length - 8} more...</div>
                )}
              </div>
            </div>

            {/* Visual Key */}
            <div className="pt-2 border-t border-[#1d2839]">
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="w-3 h-0.5 bg-gray-500" />
                  <span>Solid = Directed</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="w-3 h-0.5 border-t border-dashed border-gray-500" />
                  <span>Dashed = Bidirectional</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
