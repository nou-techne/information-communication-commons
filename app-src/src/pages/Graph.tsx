import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Network, Flame } from 'lucide-react'
import { CoordinateButton } from '../components/CoordinateButton'
import * as d3 from 'd3'
import { EmptyState } from '../components/ui/EmptyState'

/* ── colour maps ── */
const DIMENSION_COLORS: Record<string, string> = {
  e: '#4a8c6f', H: '#c4956a', L: '#a6ed2a', A: '#8bbfff', M: '#7ccfb8', T: '#e8927c',
}
const DIMENSION_LABELS: Record<string, string> = {
  e: 'e/ Environment', H: 'H/ Human', L: 'L/ Language', A: 'A/ Artifacts', M: 'M/ Methodology', T: 'T/ Training',
}

const REA_COLORS: Record<string, string> = { resource: '#10b981', event: '#f59e0b', agent: '#3b82f6' }
const TYPE_COLORS: Record<string, string> = {
  idea: '#8b5cf6', proposal: '#ec4899', commitment: '#ef4444',
  question: '#06b6d4', pattern: '#14b8a6', reflection: '#6366f1',
}

/* ── types ── */
type ViewMode = 'chain' | 'social' | 'semantic'

interface Artifact { id: string; title: string; type: string; rea_role: string; created_by: string | null; steward_id: string | null }
interface Contribution { id: string; content: string; created_at: string; seq: number; chain_hash: string; extraction: any; participant_id: string | null }
interface Relationship { from_artifact_id: string; to_artifact_id: string; type: string }
interface TagEntry { artifact_id: string; tags: { name: string } }
interface Participant { id: string; name: string }

interface GNode {
  id: string; label: string; kind: 'artifact' | 'contribution' | 'participant'
  r: number; color: string; dashed?: boolean
  type?: string; rea_role?: string; seq?: number
  participantName?: string; tagCount?: number; clusterId?: number; clusterLabel?: string
  dimColor?: string | null
  x?: number; y?: number; fx?: number | null; fy?: number | null
}
interface GLink { source: string; target: string; dashed?: boolean; weight?: number; label?: string }

interface GraphProps { replaySeq?: number | null }

