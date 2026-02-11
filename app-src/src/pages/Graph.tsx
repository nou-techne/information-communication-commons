import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Network } from 'lucide-react'
import * as d3 from 'd3'

interface Node {
  id: string
  title: string
  type: string
  rea_role: string
  isDimension?: boolean
  dimensionLabel?: string
  dimensionColor?: string
  dimensionDegree?: number
}

interface Link {
  source: string
  target: string
  type: string
  weight?: number
}

interface GraphData {
  nodes: Node[]
  links: Link[]
}

const REA_COLORS: Record<string, string> = {
  resource: '#10b981',
  event: '#f59e0b',
  agent: '#3b82f6',
}

const TYPE_COLORS: Record<string, string> = {
  idea: '#8b5cf6',
  proposal: '#ec4899',
  commitment: '#ef4444',
  question: '#06b6d4',
  pattern: '#14b8a6',
  reflection: '#6366f1',
}

const DIMENSION_COLORS: Record<string, string> = {
  e: '#4a8c6f',
  H: '#c4956a',
  L: '#c3fd50',
  A: '#8bbfff',
  M: '#7ccfb8',
  T: '#e8927c',
}

const DIMENSION_LABELS: Record<string, string> = {
  e: 'e/ Environment',
  H: 'H/ Human',
  L: 'L/ Language',
  A: 'A/ Artifacts',
  M: 'M/ Methodology',
  T: 'T/ Training',
}

const DIMENSION_KEYS = ['e', 'H', 'L', 'A', 'M', 'T']

