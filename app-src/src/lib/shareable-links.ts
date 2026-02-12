// Shareable Link Generator

import type { HLAMTDimension } from '../types/api'

export interface ViewState {
  // Graph view
  selectedNode?: string
  focusedNode?: string
  graphFilter?: {
    nodeTypes?: string[]
    edgeTypes?: string[]
    minDegree?: number
  }
  
  // Search
  searchQuery?: string
  searchFilters?: {
    dimensions?: HLAMTDimension[]
    dateStart?: string
    dateEnd?: string
  }
  
  // Convergence
  activeConvergence?: string
  
  // Thread/Channel view
  activeChannel?: string
  activeThread?: string
  
  // Dashboard
  dashboardView?: 'summary' | 'analytics' | 'graph' | 'collections'
  
  // Analytics
  analyticsTimeRange?: '7d' | '30d' | '90d' | 'all'
  analyticsMetric?: string
  
  // Collections
  selectedCollection?: string
}

/**
 * Encode view state into URL hash
 */
export function encodeViewState(state: ViewState): string {
  const params = new URLSearchParams()

  // Graph state
  if (state.selectedNode) params.set('node', state.selectedNode)
  if (state.focusedNode) params.set('focus', state.focusedNode)
  if (state.graphFilter) {
    if (state.graphFilter.nodeTypes) {
      params.set('nodeTypes', state.graphFilter.nodeTypes.join(','))
    }
    if (state.graphFilter.edgeTypes) {
      params.set('edgeTypes', state.graphFilter.edgeTypes.join(','))
    }
    if (state.graphFilter.minDegree !== undefined) {
      params.set('minDegree', String(state.graphFilter.minDegree))
    }
  }

  // Search state
  if (state.searchQuery) params.set('q', state.searchQuery)
  if (state.searchFilters) {
    if (state.searchFilters.dimensions) {
      params.set('dims', state.searchFilters.dimensions.join(','))
    }
    if (state.searchFilters.dateStart) {
      params.set('from', state.searchFilters.dateStart)
    }
    if (state.searchFilters.dateEnd) {
      params.set('to', state.searchFilters.dateEnd)
    }
  }

  // Convergence state
  if (state.activeConvergence) params.set('conv', state.activeConvergence)

  // Thread/Channel state
  if (state.activeChannel) params.set('ch', state.activeChannel)
  if (state.activeThread) params.set('thread', state.activeThread)

  // Dashboard state
  if (state.dashboardView) params.set('view', state.dashboardView)

  // Analytics state
  if (state.analyticsTimeRange) params.set('range', state.analyticsTimeRange)
  if (state.analyticsMetric) params.set('metric', state.analyticsMetric)

  // Collection state
  if (state.selectedCollection) params.set('coll', state.selectedCollection)

  return params.toString()
}

/**
 * Decode view state from URL hash
 */
export function decodeViewState(hash: string): ViewState {
  // Remove leading # if present
  const hashString = hash.startsWith('#') ? hash.slice(1) : hash
  const params = new URLSearchParams(hashString)

  const state: ViewState = {}

  // Graph state
  const selectedNode = params.get('node')
  if (selectedNode) state.selectedNode = selectedNode

  const focusedNode = params.get('focus')
  if (focusedNode) state.focusedNode = focusedNode

  const nodeTypes = params.get('nodeTypes')
  const edgeTypes = params.get('edgeTypes')
  const minDegree = params.get('minDegree')

  if (nodeTypes || edgeTypes || minDegree) {
    state.graphFilter = {}
    if (nodeTypes) state.graphFilter.nodeTypes = nodeTypes.split(',')
    if (edgeTypes) state.graphFilter.edgeTypes = edgeTypes.split(',')
    if (minDegree) state.graphFilter.minDegree = parseInt(minDegree, 10)
  }

  // Search state
  const searchQuery = params.get('q')
  if (searchQuery) state.searchQuery = searchQuery

  const dims = params.get('dims')
  const dateStart = params.get('from')
  const dateEnd = params.get('to')

  if (dims || dateStart || dateEnd) {
    state.searchFilters = {}
    if (dims) state.searchFilters.dimensions = dims.split(',') as HLAMTDimension[]
    if (dateStart) state.searchFilters.dateStart = dateStart
    if (dateEnd) state.searchFilters.dateEnd = dateEnd
  }

  // Convergence state
  const convergence = params.get('conv')
  if (convergence) state.activeConvergence = convergence

  // Thread/Channel state
  const channel = params.get('ch')
  if (channel) state.activeChannel = channel

  const thread = params.get('thread')
  if (thread) state.activeThread = thread

  // Dashboard state
  const view = params.get('view')
  if (view) state.dashboardView = view as ViewState['dashboardView']

  // Analytics state
  const range = params.get('range')
  if (range) state.analyticsTimeRange = range as ViewState['analyticsTimeRange']

  const metric = params.get('metric')
  if (metric) state.analyticsMetric = metric

  // Collection state
  const collection = params.get('coll')
  if (collection) state.selectedCollection = collection

  return state
}

/**
 * Update URL hash with current view state
 */
export function updateURLHash(state: ViewState): void {
  const hash = encodeViewState(state)
  if (hash) {
    window.location.hash = hash
  } else {
    // Clear hash if state is empty
    history.replaceState(null, '', window.location.pathname)
  }
}

/**
 * Get current view state from URL
 */
export function getCurrentViewState(): ViewState {
  return decodeViewState(window.location.hash)
}

/**
 * Generate shareable link for current view
 */
export function generateShareableLink(state: ViewState): string {
  const hash = encodeViewState(state)
  const baseUrl = window.location.origin + window.location.pathname
  return hash ? `${baseUrl}#${hash}` : baseUrl
}

/**
 * Copy shareable link to clipboard
 */
export async function copyShareableLink(state: ViewState): Promise<boolean> {
  const link = generateShareableLink(state)
  
  try {
    await navigator.clipboard.writeText(link)
    return true
  } catch (error) {
    console.error('Failed to copy link:', error)
    return false
  }
}

/**
 * Listen for hash changes and invoke callback
 */
export function onViewStateChange(callback: (state: ViewState) => void): () => void {
  function handleHashChange() {
    const state = getCurrentViewState()
    callback(state)
  }

  window.addEventListener('hashchange', handleHashChange)

  // Return cleanup function
  return () => {
    window.removeEventListener('hashchange', handleHashChange)
  }
}

/**
 * Merge view state with current state
 */
export function mergeViewState(current: ViewState, updates: Partial<ViewState>): ViewState {
  return {
    ...current,
    ...updates,
    // Deep merge for nested objects
    graphFilter: updates.graphFilter 
      ? { ...current.graphFilter, ...updates.graphFilter }
      : current.graphFilter,
    searchFilters: updates.searchFilters
      ? { ...current.searchFilters, ...updates.searchFilters }
      : current.searchFilters,
  }
}

/**
 * Clear specific parts of view state
 */
export function clearViewState(state: ViewState, keys: Array<keyof ViewState>): ViewState {
  const newState = { ...state }
  keys.forEach(key => delete newState[key])
  return newState
}

/**
 * Check if view state is empty
 */
export function isEmptyViewState(state: ViewState): boolean {
  return Object.keys(state).length === 0
}
