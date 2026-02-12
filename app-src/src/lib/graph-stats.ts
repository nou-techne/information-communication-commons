// Graph Statistics Calculator

export interface GraphNode {
  id: string
  [key: string]: any
}

export interface GraphEdge {
  source: string
  target: string
  [key: string]: any
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphEdge[]
}

/**
 * Count nodes in graph
 */
export function nodeCount(graph: GraphData): number {
  return graph.nodes.length
}

/**
 * Count edges in graph
 */
export function edgeCount(graph: GraphData): number {
  return graph.links.length
}

/**
 * Calculate graph density (actual edges / possible edges)
 */
export function density(graph: GraphData): number {
  const n = nodeCount(graph)
  if (n <= 1) return 0
  
  const maxEdges = (n * (n - 1)) / 2
  const actualEdges = edgeCount(graph)
  
  return actualEdges / maxEdges
}

/**
 * Calculate average degree (avg connections per node)
 */
export function avgDegree(graph: GraphData): number {
  const n = nodeCount(graph)
  if (n === 0) return 0
  
  const totalDegree = edgeCount(graph) * 2 // Each edge contributes 2 to total degree
  return totalDegree / n
}

/**
 * Get degree (connection count) for each node
 */
export function nodeDegrees(graph: GraphData): Map<string, number> {
  const degrees = new Map<string, number>()
  
  // Initialize all nodes with degree 0
  graph.nodes.forEach(node => degrees.set(node.id, 0))
  
  // Count edges
  graph.links.forEach(edge => {
    degrees.set(edge.source, (degrees.get(edge.source) || 0) + 1)
    degrees.set(edge.target, (degrees.get(edge.target) || 0) + 1)
  })
  
  return degrees
}

/**
 * Get top N nodes by degree
 */
export function topNodes(graph: GraphData, n: number = 10): Array<{ id: string; degree: number }> {
  const degrees = nodeDegrees(graph)
  
  return Array.from(degrees.entries())
    .map(([id, degree]) => ({ id, degree }))
    .sort((a, b) => b.degree - a.degree)
    .slice(0, n)
}

/**
 * Find connected components using Union-Find
 */
export function connectedComponents(graph: GraphData): string[][] {
  const parent = new Map<string, string>()
  
  // Initialize each node as its own parent
  graph.nodes.forEach(node => parent.set(node.id, node.id))
  
  function find(id: string): string {
    if (parent.get(id) !== id) {
      parent.set(id, find(parent.get(id)!))
    }
    return parent.get(id)!
  }
  
  function union(a: string, b: string): void {
    const rootA = find(a)
    const rootB = find(b)
    if (rootA !== rootB) {
      parent.set(rootA, rootB)
    }
  }
  
  // Union connected nodes
  graph.links.forEach(edge => {
    union(edge.source, edge.target)
  })
  
  // Group nodes by root
  const components = new Map<string, string[]>()
  graph.nodes.forEach(node => {
    const root = find(node.id)
    if (!components.has(root)) {
      components.set(root, [])
    }
    components.get(root)!.push(node.id)
  })
  
  return Array.from(components.values())
}

/**
 * Count connected components
 */
export function componentCount(graph: GraphData): number {
  return connectedComponents(graph).length
}

/**
 * Get largest connected component
 */
export function largestComponent(graph: GraphData): string[] {
  const components = connectedComponents(graph)
  if (components.length === 0) return []
  
  return components.reduce((largest, current) => 
    current.length > largest.length ? current : largest
  )
}

/**
 * Calculate clustering coefficient for a node
 */
export function nodeClusteringCoefficient(graph: GraphData, nodeId: string): number {
  const neighbors = new Set<string>()
  
  // Find all neighbors
  graph.links.forEach(edge => {
    if (edge.source === nodeId) neighbors.add(edge.target)
    if (edge.target === nodeId) neighbors.add(edge.source)
  })
  
  if (neighbors.size < 2) return 0
  
  // Count edges between neighbors
  let edgesBetweenNeighbors = 0
  const neighborArray = Array.from(neighbors)
  
  for (let i = 0; i < neighborArray.length; i++) {
    for (let j = i + 1; j < neighborArray.length; j++) {
      const hasEdge = graph.links.some(edge =>
        (edge.source === neighborArray[i] && edge.target === neighborArray[j]) ||
        (edge.source === neighborArray[j] && edge.target === neighborArray[i])
      )
      if (hasEdge) edgesBetweenNeighbors++
    }
  }
  
  const possibleEdges = (neighbors.size * (neighbors.size - 1)) / 2
  return edgesBetweenNeighbors / possibleEdges
}

/**
 * Calculate average clustering coefficient for the graph
 */
export function avgClusteringCoefficient(graph: GraphData): number {
  if (graph.nodes.length === 0) return 0
  
  const coefficients = graph.nodes.map(node => 
    nodeClusteringCoefficient(graph, node.id)
  )
  
  return coefficients.reduce((sum, c) => sum + c, 0) / coefficients.length
}

/**
 * Get comprehensive graph statistics
 */
export function getGraphStats(graph: GraphData) {
  return {
    nodes: nodeCount(graph),
    edges: edgeCount(graph),
    density: density(graph),
    avgDegree: avgDegree(graph),
    components: componentCount(graph),
    largestComponent: largestComponent(graph).length,
    avgClustering: avgClusteringCoefficient(graph),
    topNodesByDegree: topNodes(graph, 5),
  }
}
