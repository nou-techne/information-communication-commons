// Subgraph Extraction Utilities

import type { GraphData, GraphNode, GraphEdge } from './graph-stats'

/**
 * Extract subgraph centered on a node within N hops (BFS)
 */
export function extractSubgraph(
  graph: GraphData,
  startNodeId: string,
  maxDepth: number = 1
): GraphData {
  const visited = new Set<string>()
  const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId: startNodeId, depth: 0 }]
  const includedNodeIds = new Set<string>()

  // Build adjacency list for efficient traversal
  const adjacency = new Map<string, Set<string>>()
  graph.links.forEach(link => {
    if (!adjacency.has(link.source)) adjacency.set(link.source, new Set())
    if (!adjacency.has(link.target)) adjacency.set(link.target, new Set())
    adjacency.get(link.source)!.add(link.target)
    adjacency.get(link.target)!.add(link.source)
  })

  // BFS to find all nodes within maxDepth hops
  while (queue.length > 0) {
    const { nodeId, depth } = queue.shift()!

    if (visited.has(nodeId)) continue
    visited.add(nodeId)
    includedNodeIds.add(nodeId)

    // Continue exploring if within depth limit
    if (depth < maxDepth) {
      const neighbors = adjacency.get(nodeId) || new Set()
      neighbors.forEach(neighborId => {
        if (!visited.has(neighborId)) {
          queue.push({ nodeId: neighborId, depth: depth + 1 })
        }
      })
    }
  }

  // Extract nodes and links
  const nodes = graph.nodes.filter(n => includedNodeIds.has(n.id))
  const links = graph.links.filter(
    l => includedNodeIds.has(l.source) && includedNodeIds.has(l.target)
  )

  return { nodes, links }
}

/**
 * Extract subgraph by e/H-LAM/T dimension
 */
export function extractByDimension(graph: GraphData, dimension: string): GraphData {
  const nodes = graph.nodes.filter(node => {
    // Check if node has dimension field (string or array)
    if ('dimension' in node && node.dimension === dimension) return true
    if ('dimensions' in node && Array.isArray(node.dimensions)) {
      return node.dimensions.includes(dimension)
    }
    return false
  })

  const nodeIds = new Set(nodes.map(n => n.id))

  // Include only edges where both endpoints are in the dimension
  const links = graph.links.filter(
    l => nodeIds.has(l.source) && nodeIds.has(l.target)
  )

  return { nodes, links }
}

/**
 * Extract subgraph by node type(s)
 */
export function extractByType(graph: GraphData, types: string | string[]): GraphData {
  const typeSet = new Set(Array.isArray(types) ? types : [types])

  const nodes = graph.nodes.filter(node => {
    const nodeType = node.type || node.node_type || node.rea_role
    return nodeType && typeSet.has(nodeType)
  })

  const nodeIds = new Set(nodes.map(n => n.id))

  const links = graph.links.filter(
    l => nodeIds.has(l.source) && nodeIds.has(l.target)
  )

  return { nodes, links }
}

/**
 * Extract subgraph by edge type(s)
 */
export function extractByEdgeType(graph: GraphData, edgeTypes: string | string[]): GraphData {
  const edgeTypeSet = new Set(Array.isArray(edgeTypes) ? edgeTypes : [edgeTypes])

  const links = graph.links.filter(link => {
    const linkType = link.type || link.relationship
    return linkType && edgeTypeSet.has(linkType)
  })

  // Include all nodes connected by these edges
  const nodeIds = new Set<string>()
  links.forEach(link => {
    nodeIds.add(link.source)
    nodeIds.add(link.target)
  })

  const nodes = graph.nodes.filter(n => nodeIds.has(n.id))

  return { nodes, links }
}

/**
 * Combine multiple subgraphs (union)
 */
export function mergeSubgraphs(...subgraphs: GraphData[]): GraphData {
  const nodeMap = new Map<string, GraphNode>()
  const linkSet = new Set<string>()
  const links: GraphEdge[] = []

  subgraphs.forEach(subgraph => {
    subgraph.nodes.forEach(node => {
      nodeMap.set(node.id, node)
    })

    subgraph.links.forEach(link => {
      const key = `${link.source}-${link.target}-${link.type || 'default'}`
      if (!linkSet.has(key)) {
        linkSet.add(key)
        links.push(link)
      }
    })
  })

  return {
    nodes: Array.from(nodeMap.values()),
    links,
  }
}

/**
 * Filter nodes by minimum degree
 */
export function filterByMinDegree(graph: GraphData, minDegree: number): GraphData {
  // Calculate degrees
  const degrees = new Map<string, number>()
  graph.nodes.forEach(node => degrees.set(node.id, 0))

  graph.links.forEach(link => {
    degrees.set(link.source, (degrees.get(link.source) || 0) + 1)
    degrees.set(link.target, (degrees.get(link.target) || 0) + 1)
  })

  // Filter nodes
  const nodeIds = new Set(
    Array.from(degrees.entries())
      .filter(([_, degree]) => degree >= minDegree)
      .map(([id]) => id)
  )

  const nodes = graph.nodes.filter(n => nodeIds.has(n.id))
  const links = graph.links.filter(
    l => nodeIds.has(l.source) && nodeIds.has(l.target)
  )

  return { nodes, links }
}

/**
 * Get ego network (node + immediate neighbors + their connections)
 */
export function extractEgoNetwork(graph: GraphData, nodeId: string): GraphData {
  const neighbors = new Set<string>([nodeId])

  graph.links.forEach(link => {
    if (link.source === nodeId) neighbors.add(link.target)
    if (link.target === nodeId) neighbors.add(link.source)
  })

  const nodes = graph.nodes.filter(n => neighbors.has(n.id))
  const links = graph.links.filter(
    l => neighbors.has(l.source) && neighbors.has(l.target)
  )

  return { nodes, links }
}
