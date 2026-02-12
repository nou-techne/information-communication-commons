import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from './Button'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  showDetails: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo)
    
    this.setState({
      errorInfo,
    })

    // Call optional error handler
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    })
  }

  toggleDetails = () => {
    this.setState(prev => ({
      showDetails: !prev.showDetails,
    }))
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#060a14]">
          <div className="max-w-2xl w-full bg-[#0a101d] border border-[#1d2839] rounded-lg p-8">
            {/* Error icon and title */}
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
                <p className="text-gray-400">
                  We encountered an unexpected error. This has been logged and we'll look into it.
                </p>
              </div>
            </div>

            {/* Error message */}
            {this.state.error && (
              <div className="mb-6 p-4 bg-[#060a14] border border-red-900/30 rounded">
                <div className="font-mono text-sm text-red-400">
                  {this.state.error.toString()}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mb-6">
              <Button onClick={this.handleReset}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                variant="secondary"
                onClick={() => window.location.href = '/'}
              >
                Go to Home
              </Button>
              <Button
                variant="secondary"
                onClick={this.toggleDetails}
              >
                {this.state.showDetails ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Show Details
                  </>
                )}
              </Button>
            </div>

            {/* Error details (collapsible) */}
            {this.state.showDetails && this.state.errorInfo && (
              <div className="border-t border-[#1d2839] pt-6">
                <h3 className="text-sm font-bold mb-3 text-gray-400">
                  Error Details
                </h3>
                <div className="bg-[#060a14] border border-[#1d2839] rounded p-4 overflow-x-auto">
                  <pre className="text-xs text-gray-400 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>

                {this.state.error?.stack && (
                  <>
                    <h3 className="text-sm font-bold mb-3 mt-4 text-gray-400">
                      Stack Trace
                    </h3>
                    <div className="bg-[#060a14] border border-[#1d2839] rounded p-4 overflow-x-auto">
                      <pre className="text-xs text-gray-400 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Help text */}
            <div className="mt-6 text-sm text-gray-500">
              <p>
                If this problem persists, please{' '}
                <a
                  href="mailto:hello@commons.id"
                  className="text-[#a6ed2a] hover:underline"
                >
                  contact support
                </a>
                {' '}with the error details above.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook-based wrapper for functional components
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
): React.ComponentType<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
