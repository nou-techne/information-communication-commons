import { useState } from 'react'
import { Filter, ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardHeader, CardBody } from './ui/Card'
import type { NodeType } from '../types/graph-taxonomy'
import type { EdgeType } from '../types/edge-types'
import { NODE_TYPE_METADATA, getAllNodeTypes } from '../types/graph-taxonomy'
import { EDGE_TYPE_METADATA, getAllEdgeTypes } from '../types/edge-types'

export interface GraphFilterConfig {
  nodeTypes: Set<NodeType>
  edgeTypes: Set<EdgeType>
  dimensions: Set<string>
  minDegree: number
}

interface GraphFilterPanelProps {
  config: GraphFilterConfig
  onChange: (config: GraphFilterConfig) => void
  availableDimensions?: string[]
}

export function GraphFilterPanel({ config, onChange, availableDimensions = [] }: GraphFilterPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['nodes', 'edges']))

  function toggleSection(section: string) {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  function toggleNodeType(type: NodeType) {
    const next = new Set(config.nodeTypes)
    if (next.has(type)) {
      next.delete(type)
    } else {
      next.add(type)
    }
    onChange({ ...config, nodeTypes: next })
  }

  function toggleEdgeType(type: EdgeType) {
    const next = new Set(config.edgeTypes)
    if (next.has(type)) {
      next.delete(type)
    } else {
      next.add(type)
    }
    onChange({ ...config, edgeTypes: next })
  }

  function toggleDimension(dim: string) {
    const next = new Set(config.dimensions)
    if (next.has(dim)) {
      next.delete(dim)
    } else {
      next.add(dim)
    }
    onChange({ ...config, dimensions: next })
  }

  function selectAllNodes() {
    onChange({ ...config, nodeTypes: new Set(getAllNodeTypes()) })
  }

  function deselectAllNodes() {
    onChange({ ...config, nodeTypes: new Set() })
  }

  function selectAllEdges() {
    onChange({ ...config, edgeTypes: new Set(getAllEdgeTypes()) })
  }

  function deselectAllEdges() {
    onChange({ ...config, edgeTypes: new Set() })
  }

  const allNodeTypes = getAllNodeTypes()
  const allEdgeTypes = getAllEdgeTypes()

  return (
    <Card className="w-80 h-full overflow-y-auto">
      <CardHeader className="flex items-center gap-2">
        <Filter className="w-5 h-5 text-[#c3fd50]" />
        <h3 className="font-bold">Graph Filters</h3>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Node Types */}
        <div>
          <button
            onClick={() => toggleSection('nodes')}
            className="flex items-center justify-between w-full text-sm font-medium mb-2 hover:text-[#c3fd50]"
          >
            <span>Node Types</span>
            {expandedSections.has('nodes') ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {expandedSections.has('nodes') && (
            <div className="space-y-2">
              <div className="flex gap-2 mb-2">
                <button
                  onClick={selectAllNodes}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  All
                </button>
                <button
                  onClick={deselectAllNodes}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  None
                </button>
              </div>
              {allNodeTypes.map(type => {
                const meta = NODE_TYPE_METADATA[type]
                return (
                  <label key={type} className="flex items-center gap-2 text-sm cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={config.nodeTypes.has(type)}
                      onChange={() => toggleNodeType(type)}
                      className="rounded border-[#262626] bg-[#0f0f0f]"
                      style={{ accentColor: meta.color }}
                    />
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span className="text-gray-300 group-hover:text-white">{meta.label}</span>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        {/* Edge Types */}
        <div>
          <button
            onClick={() => toggleSection('edges')}
            className="flex items-center justify-between w-full text-sm font-medium mb-2 hover:text-[#c3fd50]"
          >
            <span>Edge Types</span>
            {expandedSections.has('edges') ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {expandedSections.has('edges') && (
            <div className="space-y-2">
              <div className="flex gap-2 mb-2">
                <button
                  onClick={selectAllEdges}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  All
                </button>
                <button
                  onClick={deselectAllEdges}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  None
                </button>
              </div>
              {allEdgeTypes.map(type => {
                const meta = EDGE_TYPE_METADATA[type]
                return (
                  <label key={type} className="flex items-center gap-2 text-sm cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={config.edgeTypes.has(type)}
                      onChange={() => toggleEdgeType(type)}
                      className="rounded border-[#262626] bg-[#0f0f0f]"
                      style={{ accentColor: meta.color }}
                    />
                    <span className="text-gray-300 group-hover:text-white">{meta.label}</span>
                    {!meta.directed && (
                      <span className="text-xs text-gray-500">↔</span>
                    )}
                  </label>
                )
              })}
            </div>
          )}
        </div>

        {/* Dimensions */}
        {availableDimensions.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('dimensions')}
              className="flex items-center justify-between w-full text-sm font-medium mb-2 hover:text-[#c3fd50]"
            >
              <span>Dimensions</span>
              {expandedSections.has('dimensions') ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            {expandedSections.has('dimensions') && (
              <div className="space-y-2">
                {availableDimensions.map(dim => (
                  <label key={dim} className="flex items-center gap-2 text-sm cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={config.dimensions.has(dim)}
                      onChange={() => toggleDimension(dim)}
                      className="rounded border-[#262626] bg-[#0f0f0f] text-[#c3fd50]"
                    />
                    <span className="text-gray-300 group-hover:text-white capitalize">{dim}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Min Degree */}
        <div>
          <button
            onClick={() => toggleSection('degree')}
            className="flex items-center justify-between w-full text-sm font-medium mb-2 hover:text-[#c3fd50]"
          >
            <span>Minimum Connections</span>
            {expandedSections.has('degree') ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {expandedSections.has('degree') && (
            <div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={config.minDegree}
                  onChange={e => onChange({ ...config, minDegree: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm text-gray-400 w-8 text-right">{config.minDegree}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Hide nodes with fewer than {config.minDegree} connection{config.minDegree !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
