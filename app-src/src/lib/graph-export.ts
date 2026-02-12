// Graph Export Utilities

import type { GraphData } from './graph-stats'

/**
 * Export graph as JSON
 */
export function exportToJSON(graph: GraphData): string {
  return JSON.stringify(graph, null, 2)
}

/**
 * Export graph as CSV (nodes)
 */
export function exportNodesToCSV(graph: GraphData): string {
  if (graph.nodes.length === 0) return ''

  // Determine all unique keys from all nodes
  const allKeys = new Set<string>()
  graph.nodes.forEach(node => {
    Object.keys(node).forEach(key => allKeys.add(key))
  })

  const headers = Array.from(allKeys)

  // Escape and quote CSV values
  function escapeCSV(value: any): string {
    if (value === null || value === undefined) return ''
    const str = String(value)
    // Quote if contains comma, newline, or quote
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  // Build CSV
  const rows = [headers.map(escapeCSV).join(',')]

  graph.nodes.forEach(node => {
    const values = headers.map(key => {
      const value = (node as any)[key]
      if (Array.isArray(value)) return value.join('; ')
      if (typeof value === 'object' && value !== null) return JSON.stringify(value)
      return value
    })
    rows.push(values.map(escapeCSV).join(','))
  })

  return rows.join('\n')
}

/**
 * Export graph edges as CSV
 */
export function exportEdgesToCSV(graph: GraphData): string {
  if (graph.links.length === 0) return ''

  // Determine all unique keys
  const allKeys = new Set<string>()
  graph.links.forEach(link => {
    Object.keys(link).forEach(key => allKeys.add(key))
  })

  const headers = Array.from(allKeys)

  function escapeCSV(value: any): string {
    if (value === null || value === undefined) return ''
    const str = String(value)
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const rows = [headers.map(escapeCSV).join(',')]

  graph.links.forEach(link => {
    const values = headers.map(key => {
      const value = (link as any)[key]
      if (Array.isArray(value)) return value.join('; ')
      if (typeof value === 'object' && value !== null) return JSON.stringify(value)
      return value
    })
    rows.push(values.map(escapeCSV).join(','))
  })

  return rows.join('\n')
}

/**
 * Export graph as DOT format (Graphviz)
 */
export function exportToDOT(graph: GraphData, options: { directed?: boolean; name?: string } = {}): string {
  const { directed = true, name = 'G' } = options
  const graphType = directed ? 'digraph' : 'graph'
  const edgeOp = directed ? '->' : '--'

  const lines: string[] = []
  lines.push(`${graphType} ${name} {`)

  // Node definitions
  graph.nodes.forEach(node => {
    const id = sanitizeDOTId(node.id)
    const label = sanitizeDOTString(node.label || node.id)
    const attributes: string[] = [`label="${label}"`]

    // Add type as shape/color if available
    if (node.type) {
      attributes.push(`shape=circle`)
    }

    lines.push(`  ${id} [${attributes.join(', ')}];`)
  })

  // Edge definitions
  graph.links.forEach(link => {
    const source = sanitizeDOTId(link.source)
    const target = sanitizeDOTId(link.target)
    const attributes: string[] = []

    if (link.type) {
      attributes.push(`label="${sanitizeDOTString(link.type)}"`)
    }

    const attrStr = attributes.length > 0 ? ` [${attributes.join(', ')}]` : ''
    lines.push(`  ${source} ${edgeOp} ${target}${attrStr};`)
  })

  lines.push('}')
  return lines.join('\n')
}

/**
 * Sanitize string for DOT ID (alphanumeric + underscore)
 */
function sanitizeDOTId(id: string): string {
  // Replace non-alphanumeric chars with underscore
  const sanitized = id.replace(/[^a-zA-Z0-9_]/g, '_')
  // Ensure starts with letter or underscore
  return /^[a-zA-Z_]/.test(sanitized) ? sanitized : `_${sanitized}`
}

/**
 * Escape string for DOT label
 */
function sanitizeDOTString(str: string): string {
  return str.replace(/"/g, '\\"').replace(/\n/g, '\\n')
}

/**
 * Download graph data as file
 */
export function downloadGraph(
  graph: GraphData,
  format: 'json' | 'csv-nodes' | 'csv-edges' | 'dot',
  filename?: string
) {
  let content: string
  let mimeType: string
  let extension: string

  switch (format) {
    case 'json':
      content = exportToJSON(graph)
      mimeType = 'application/json'
      extension = 'json'
      break
    case 'csv-nodes':
      content = exportNodesToCSV(graph)
      mimeType = 'text/csv'
      extension = 'csv'
      break
    case 'csv-edges':
      content = exportEdgesToCSV(graph)
      mimeType = 'text/csv'
      extension = 'csv'
      break
    case 'dot':
      content = exportToDOT(graph)
      mimeType = 'text/vnd.graphviz'
      extension = 'dot'
      break
  }

  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `graph-${Date.now()}.${extension}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