export function Graph({ replaySeq }: GraphProps = {}) {
  const [viewMode, setViewMode] = useState<ViewMode>('chain')
  const [dimOverlay, setDimOverlay] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<GNode | null>(null)

  // raw data
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [tagEntries, setTagEntries] = useState<TagEntry[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [chainMaxSeq, setChainMaxSeq] = useState(0)

  const svgRef = useRef<SVGSVGElement>(null)
  const graphContainerRef = useRef<HTMLDivElement>(null)
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null)
  const zoomRef = useRef<any>(null)

  /* ── load data ── */
  const loadData = useCallback(async () => {
    const [aRes, cRes, rRes, tRes, pRes, hRes] = await Promise.all([
      supabase.from('artifacts').select('id, title, type, rea_role, created_by, steward_id').limit(300),
      supabase.from('contributions').select('id, content, created_at, seq, chain_hash, extraction, participant_id').order('seq'),
      supabase.from('artifact_relationships').select('from_artifact_id, to_artifact_id, type').limit(500),
      supabase.from('artifact_tags').select('artifact_id, tags!inner(name)'),
      supabase.from('public_participants').select('id, name'),
      supabase.rpc('chain_head'),
    ])
    if (aRes.data) setArtifacts(aRes.data as Artifact[])
    if (cRes.data) setContributions(cRes.data as Contribution[])
    if (rRes.data) setRelationships(rRes.data as Relationship[])
    if (tRes.data) setTagEntries(tRes.data as TagEntry[])
    if (pRes.data) setParticipants(pRes.data as Participant[])
    if (hRes.data && Array.isArray(hRes.data) && hRes.data.length > 0) {
      setChainMaxSeq((hRes.data as any)[0]?.head_seq ?? 0)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
    const sub = supabase.channel('graph-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'artifacts' }, () => loadData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'artifact_relationships' }, () => loadData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'artifact_tags' }, () => loadData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contributions' }, () => loadData())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'contributions' }, () => loadData())
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [loadData])

  /* ── helpers ── */
  const artifactDimMap = useCallback((): Map<string, string> => {
    const m = new Map<string, string>()
    for (const t of tagEntries) {
      if (t.tags?.name?.startsWith('hlamt:')) {
        const dim = t.tags.name.replace('hlamt:', '')
        if (!m.has(t.artifact_id)) m.set(t.artifact_id, dim)
      }
    }
    return m
  }, [tagEntries])

  const artifactTagsMap = useCallback((): Map<string, string[]> => {
    const m = new Map<string, string[]>()
    for (const t of tagEntries) {
      const list = m.get(t.artifact_id) || []
      list.push(t.tags?.name || '')
      m.set(t.artifact_id, list)
    }
    return m
  }, [tagEntries])

  // Replay filter: which contributions are visible
  const visibleContributions = useCallback((): Contribution[] => {
    if (replaySeq == null || replaySeq <= 0) return contributions
    return contributions.filter(c => c.seq <= replaySeq)
  }, [contributions, replaySeq])

  // Which artifact titles are visible based on visible contributions' extraction
  const visibleArtifactIds = useCallback((): Set<string> => {
    if (replaySeq == null || replaySeq <= 0) return new Set(artifacts.map(a => a.id))
    const visCont = visibleContributions()
    const titles = new Set<string>()
    for (const c of visCont) {
      const ext = c.extraction as any
      if (ext?.artifacts) {
        for (const ea of ext.artifacts) {
          if (ea.title) titles.add(ea.title)
        }
      }
    }
    return new Set(artifacts.filter(a => titles.has(a.title)).map(a => a.id))
  }, [artifacts, replaySeq, visibleContributions])

  /* ── build graph per view ── */
  const buildGraph = useCallback((): { nodes: GNode[]; links: GLink[] } => {
    const visIds = visibleArtifactIds()
    const visArts = artifacts.filter(a => visIds.has(a.id))
    const dimMap = artifactDimMap()
    const tagsMap = artifactTagsMap()

    if (replaySeq === 0) return { nodes: [], links: [] }

    if (viewMode === 'chain') {
      const visCont = visibleContributions()
      const nodes: GNode[] = []
      const links: GLink[] = []
      const artIdSet = new Set(visArts.map(a => a.id))

      // contribution nodes
      for (const c of visCont) {
        const dim = null
        nodes.push({
          id: `c-${c.id}`, label: c.content?.slice(0, 40) || `Contribution #${c.seq}`,
          kind: 'contribution', r: 16, color: '#a6ed2a', dashed: true,
          seq: c.seq, dimColor: null,
        })
      }

      // artifact nodes
      for (const a of visArts) {
        const dc = dimOverlay ? (DIMENSION_COLORS[dimMap.get(a.id) || ''] || null) : null
        nodes.push({
          id: a.id, label: a.title, kind: 'artifact', r: 8,
          color: dc || REA_COLORS[a.rea_role] || '#999',
          type: a.type, rea_role: a.rea_role, dimColor: dc,
        })
      }

      // contribution→artifact edges (match extraction titles)
      for (const c of visCont) {
        const ext = c.extraction as any
        if (ext?.artifacts) {
          for (const ea of ext.artifacts) {
            const match = visArts.find(a => a.title === ea.title)
            if (match) {
              links.push({ source: `c-${c.id}`, target: match.id, dashed: true, label: 'extracted' })
            }
          }
        }
      }

      // artifact→artifact
      for (const r of relationships) {
        if (artIdSet.has(r.from_artifact_id) && artIdSet.has(r.to_artifact_id)) {
          links.push({ source: r.from_artifact_id, target: r.to_artifact_id })
        }
      }

      return { nodes, links }
    }

    if (viewMode === 'social') {
      const nodes: GNode[] = []
      const links: GLink[] = []
      const artIdSet = new Set(visArts.map(a => a.id))
      const participantIds = new Set<string>()

      // figure out which participants appear
      for (const a of visArts) {
        if (a.created_by) participantIds.add(a.created_by)
        if (a.steward_id) participantIds.add(a.steward_id)
      }
      // also from visible contributions
      for (const c of visibleContributions()) {
        if (c.participant_id) participantIds.add(c.participant_id)
      }

      const visParticipants = participants.filter(p => participantIds.has(p.id))

      for (const p of visParticipants) {
        const initials = p.name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
        nodes.push({
          id: `p-${p.id}`, label: p.name, kind: 'participant', r: 18,
          color: '#c4956a', participantName: initials,
        })
      }

      for (const a of visArts) {
        const dc = dimOverlay ? (DIMENSION_COLORS[dimMap.get(a.id) || ''] || null) : null
        nodes.push({
          id: a.id, label: a.title, kind: 'artifact', r: 7,
          color: dc || REA_COLORS[a.rea_role] || '#999',
          type: a.type, rea_role: a.rea_role, dimColor: dc,
        })
        // participant→artifact edges
        if (a.created_by && participantIds.has(a.created_by)) {
          links.push({ source: `p-${a.created_by}`, target: a.id })
        }
        if (a.steward_id && a.steward_id !== a.created_by && participantIds.has(a.steward_id)) {
          links.push({ source: `p-${a.steward_id}`, target: a.id })
        }
      }

      // participant↔participant weighted by shared tags
      const pArr = visParticipants
      for (let i = 0; i < pArr.length; i++) {
        for (let j = i + 1; j < pArr.length; j++) {
          const tagsA = new Set<string>()
          const tagsB = new Set<string>()
          for (const a of visArts) {
            if (a.created_by === pArr[i].id || a.steward_id === pArr[i].id) {
              for (const t of (tagsMap.get(a.id) || [])) tagsA.add(t)
            }
            if (a.created_by === pArr[j].id || a.steward_id === pArr[j].id) {
              for (const t of (tagsMap.get(a.id) || [])) tagsB.add(t)
            }
          }
          let shared = 0
          for (const t of tagsA) if (tagsB.has(t)) shared++
          if (shared > 0) {
            links.push({ source: `p-${pArr[i].id}`, target: `p-${pArr[j].id}`, weight: shared })
          }
        }
      }

      return { nodes, links }
    }

    // semantic
    const nodes: GNode[] = []
    const links: GLink[] = []
    const tagsMap2 = tagsMap

    for (const a of visArts) {
      const tags = tagsMap2.get(a.id) || []
      const dc = dimOverlay ? (DIMENSION_COLORS[dimMap.get(a.id) || ''] || null) : null
      nodes.push({
        id: a.id, label: a.title, kind: 'artifact',
        r: Math.max(5, Math.min(18, 5 + tags.length * 2)),
        color: dc || TYPE_COLORS[a.type] || '#999',
        type: a.type, rea_role: a.rea_role, tagCount: tags.length, dimColor: dc,
      })
    }

    // tag co-occurrence edges
    const tagToArts = new Map<string, string[]>()
    for (const a of visArts) {
      for (const t of (tagsMap2.get(a.id) || [])) {
        const list = tagToArts.get(t) || []
        list.push(a.id)
        tagToArts.set(t, list)
      }
    }
    const edgeWeights = new Map<string, number>()
    for (const [, artIds] of tagToArts) {
      for (let i = 0; i < artIds.length; i++) {
        for (let j = i + 1; j < artIds.length; j++) {
          const key = artIds[i] < artIds[j] ? `${artIds[i]}|${artIds[j]}` : `${artIds[j]}|${artIds[i]}`
          edgeWeights.set(key, (edgeWeights.get(key) || 0) + 1)
        }
      }
    }
    for (const [key, w] of edgeWeights) {
      const [a, b] = key.split('|')
      links.push({ source: a, target: b, weight: w })
    }

    return { nodes, links }
  }, [artifacts, contributions, relationships, tagEntries, participants, viewMode, dimOverlay, replaySeq, visibleArtifactIds, visibleContributions, artifactDimMap, artifactTagsMap])

  /* ── D3 rendering ── */
  useEffect(() => {
    if (loading || !svgRef.current) return

    const { nodes, links } = buildGraph()
    if (nodes.length === 0) {
      if (simulationRef.current) { simulationRef.current.stop(); simulationRef.current = null }
      d3.select(svgRef.current).selectAll('*').remove()
      return
    }

    if (simulationRef.current) { simulationRef.current.stop(); simulationRef.current = null }

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    const width = svgRef.current.clientWidth || 800
    const height = svgRef.current.clientHeight || 600
    const cx = width / 2, cy = height / 2

    const g = svg.append('g')

    // arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead').attr('viewBox', '0 -5 10 10')
      .attr('refX', 20).attr('refY', 0).attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
      .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#666')

    const simNodes = nodes.map(n => ({ ...n })) as any[]
    const simLinks = links.map(l => ({ ...l })) as any[]

    // position contributions along x by seq in chain view
    if (viewMode === 'chain') {
      const contribs = simNodes.filter((n: any) => n.kind === 'contribution')
      contribs.sort((a: any, b: any) => (a.seq || 0) - (b.seq || 0))
      contribs.forEach((n: any, i: number) => {
        n.x = 100 + (i / Math.max(1, contribs.length - 1)) * (width - 200)
        n.y = cy
      })
    }

    const simulation = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink(simLinks).id((d: any) => d.id).distance((d: any) => {
        if (d.dashed) return 60
        return 80 + (1 / (1 + (d.weight || 0))) * 40
      }))
      .force('charge', d3.forceManyBody().strength((d: any) => {
        if (d.kind === 'participant') return -600
        if (d.kind === 'contribution') return -400
        return -120
      }))
      .force('center', d3.forceCenter(cx, cy).strength(0.04))
      .force('collision', d3.forceCollide().radius((d: any) => (d.r || 8) + 4))

    if (viewMode === 'chain') {
      simulation.force('contribY', d3.forceY(cy).strength((d: any) => d.kind === 'contribution' ? 0.15 : 0))
    }

    simulationRef.current = simulation

    // Draw links
    const linkSel = g.append('g').selectAll('line').data(simLinks).enter().append('line')
      .attr('stroke', '#666').attr('stroke-opacity', 0.3)
      .attr('stroke-width', (d: any) => Math.min(4, 1 + (d.weight || 0) * 0.5))
      .attr('stroke-dasharray', (d: any) => d.dashed ? '5,3' : null)
      .attr('marker-end', (d: any) => d.dashed ? null : 'url(#arrowhead)')

    // Semantic clusters: convex hulls
    let hullSel: any = null
    if (viewMode === 'semantic') {
      hullSel = g.append('g').attr('class', 'hulls')
    }

    // Draw nodes
    const nodeSel = g.append('g').selectAll('g').data(simNodes).enter().append('g')
      .style('cursor', 'pointer')
      .on('click', (_event: any, d: any) => setSelectedNode(d))
      .call(d3.drag<any, any>()
        .on('start', (event: any, d: any) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
        .on('drag', (event: any, d: any) => { d.fx = event.x; d.fy = event.y })
        .on('end', (event: any, d: any) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null })
      )

    nodeSel.append('circle')
      .attr('r', (d: any) => d.r)
      .attr('fill', (d: any) => d.color)
      .attr('stroke', (d: any) => d.dashed ? '#a6ed2a' : '#000')
      .attr('stroke-width', (d: any) => d.kind === 'artifact' ? 1.5 : 2)
      .attr('stroke-dasharray', (d: any) => d.dashed ? '4,2' : null)

    // Labels for contribution/participant nodes
    nodeSel.filter((d: any) => d.kind === 'participant' || d.kind === 'contribution')
      .append('text')
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('fill', '#080c16').attr('font-size', '10px').attr('font-weight', 'bold')
      .attr('pointer-events', 'none')
      .text((d: any) => d.kind === 'participant' ? (d.participantName || '') : `#${d.seq ?? ''}`)

    nodeSel.append('title').text((d: any) => d.label)

    // Cluster detection for semantic view
    function computeHulls() {
      if (viewMode !== 'semantic' || !hullSel) return
      hullSel.selectAll('*').remove()

      // simple proximity clusters via tag co-occurrence: use connected components of strong edges
      const nodeMap = new Map(simNodes.map((n: any) => [n.id, n]))
      const parent = new Map<string, string>()
      function find(x: string): string {
        if (!parent.has(x)) parent.set(x, x)
        if (parent.get(x) !== x) parent.set(x, find(parent.get(x)!))
        return parent.get(x)!
      }
      function union(a: string, b: string) { parent.set(find(a), find(b)) }

      for (const l of simLinks) {
        const sId = typeof l.source === 'string' ? l.source : l.source.id
        const tId = typeof l.target === 'string' ? l.target : l.target.id
        if ((l.weight || 0) >= 2) union(sId, tId)
      }

      const groups = new Map<string, any[]>()
      for (const n of simNodes) {
        const root = find(n.id)
        const list = groups.get(root) || []
        list.push(n)
        groups.set(root, list)
      }

      const tagsMap = artifactTagsMap()
      for (const [, members] of groups) {
        if (members.length < 3) continue
        const points: [number, number][] = members.map((n: any) => [n.x as number, n.y as number])
        const hull = d3.polygonHull(points)
        if (!hull) continue

        // find most common tag in cluster
        const tagCounts = new Map<string, number>()
        for (const m of members) {
          for (const t of (tagsMap.get(m.id) || [])) {
            tagCounts.set(t, (tagCounts.get(t) || 0) + 1)
          }
        }
        let bestTag = ''
        let bestCount = 0
        for (const [t, c] of tagCounts) {
          if (c > bestCount) { bestTag = t; bestCount = c }
        }

        // Expand hull slightly
        const centroid = d3.polygonCentroid(hull)
        const expanded = hull.map(([x, y]) => {
          const dx = x - centroid[0], dy = y - centroid[1]
          const len = Math.sqrt(dx * dx + dy * dy)
          return [x + (dx / len) * 20, y + (dy / len) * 20] as [number, number]
        })

        hullSel.append('path')
          .attr('d', `M${expanded.map(p => p.join(',')).join('L')}Z`)
          .attr('fill', 'rgba(166,237,42,0.08)')
          .attr('stroke', 'rgba(166,237,42,0.25)')
          .attr('stroke-width', 1)

        hullSel.append('text')
          .attr('x', centroid[0]).attr('y', centroid[1] - members.length * 2 - 10)
          .attr('text-anchor', 'middle').attr('fill', 'rgba(166,237,42,0.6)')
          .attr('font-size', '10px').text(bestTag)

        // tag cluster id on nodes
        for (const m of members) {
          m.clusterLabel = bestTag
        }
      }
    }

    simulation.on('tick', () => {
      linkSel
        .attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y)
      nodeSel.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
      computeHulls()
    })

    const zoom = d3.zoom().scaleExtent([0.1, 4]).on('zoom', (event: any) => g.attr('transform', event.transform))
    svg.call(zoom as any)
    zoomRef.current = zoom

    return () => { if (simulationRef.current) simulationRef.current.stop() }
  }, [loading, buildGraph, viewMode, artifactTagsMap])

  /* ── render ── */
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

  const { nodes: currentNodes } = buildGraph()
  if (currentNodes.length === 0 && replaySeq !== 0) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <EmptyState
          icon={<Network className="w-12 h-12" />}
          title="No artifacts yet"
          description="Submit your first contribution to seed the knowledge graph."
        />
      </div>
    )
  }

  const artCount = currentNodes.filter(n => n.kind === 'artifact').length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Graph</h1>
          <p className="text-sm text-gray-400">{artCount} artifacts{viewMode === 'chain' ? `, ${currentNodes.filter(n => n.kind === 'contribution').length} contributions` : viewMode === 'social' ? `, ${currentNodes.filter(n => n.kind === 'participant').length} participants` : ''}</p>
        </div>
        <div className="flex gap-2">
          {(['chain', 'social', 'semantic'] as ViewMode[]).map(m => (
            <button key={m} onClick={() => { setViewMode(m); setSelectedNode(null) }}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${viewMode === m ? 'bg-[#a6ed2a] text-[#080c16]' : 'bg-[#1d2839] text-gray-300 hover:bg-[#333]'}`}>
              {m === 'chain' ? 'Chain' : m === 'social' ? 'Social' : 'Semantic'}
            </button>
          ))}
          <button onClick={() => setDimOverlay(!dimOverlay)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${dimOverlay ? 'bg-[#c4956a] text-[#080c16]' : 'bg-[#1d2839] text-gray-300 hover:bg-[#333]'}`}
            title="Toggle H-LAM/T dimension color overlay">
            Dim Colors
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2 mb-4">
        {viewMode === 'chain'
          ? 'Convergence Chain — Contributions in the order they were added, linked by hash. Shows how the commons grew over time. Each node is a contribution; edges trace the append-only chain.'
          : viewMode === 'social'
          ? 'Social Graph — People and what they contributed. Shows who is connected through shared artifacts, revealing collaboration patterns and participant clusters.'
          : 'Semantic Graph — Artifacts clustered by meaning and dimension. Shows how ideas, proposals, and commitments relate to each other across the e/H-LAM/T/S framework.'}
      </p>

      <div className="flex gap-4">
        <div ref={graphContainerRef} className="flex-1 bg-[#060a14] border border-[#1d2839] rounded-lg overflow-hidden relative">
          <svg ref={svgRef} className="w-full h-full min-h-[400px]" style={{ maxHeight: '700px' }} />

          {/* zoom / fullscreen controls */}
          <div className="absolute bottom-3 right-3 flex flex-col gap-1">
            <button onClick={() => { if (svgRef.current && zoomRef.current) d3.select(svgRef.current).transition().duration(200).call(zoomRef.current.scaleBy, 1.4) }}
              className="w-8 h-8 rounded-lg bg-[#0a101d]/90 border border-[#1d2839] text-gray-300 hover:text-white hover:border-[#a6ed2a] transition-colors flex items-center justify-center text-lg font-bold backdrop-blur-sm" aria-label="Zoom in">+</button>
            <button onClick={() => { if (svgRef.current && zoomRef.current) d3.select(svgRef.current).transition().duration(200).call(zoomRef.current.scaleBy, 0.7) }}
              className="w-8 h-8 rounded-lg bg-[#0a101d]/90 border border-[#1d2839] text-gray-300 hover:text-white hover:border-[#a6ed2a] transition-colors flex items-center justify-center text-lg font-bold backdrop-blur-sm" aria-label="Zoom out">−</button>
            <button onClick={() => { const el = graphContainerRef.current; if (!el) return; document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen() }}
              className="w-8 h-8 rounded-lg bg-[#0a101d]/90 border border-[#1d2839] text-gray-300 hover:text-white hover:border-[#a6ed2a] transition-colors flex items-center justify-center backdrop-blur-sm" aria-label="Toggle fullscreen">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
            </button>
          </div>

          {/* detail panel */}
          {selectedNode && (
            <div className="w-64 bg-[#0a101d] border border-[#1d2839] rounded-lg p-4 absolute top-4 right-4 z-50 max-h-[80vh] overflow-y-auto shadow-xl">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold flex-1 text-sm">{selectedNode.label}</h3>
                <button onClick={() => setSelectedNode(null)} className="ml-2 p-1 text-gray-500 hover:text-white hover:bg-[#1d2839] rounded transition-colors flex-shrink-0" aria-label="Close">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="space-y-2 text-sm">
                {selectedNode.kind === 'artifact' && <>
                  <div><span className="text-gray-500">Type:</span><span className="ml-2 px-2 py-0.5 rounded-full bg-[#1d2839] text-xs">{selectedNode.type}</span></div>
                  <div><span className="text-gray-500">REA:</span><span className="ml-2 px-2 py-0.5 rounded-full bg-[#1d2839] text-xs">{selectedNode.rea_role}</span></div>
                  {selectedNode.tagCount != null && <div><span className="text-gray-500">Tags:</span><span className="ml-2 text-xs">{selectedNode.tagCount}</span></div>}
                  {selectedNode.clusterLabel && <div><span className="text-gray-500">Cluster:</span><span className="ml-2 text-xs">{selectedNode.clusterLabel}</span></div>}
                  <div className="mt-4 space-y-2">
                    <CoordinateButton artifactId={selectedNode.id} />
                    <button onClick={() => window.location.href = `/app/artifact/${selectedNode.id}`} className="w-full px-3 py-2 bg-[#a6ed2a] text-[#080c16] rounded-lg hover:bg-[#b8f247] text-sm">View details</button>
                  </div>
                </>}
                {selectedNode.kind === 'contribution' && <>
                  <div><span className="text-gray-500">Seq:</span><span className="ml-2 text-xs">#{selectedNode.seq}</span></div>
                  <div className="text-gray-400 text-xs mt-2">{selectedNode.label}</div>
                </>}
                {selectedNode.kind === 'participant' && <>
                  <div><span className="text-gray-500">Name:</span><span className="ml-2 text-xs">{selectedNode.label}</span></div>
                </>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs flex-wrap">
        {viewMode === 'chain' && <>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#a6ed2a] border border-dashed border-[#a6ed2a]" /><span className="text-gray-400">Contribution</span></div>
          {Object.entries(REA_COLORS).map(([k, c]) => <div key={k} className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} /><span className="text-gray-400 capitalize">{k}</span></div>)}
        </>}
        {viewMode === 'social' && <>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#c4956a]" /><span className="text-gray-400">Participant</span></div>
          {Object.entries(REA_COLORS).map(([k, c]) => <div key={k} className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} /><span className="text-gray-400 capitalize">{k}</span></div>)}
        </>}
        {viewMode === 'semantic' && <>
          {Object.entries(TYPE_COLORS).map(([k, c]) => <div key={k} className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} /><span className="text-gray-400 capitalize">{k}</span></div>)}
        </>}
        {dimOverlay && <>
          <span className="text-gray-600 mx-1">|</span>
          {Object.entries(DIMENSION_COLORS).map(([k, c]) => <div key={k} className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} /><span className="text-gray-400">{DIMENSION_LABELS[k]}</span></div>)}
        </>}
      </div>
    </div>
  )
}
