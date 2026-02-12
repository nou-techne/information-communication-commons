// Graph Keyboard Navigation

export interface GraphKeyboardNavigation {
  nodes: Array<{ id: string; x: number; y: number }>
  selectedIndex: number
  onSelect: (nodeId: string) => void
  onPan: (dx: number, dy: number) => void
  onZoom: (delta: number) => void
}

export const GRAPH_KEYBOARD_SHORTCUTS = {
  // Node navigation
  TAB: 'Tab', // Cycle through nodes
  ENTER: 'Enter', // Select/open node detail
  ESCAPE: 'Escape', // Deselect node
  
  // Panning
  ARROW_UP: 'ArrowUp', // Pan up
  ARROW_DOWN: 'ArrowDown', // Pan down
  ARROW_LEFT: 'ArrowLeft', // Pan left
  ARROW_RIGHT: 'ArrowRight', // Pan right
  
  // Zooming
  PLUS: '+', // Zoom in
  EQUALS: '=', // Zoom in (no shift)
  MINUS: '-', // Zoom out
  ZERO: '0', // Reset zoom
  
  // Special keys
  HOME: 'Home', // Go to first node
  END: 'End', // Go to last node
} as const

/**
 * Handle keyboard events for graph navigation
 */
export function handleGraphKeyboard(
  event: KeyboardEvent,
  state: GraphKeyboardNavigation
): void {
  const { nodes, selectedIndex, onSelect, onPan, onZoom } = state
  
  // Prevent default for handled keys
  const handledKeys = Object.values(GRAPH_KEYBOARD_SHORTCUTS)
  if (handledKeys.includes(event.key as any)) {
    event.preventDefault()
  }
  
  switch (event.key) {
    // Node navigation
    case GRAPH_KEYBOARD_SHORTCUTS.TAB:
      if (nodes.length === 0) return
      const nextIndex = event.shiftKey
        ? (selectedIndex - 1 + nodes.length) % nodes.length
        : (selectedIndex + 1) % nodes.length
      onSelect(nodes[nextIndex].id)
      break
      
    case GRAPH_KEYBOARD_SHORTCUTS.ENTER:
      if (selectedIndex >= 0 && nodes[selectedIndex]) {
        // Open node detail (trigger same action as click)
        onSelect(nodes[selectedIndex].id)
      }
      break
      
    case GRAPH_KEYBOARD_SHORTCUTS.ESCAPE:
      // Deselect current node
      onSelect('')
      break
      
    case GRAPH_KEYBOARD_SHORTCUTS.HOME:
      if (nodes.length > 0) {
        onSelect(nodes[0].id)
      }
      break
      
    case GRAPH_KEYBOARD_SHORTCUTS.END:
      if (nodes.length > 0) {
        onSelect(nodes[nodes.length - 1].id)
      }
      break
      
    // Panning (50px increments)
    case GRAPH_KEYBOARD_SHORTCUTS.ARROW_UP:
      onPan(0, -50)
      break
      
    case GRAPH_KEYBOARD_SHORTCUTS.ARROW_DOWN:
      onPan(0, 50)
      break
      
    case GRAPH_KEYBOARD_SHORTCUTS.ARROW_LEFT:
      onPan(-50, 0)
      break
      
    case GRAPH_KEYBOARD_SHORTCUTS.ARROW_RIGHT:
      onPan(50, 0)
      break
      
    // Zooming
    case GRAPH_KEYBOARD_SHORTCUTS.PLUS:
    case GRAPH_KEYBOARD_SHORTCUTS.EQUALS:
      onZoom(0.1) // Zoom in 10%
      break
      
    case GRAPH_KEYBOARD_SHORTCUTS.MINUS:
      onZoom(-0.1) // Zoom out 10%
      break
      
    case GRAPH_KEYBOARD_SHORTCUTS.ZERO:
      onZoom(0) // Reset zoom (special case, handler should reset to 1.0)
      break
  }
}

/**
 * Get ARIA label for graph node
 */
export function getNodeAriaLabel(node: {
  id: string
  label?: string
  type?: string
  connections?: number
}): string {
  const parts = [node.label || node.id]
  
  if (node.type) {
    parts.push(`type: ${node.type}`)
  }
  
  if (node.connections !== undefined) {
    parts.push(`${node.connections} connection${node.connections !== 1 ? 's' : ''}`)
  }
  
  return parts.join(', ')
}

/**
 * Focus ring style for selected node
 */
export const GRAPH_FOCUS_STYLE = {
  stroke: '#c3fd50',
  strokeWidth: 3,
  strokeDasharray: '0',
  filter: 'drop-shadow(0 0 4px rgba(195, 253, 80, 0.6))',
}

/**
 * Get keyboard shortcut help text
 */
export function getGraphKeyboardShortcuts(): Array<{
  category: string
  shortcuts: Array<{ key: string; description: string }>
}> {
  return [
    {
      category: 'Node Navigation',
      shortcuts: [
        { key: 'Tab / Shift+Tab', description: 'Cycle through nodes' },
        { key: 'Enter', description: 'Open node details' },
        { key: 'Escape', description: 'Deselect node' },
        { key: 'Home', description: 'Go to first node' },
        { key: 'End', description: 'Go to last node' },
      ],
    },
    {
      category: 'Panning',
      shortcuts: [
        { key: '↑ / ↓ / ← / →', description: 'Pan graph' },
      ],
    },
    {
      category: 'Zooming',
      shortcuts: [
        { key: '+ / =', description: 'Zoom in' },
        { key: '-', description: 'Zoom out' },
        { key: '0', description: 'Reset zoom' },
      ],
    },
  ]
}

/**
 * Calculate spatial node ordering for Tab navigation
 * Orders nodes left-to-right, top-to-bottom
 */
export function calculateTabOrder(
  nodes: Array<{ id: string; x: number; y: number }>
): string[] {
  return nodes
    .slice()
    .sort((a, b) => {
      // Sort by y first (top to bottom)
      if (Math.abs(a.y - b.y) > 50) {
        return a.y - b.y
      }
      // Then by x (left to right)
      return a.x - b.x
    })
    .map(n => n.id)
}