export function Graph() {
  const [data, setData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [colorBy, setColorBy] = useState<'rea' | 'type' | 'dimension'>('rea')
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  useEffect(() => {
    async function loadGraph() {
      const [{ data: artifacts }, { data: relationships }, { data: artifactDimensions }] = await Promise.all([
        supabase.from('artifacts').select('id, title, type, rea_role').order('created_at', { ascending: false }).limit(100),
        supabase.from('artifact_relationships').select('from_artifact_id, to_artifact_id, type').limit(200),
        supabase.from('artifact_dimensions').select('artifact_id, dimension, key, weight'),
      ])

      if (!artifacts) {
        setLoading(false)
        return
      }

      // Count dimension connections per artifact
      const degreeCounts: Record<string, number> = {}
      for (const ad of (artifactDimensions || [])) {
        degreeCounts[ad.artifact_id] = (degreeCounts[ad.artifact_id] || 0) + 1
      }

      const nodes: Node[] = artifacts.map(a => ({
        id: a.id,
        title: a.title,
        type: a.type,
        rea_role: a.rea_role || 'resource',
        dimensionDegree: degreeCounts[a.id] || 0,
      }))

      // Add dimension nodes
      for (const key of DIMENSION_KEYS) {
        nodes.push({
          id: `dim-${key}`,
          title: DIMENSION_LABELS[key],
          type: 'dimension',
          rea_role: 'dimension',
          isDimension: true,
          dimensionLabel: key,
          dimensionColor: DIMENSION_COLORS[key],
        })
      }

      const nodeIds = new Set(nodes.map(n => n.id))
      const links: Link[] = (relationships || [])
        .filter(r => nodeIds.has(r.from_artifact_id) && nodeIds.has(r.to_artifact_id))
        .map(r => ({
          source: r.from_artifact_id,
          target: r.to_artifact_id,
          type: r.type,
        }))

      // Add dimension edges
      for (const ad of (artifactDimensions || [])) {
        if (nodeIds.has(ad.artifact_id)) {
          links.push({
            source: ad.artifact_id,
            target: `dim-${ad.dimension}`,
            type: 'dimension_link',
            weight: ad.weight || 0.5,
          })
        }
      }

      setData({ nodes, links })
      setLoading(false)
    }

    loadGraph()
  }, [])

  useEffect(() => {
    if (!data || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    svg.selectAll('*').remove()

    const g = svg.append('g')

    svg.append('defs').selectAll('marker')
      .data(['end'])
      .enter().append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#666')

    const cx = width / 2
    const cy = height / 2
    const ringRadius = Math.min(width, height) * 0.3

    // Pre-position dimension nodes in hexagonal layout
    const simNodes = data.nodes.map((n, _i) => {
      const copy = { ...n } as any
      if (n.isDimension) {
        const dimIdx = DIMENSION_KEYS.indexOf(n.dimensionLabel!)
        const angle = (dimIdx / 6) * Math.PI * 2 - Math.PI / 2
        copy.fx = cx + ringRadius * Math.cos(angle)
        copy.fy = cy + ringRadius * Math.sin(angle)
      }
      return copy
    })

    const simulation = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink(data.links as any).id((d: any) => d.id).distance((d: any) => d.type === 'dimension_link' ? 120 : 80))
      .force('charge', d3.forceManyBody().strength((d: any) => d.isDimension ? -600 : -200))
      .force('center', d3.forceCenter(cx, cy).strength(0.05))
      .force('collision', d3.forceCollide().radius((d: any) => d.isDimension ? 30 : 12))

    // Draw links
    const link = g.append('g')
      .selectAll('line')
      .data(data.links)
      .enter().append('line')
      .attr('stroke', (d: any) => {
        if (d.type === 'dimension_link') {
          const dimKey = (d.target as string).replace('dim-', '')
          return DIMENSION_COLORS[dimKey] || '#666'
        }
        return '#666'
      })
      .attr('stroke-opacity', (d: any) => d.type === 'dimension_link' ? 0.25 : 0.3)
      .attr('stroke-width', (d: any) => d.type === 'dimension_link' ? (d.weight || 0.5) * 3 + 1 : 1)
      .attr('marker-end', (d: any) => d.type === 'dimension_link' ? null : 'url(#arrowhead)')

    // Draw nodes
    const node = g.append('g')
      .selectAll('circle')
      .data(simNodes)
      .enter().append('circle')
      .attr('r', (d: any) => {
        if (d.isDimension) return 22
        const degree = d.dimensionDegree || 0
        return Math.min(14, Math.max(6, 6 + degree * 1.5))
      })
      .attr('fill', (d: any) => {
        if (d.isDimension) return d.dimensionColor
        if (colorBy === 'rea') return REA_COLORS[d.rea_role] || '#999'
        if (colorBy === 'type') return TYPE_COLORS[d.type] || '#999'
        // dimension mode: color artifacts by their strongest dimension
        const artifactLinks = data.links.filter(l => {
          const src = typeof l.source === 'string' ? l.source : (l.source as any).id
          return src === d.id && l.type === 'dimension_link'
        })
        if (artifactLinks.length > 0) {
          const strongest = artifactLinks.reduce((a, b) => (b.weight || 0) > (a.weight || 0) ? b : a)
          const dimKey = (typeof strongest.target === 'string' ? strongest.target : (strongest.target as any).id).replace('dim-', '')
          return DIMENSION_COLORS[dimKey] || '#999'
        }
        return '#555'
      })
      .attr('stroke', (d: any) => d.isDimension ? '#fff' : '#000')
      .attr('stroke-width', (d: any) => d.isDimension ? 2 : 1.5)
      .attr('stroke-opacity', (d: any) => d.isDimension ? 0.3 : 1)
      .style('cursor', 'pointer')
      .on('click', (_event, d: any) => {
        if (!d.isDimension) setSelectedNode(d)
      })
      .call(d3.drag<any, any>()
        .on('start', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          if (!d.isDimension) { d.fx = d.x; d.fy = d.y }
        })
        .on('drag', (event, d: any) => {
          if (!d.isDimension) { d.fx = event.x; d.fy = event.y }
        })
        .on('end', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0)
          if (!d.isDimension) { d.fx = null; d.fy = null }
        }) as any
      )

    node.append('title').text((d: any) => d.title)

    // Persistent labels on dimension nodes
    const dimLabels = g.append('g')
      .selectAll('text')
      .data(simNodes.filter((d: any) => d.isDimension))
      .enter().append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#0f0f0f')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none')
      .text((d: any) => `${d.dimensionLabel}/`)

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y)

      dimLabels
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y)
    })

    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom as any)

  }, [data, colorBy])

  if (loading) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <Network className="w-12 h-12 text-gray-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Loading knowledge graph...</p>
        </div>
      </div>
    )
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <Network className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No artifacts in the graph yet</p>
        </div>
      </div>
    )
  }

  const artifactCount = data.nodes.filter(n => !n.isDimension).length
  const relCount = data.links.filter(l => l.type !== 'dimension_link').length
  const dimLinkCount = data.links.filter(l => l.type === 'dimension_link').length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Graph</h1>
          <p className="text-sm text-gray-400">
            {artifactCount} artifacts, {relCount} relationships, {dimLinkCount} dimension links
          </p>
        </div>
        <div className="flex gap-2">
          {(['rea', 'type', 'dimension'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setColorBy(mode)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                colorBy === mode ? 'bg-[#c3fd50] text-[#0f0f0f]' : 'bg-[#262626] text-gray-300 hover:bg-[#333]'
              }`}
            >
              {mode === 'rea' ? 'REA' : mode === 'type' ? 'Type' : 'Dimension'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 bg-[#0a0a0a] border border-[#262626] rounded-lg overflow-hidden">
          <svg ref={svgRef} className="w-full h-[600px]" />
        </div>

        {selectedNode && (
          <div className="w-64 bg-[#1a1a1a] border border-[#262626] rounded-lg p-4">
            <h3 className="font-bold mb-2">{selectedNode.title}</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="ml-2 px-2 py-0.5 rounded-full bg-[#262626] text-xs">{selectedNode.type}</span>
              </div>
              <div>
                <span className="text-gray-500">REA Role:</span>
                <span className="ml-2 px-2 py-0.5 rounded-full bg-[#262626] text-xs">{selectedNode.rea_role}</span>
              </div>
              {(selectedNode.dimensionDegree || 0) > 0 && (
                <div>
                  <span className="text-gray-500">Dimensions:</span>
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-[#262626] text-xs">{selectedNode.dimensionDegree}</span>
                </div>
              )}
              <button
                onClick={() => window.location.href = `/app/artifact/${selectedNode.id}`}
                className="w-full mt-4 px-3 py-2 bg-[#c3fd50] text-[#0f0f0f] rounded-lg hover:bg-[#d4fe80] text-sm"
              >
                View details
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 text-xs flex-wrap">
        {colorBy === 'rea' && (
          <div className="flex gap-4">
            {Object.entries(REA_COLORS).map(([key, color]) => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-gray-400 capitalize">{key}</span>
              </div>
            ))}
          </div>
        )}
        {colorBy === 'type' && (
          <div className="flex gap-4">
            {Object.entries(TYPE_COLORS).map(([key, color]) => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-gray-400 capitalize">{key}</span>
              </div>
            ))}
          </div>
        )}
        {colorBy === 'dimension' && (
          <div className="flex gap-4">
            {Object.entries(DIMENSION_COLORS).map(([key, color]) => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-gray-400">{DIMENSION_LABELS[key]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
