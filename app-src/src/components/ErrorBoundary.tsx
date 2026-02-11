import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { supabase } from '../lib/supabase'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    
    // Log to Supabase
    this.logError(error, errorInfo)
    
    this.setState({ error, errorInfo })
  }

  async logError(error: Error, errorInfo: ErrorInfo) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      await supabase.from('client_errors').insert({
        message: error.message,
        stack: error.stack || '',
        component_stack: errorInfo.componentStack,
        user_id: user?.id || null,
        url: window.location.href,
        user_agent: navigator.userAgent,
      })
    } catch (logError) {
      console.error('Failed to log error to Supabase:', logError)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.href = '/'
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#1a1a1a] border border-[#262626] rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
              <div>
                <h1 className="text-xl font-bold">Something went wrong</h1>
                <p className="text-sm text-gray-400">
                  {this.props.fallbackTitle || 'An unexpected error occurred'}
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="bg-[#0f0f0f] border border-[#262626] rounded p-3 mb-4">
                <p className="text-xs text-red-400 font-mono break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#262626] text-white rounded-lg hover:bg-[#333] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reload
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#c3fd50] text-[#0f0f0f] rounded-lg hover:bg-[#d4fe80] transition-colors"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>

            <p className="mt-4 text-xs text-gray-600 text-center">
              The error has been logged. Try reloading the page or returning home.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
