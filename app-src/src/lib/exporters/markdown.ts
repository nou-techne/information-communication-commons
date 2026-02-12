// Markdown Exporters

import type { HLAMTDimension } from '../../types/api'

/**
 * Thread Message Interface
 */
interface ThreadMessage {
  id: string
  author: string
  content: string
  timestamp: string
  replyTo?: string
}

/**
 * Thread Interface
 */
interface Thread {
  id: string
  title: string
  description?: string
  messages: ThreadMessage[]
  tags?: string[]
  createdAt: string
  resolvedAt?: string
}

/**
 * Contribution Interface
 */
interface Contribution {
  id: string
  title?: string
  content: string
  dimension?: HLAMTDimension
  author?: string
  createdAt: string
  tags?: string[]
  metadata?: Record<string, any>
}

/**
 * Graph Node Interface
 */
interface GraphNode {
  id: string
  label: string
  type?: string
}

/**
 * Graph Edge Interface
 */
interface GraphEdge {
  from: string
  to: string
  label?: string
  type?: string
}

/**
 * Export thread as Markdown
 */
export function exportThreadAsMarkdown(thread: Thread): string {
  const lines: string[] = []

  // Title
  lines.push(`# ${thread.title}`)
  lines.push('')

  // Metadata
  if (thread.description) {
    lines.push(`> ${thread.description}`)
    lines.push('')
  }

  if (thread.tags && thread.tags.length > 0) {
    lines.push(`**Tags:** ${thread.tags.map(t => `\`${t}\``).join(', ')}`)
    lines.push('')
  }

  lines.push(`**Created:** ${new Date(thread.createdAt).toLocaleString()}`)
  if (thread.resolvedAt) {
    lines.push(`**Resolved:** ${new Date(thread.resolvedAt).toLocaleString()}`)
  }
  lines.push('')
  lines.push('---')
  lines.push('')

  // Messages
  thread.messages.forEach((msg, index) => {
    lines.push(`## Message ${index + 1}`)
    lines.push('')
    lines.push(`**From:** ${msg.author}`)
    lines.push(`**Time:** ${new Date(msg.timestamp).toLocaleString()}`)
    
    if (msg.replyTo) {
      lines.push(`**Reply to:** Message #${msg.replyTo}`)
    }
    
    lines.push('')
    
    // Quote the message content
    const quotedContent = msg.content
      .split('\n')
      .map(line => `> ${line}`)
      .join('\n')
    
    lines.push(quotedContent)
    lines.push('')
  })

  return lines.join('\n')
}

/**
 * Export contribution as Markdown with YAML frontmatter
 */
export function exportContributionAsMarkdown(contribution: Contribution): string {
  const lines: string[] = []

  // YAML frontmatter
  lines.push('---')
  lines.push(`id: ${contribution.id}`)
  
  if (contribution.title) {
    lines.push(`title: ${contribution.title}`)
  }
  
  if (contribution.author) {
    lines.push(`author: ${contribution.author}`)
  }
  
  if (contribution.dimension) {
    lines.push(`dimension: ${contribution.dimension}`)
  }
  
  lines.push(`created: ${contribution.createdAt}`)
  
  if (contribution.tags && contribution.tags.length > 0) {
    lines.push('tags:')
    contribution.tags.forEach(tag => {
      lines.push(`  - ${tag}`)
    })
  }
  
  if (contribution.metadata) {
    lines.push('metadata:')
    Object.entries(contribution.metadata).forEach(([key, value]) => {
      lines.push(`  ${key}: ${JSON.stringify(value)}`)
    })
  }
  
  lines.push('---')
  lines.push('')

  // Title (if present)
  if (contribution.title) {
    lines.push(`# ${contribution.title}`)
    lines.push('')
  }

  // Content
  lines.push(contribution.content)

  return lines.join('\n')
}

/**
 * Export graph as Mermaid diagram
 */
export function exportGraphAsMermaid(
  nodes: GraphNode[],
  edges: GraphEdge[],
  direction: 'TB' | 'LR' | 'RL' | 'BT' = 'TB'
): string {
  const lines: string[] = []

  // Diagram header
  lines.push(`graph ${direction}`)

  // Node definitions
  nodes.forEach(node => {
    const nodeId = sanitizeMermaidId(node.id)
    const label = node.label.replace(/"/g, '#quot;')
    
    // Different shapes based on type
    if (node.type === 'person') {
      lines.push(`    ${nodeId}(["${label}"])`)
    } else if (node.type === 'concept') {
      lines.push(`    ${nodeId}[["${label}"]]`)
    } else if (node.type === 'tool') {
      lines.push(`    ${nodeId}{"${label}"}`)
    } else {
      lines.push(`    ${nodeId}["${label}"]`)
    }
  })

  lines.push('')

  // Edge definitions
  edges.forEach(edge => {
    const fromId = sanitizeMermaidId(edge.from)
    const toId = sanitizeMermaidId(edge.to)
    
    if (edge.label) {
      const label = edge.label.replace(/"/g, '#quot;')
      
      if (edge.type === 'strong') {
        lines.push(`    ${fromId} ==> |"${label}"| ${toId}`)
      } else if (edge.type === 'weak') {
        lines.push(`    ${fromId} -.-> |"${label}"| ${toId}`)
      } else {
        lines.push(`    ${fromId} --> |"${label}"| ${toId}`)
      }
    } else {
      if (edge.type === 'strong') {
        lines.push(`    ${fromId} ==> ${toId}`)
      } else if (edge.type === 'weak') {
        lines.push(`    ${fromId} -.-> ${toId}`)
      } else {
        lines.push(`    ${fromId} --> ${toId}`)
      }
    }
  })

  return lines.join('\n')
}

/**
 * Sanitize ID for Mermaid syntax
 */
function sanitizeMermaidId(id: string): string {
  // Replace non-alphanumeric characters with underscores
  return id.replace(/[^a-zA-Z0-9]/g, '_')
}

/**
 * Export multiple contributions as Markdown document
 */
export function exportContributionsAsMarkdown(
  contributions: Contribution[],
  title?: string
): string {
  const lines: string[] = []

  if (title) {
    lines.push(`# ${title}`)
    lines.push('')
  }

  lines.push(`**Total contributions:** ${contributions.length}`)
  lines.push(`**Exported:** ${new Date().toLocaleString()}`)
  lines.push('')
  lines.push('---')
  lines.push('')

  contributions.forEach((contribution, index) => {
    lines.push(`## ${index + 1}. ${contribution.title || contribution.id}`)
    lines.push('')
    
    if (contribution.dimension) {
      lines.push(`**Dimension:** ${contribution.dimension}`)
    }
    
    if (contribution.author) {
      lines.push(`**Author:** ${contribution.author}`)
    }
    
    lines.push(`**Created:** ${new Date(contribution.createdAt).toLocaleString()}`)
    
    if (contribution.tags && contribution.tags.length > 0) {
      lines.push(`**Tags:** ${contribution.tags.map(t => `\`${t}\``).join(', ')}`)
    }
    
    lines.push('')
    lines.push(contribution.content)
    lines.push('')
    lines.push('---')
    lines.push('')
  })

  return lines.join('\n')
}
