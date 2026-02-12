import { X, ExternalLink, Calendar, Tag, Link as LinkIcon } from 'lucide-react'
import { Card, CardHeader, CardBody } from './ui/Card'
import { Button } from './Button'
import { NODE_TYPE_METADATA, type NodeType } from '../types/graph-taxonomy'
import { EDGE_TYPE_METADATA, type EdgeType } from '../types/edge-types'

export interface NodeData {
  id: string
  label: string
  type?: NodeType
  dimension?: string
  dimensions?: string[]
  tags?: string[]
  created_at?: string
  description?: string
  metadata?: Record<string, any>
  outgoing?: Array<{ target: string; type: EdgeType; label?: string }>
  incoming?: Array<{ source: string; type: EdgeType; label?: string }>
  threadIds?: string[]
}

interface NodeDetailSidebarProps {
  node: NodeData | null
  onClose: () => void
  onNodeClick?: (nodeId: string) => void
  onThreadClick?: (threadId: string) => void
}

export function NodeDetailSidebar({ node, onClose, onNodeClick, onThreadClick }: NodeDetailSidebarProps) {
  if (!node) return null

  const typeMeta = node.type ? NODE_TYPE_METADATA[node.type] : null
  const allDimensions = node.dimensions || (node.dimension ? [node.dimension] : [])
  const allTags = node.tags || []
  const outgoing = node.outgoing || []
  const incoming = node.incoming || []

  function formatDate(dateStr?: string) {
    if (!dateStr) return 'Unknown'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="fixed top-0 right-0 h-full w-96 bg-[#060a14] border-l border-[#1d2839] shadow-2xl overflow-y-auto z-50">
      <div className="sticky top-0 bg-[#060a14] border-b border-[#1d2839] p-4 flex items-center justify-between">
        <h2 className="font-bold text-lg">Node Details</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#0a101d]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Type Badge */}
        {typeMeta && (
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: typeMeta.color }}
            />
            <span className="text-sm font-medium" style={{ color: typeMeta.color }}>
              {typeMeta.label}
            </span>
          </div>
        )}

        {/* Label */}
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{node.label}</h3>
          {node.description && (
            <p className="text-sm text-gray-400">{node.description}</p>
          )}
        </div>

        {/* Metadata Row */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {node.created_at && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(node.created_at)}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <LinkIcon className="w-3 h-3" />
            <span>{outgoing.length + incoming.length} connections</span>
          </div>
        </div>

        {/* Dimensions */}
        {allDimensions.length > 0 && (
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase mb-2">Dimensions</div>
            <div className="flex flex-wrap gap-1">
              {allDimensions.map(dim => (
                <span
                  key={dim}
                  className="px-2 py-0.5 text-xs rounded-full bg-[#0a101d] text-gray-300 border border-[#1d2839]"
                >
                  {dim}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {allTags.length > 0 && (
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              Tags
            </div>
            <div className="flex flex-wrap gap-1">
              {allTags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs rounded bg-[#a6ed2a]/10 text-[#a6ed2a] border border-[#a6ed2a]/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Outgoing Connections */}
        {outgoing.length > 0 && (
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase mb-2">
              Outgoing ({outgoing.length})
            </div>
            <div className="space-y-1">
              {outgoing.map((conn, i) => {
                const edgeMeta = EDGE_TYPE_METADATA[conn.type]
                return (
                  <button
                    key={`${conn.target}-${i}`}
                    onClick={() => onNodeClick?.(conn.target)}
                    className="w-full text-left p-2 rounded bg-[#0a101d] hover:bg-[#1d2839] border border-[#1d2839] hover:border-[#a6ed2a]/30 transition-colors group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs font-medium"
                        style={{ color: edgeMeta.color }}
                      >
                        {edgeMeta.label}
                      </span>
                      <span className="text-gray-600">→</span>
                    </div>
                    <div className="text-sm text-gray-300 group-hover:text-white flex items-center gap-1">
                      {conn.label || conn.target}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Incoming Connections */}
        {incoming.length > 0 && (
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase mb-2">
              Incoming ({incoming.length})
            </div>
            <div className="space-y-1">
              {incoming.map((conn, i) => {
                const edgeMeta = EDGE_TYPE_METADATA[conn.type]
                return (
                  <button
                    key={`${conn.source}-${i}`}
                    onClick={() => onNodeClick?.(conn.source)}
                    className="w-full text-left p-2 rounded bg-[#0a101d] hover:bg-[#1d2839] border border-[#1d2839] hover:border-[#a6ed2a]/30 transition-colors group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-600">←</span>
                      <span
                        className="text-xs font-medium"
                        style={{ color: edgeMeta.color }}
                      >
                        {edgeMeta.label}
                      </span>
                    </div>
                    <div className="text-sm text-gray-300 group-hover:text-white flex items-center gap-1">
                      {conn.label || conn.source}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Linked Threads */}
        {node.threadIds && node.threadIds.length > 0 && (
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase mb-2">
              Related Threads ({node.threadIds.length})
            </div>
            <div className="space-y-1">
              {node.threadIds.map(threadId => (
                <button
                  key={threadId}
                  onClick={() => onThreadClick?.(threadId)}
                  className="w-full text-left p-2 rounded bg-[#0a101d] hover:bg-[#1d2839] border border-[#1d2839] hover:border-[#a6ed2a]/30 transition-colors text-sm text-gray-300 hover:text-white"
                >
                  Thread #{threadId.slice(0, 8)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Additional Metadata */}
        {node.metadata && Object.keys(node.metadata).length > 0 && (
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase mb-2">Metadata</div>
            <div className="space-y-1 text-xs">
              {Object.entries(node.metadata).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="text-gray-500 capitalize">{key}:</span>
                  <span className="text-gray-300">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
