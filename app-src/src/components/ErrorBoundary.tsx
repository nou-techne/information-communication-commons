/**
 * Error Boundary — Graceful Degradation
 * 
 * Sprint Q83: Catches render errors and chain read failures.
 */

import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  context?: string // e.g. "Chain Dashboard", "Contribution History"
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.context ? `: ${this.props.context}` : ''}]`, error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      const isChainError = this.state.error?.message?.includes('chain') ||
                           this.state.error?.message?.includes('does not exist')

      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-400/60 mb-3" />
          <h3 className="text-sm font-medium text-white/70 mb-1">
            {isChainError ? 'Chain data unavailable' : 'Something went wrong'}
          </h3>
          <p className="text-xs text-white/40 max-w-sm mb-4">
            {isChainError
              ? 'The chain data could not be loaded. This may be a temporary issue or the chain table may not be initialized yet.'
              : this.props.context
                ? `Error loading ${this.props.context}. Please try again.`
                : 'An unexpected error occurred.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 text-xs text-copper-400 hover:text-copper-300 bg-copper-400/10 px-3 py-1.5 rounded transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Try again
          </button>
          {this.state.error && (
            <details className="mt-4 text-left max-w-sm">
              <summary className="text-[10px] text-white/20 cursor-pointer">Details</summary>
              <pre className="text-[10px] text-white/15 mt-1 bg-black/20 rounded p-2 overflow-x-auto">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Wrapper for async data that might fail.
 * Shows loading/error/data states.
 */
export function AsyncDataGuard<T>({
  data,
  loading,
  error,
  context,
  children,
}: {
  data: T | null
  loading: boolean
  error: string | null
  context?: string
  children: (data: T) => ReactNode
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-white/30 text-sm">
        Loading{context ? ` ${context}` : ''}...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <AlertTriangle className="w-5 h-5 text-amber-400/50 mb-2" />
        <p className="text-xs text-white/40">{error}</p>
      </div>
    )
  }

  if (data === null || data === undefined) {
    return (
      <div className="text-center py-8 text-white/20 text-xs">
        No data available{context ? ` for ${context}` : ''}.
      </div>
    )
  }

  return <>{children(data)}</>
}
