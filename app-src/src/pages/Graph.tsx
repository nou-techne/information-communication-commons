import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Network } from 'lucide-react'
import * as d3 from 'd3'

interface Node {
  id: string
  title: string
  type: string
  rea_role: string
}

interface Link {
  source: string
  target: string
  type: string
}

interface GraphData {
  nodes: Node[]
  links: Link[]
}

const REA_COLORS: Record<string, string> = {
  resource: '#10b981', // green
  event: '#f59e0b', // amber
  agent: '#3b82f6', // blue
}

const TYPE_COLORS: Record<string, string> = {
  idea: '#8b5cf6',
  proposal: '#ec4899',
  commitment: '#ef4444',
  question: '#06b6d4',
  pattern: '#14b8a6',
  reflection: '#6366f1',
}

export function Graph() {
  const [data, setData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [colorBy, setColorBy] = useState<'rea' | 'type'>('rea')
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  useEffect(() => {
    async function loadGraph() {
      // Fetch artifacts
      const { data: artifacts } = await supabase
        .from('artifacts')
        .select('id, title, type, rea_role')
        .order('created_at', { ascending: false })
        .limit(100)

      // Fetch relationships
      const { data: relationships } = await supabase
        .from('artifact_relationships')
        .select('from_artifact_id, to_artifact_id, relationship_type')
        .limit(200)

      if (!artifacts) {
        setLoading(false)
        return
      }

      const nodes: Node[] = artifacts.map(a => ({
        id: a.id,
        title: a.title,
        type: a.type,
        rea_role: a.rea_role,
      }))

      const nodeIds = new Set(nodes.map(n => n.id))
      const links: Link[] = (relationships || [])
        .filter(r => nodeIds.has(r.from_artifact_id) && nodeIds.has(r.to_artifact_id))
        .map(r => ({
          source: r.from_artifact_id,
          target: r.to_artifact_id,
          type: r.relationship_type,
        }))

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

    // Define arrow markers for links
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

    const simulation = d3.forceSimulation(data.nodes as any)
      .force('link', d3.forceLink(data.links).id((d: any) => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(20))

    const link = g.append('g')
      .selectAll('line')
      .data(data.links)
      .enter().append('line')
      .attr('stroke', '#666')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', 1)
      .attr('marker-end', 'url(#arrowhead)')

    const node = g.append('g')
      .selectAll('circle')
      .data(data.nodes)
      .enter().append('circle')
      .attr('r', 8)
      .attr('fill', (d: any) => {
        if (colorBy === 'rea') {
          return REA_COLORS[d.rea_role] || '#999'
        } else {
          return TYPE_COLORS[d.type] || '#999'
        }
      })
      .attr('stroke', '#000')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('click', (_event, d: any) => {
        setSelectedNode(d)
      })
      .call(d3.drag<any, any>()
        .on('start', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        }) as any
      )

    node.append('title').text((d: any) => d.title)

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y)
    })

    // Zoom behavior
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Graph</h1>
          <p className="text-sm text-gray-400">{data.nodes.length} artifacts, {data.links.length} relationships</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setColorBy('rea')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              colorBy === 'rea' ? 'bg-[#c3fd50] text-[#0f0f0f]' : 'bg-[#262626] text-gray-300 hover:bg-[#333]'
            }`}
          >
            Color by REA
          </button>
          <button
            onClick={() => setColorBy('type')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              colorBy === 'type' ? 'bg-[#c3fd50] text-[#0f0f0f]' : 'bg-[#262626] text-gray-300 hover:bg-[#333]'
            }`}
          >
            Color by Type
          </button>
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

      <div className="flex gap-4 text-xs">
        {colorBy === 'rea' && (
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: REA_COLORS.resource }} />
              <span className="text-gray-400">Resource</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: REA_COLORS.event }} />
              <span className="text-gray-400">Event</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: REA_COLORS.agent }} />
              <span className="text-gray-400">Agent</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
