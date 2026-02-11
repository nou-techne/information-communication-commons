import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react'

interface HealthMetrics {
  contributions_last_hour: number
  successful: number
  failed: number
  processing: number
  pending: number
  success_rate_pct: number
  failure_rate_pct: number
  avg_processing_seconds: number
  last_processed_at: string
  contributions_last_24h: number
  successful_24h: number
  failed_24h: number
  success_rate_24h_pct: number
}

interface RecentError {
  contribution_id: string
  created_at: string
  content_preview: string
  errors: any[]
}

export function Status() {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null)
  const [errors, setErrors] = useState<RecentError[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  async function loadMetrics() {
    const { data: metricsData } = await supabase
      .from('extraction_health_metrics')
      .select('*')
      .single()

    const { data: errorsData } = await supabase
      .rpc('get_recent_extraction_errors', { limit_count: 5 })

    setMetrics(metricsData)
    setErrors(errorsData || [])
    setLastUpdate(new Date())
    setLoading(false)
  }

  useEffect(() => {
    loadMetrics()
    const interval = setInterval(loadMetrics, 10000) // refresh every 10s
    return () => clearInterval(interval)
  }, [])

  if (loading || !metrics) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <Activity className="w-12 h-12 text-gray-500 mx-auto mb-4 animate-pulse" />
        <p className="text-gray-400">Loading system health...</p>
      </div>
    )
  }

  const isHealthy = metrics.failure_rate_pct < 20
  const hasRecentActivity = metrics.contributions_last_hour > 0

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">System Status</h1>
        <div className="text-sm text-gray-400">
          Last update: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Overall health indicator */}
      <div className={`rounded-lg p-6 mb-6 border-2 ${
        isHealthy 
          ? 'bg-green-900/10 border-green-800/30' 
          : 'bg-red-900/10 border-red-800/30'
      }`}>
        <div className="flex items-center gap-3 mb-2">
          {isHealthy ? (
            <CheckCircle className="w-6 h-6 text-green-500" />
          ) : (
            <AlertCircle className="w-6 h-6 text-red-500" />
          )}
          <h2 className="text-xl font-bold">
            {isHealthy ? 'System Healthy' : 'System Degraded'}
          </h2>
        </div>
        <p className="text-sm text-gray-400">
          {isHealthy 
            ? 'Extraction pipeline operating normally' 
            : `Warning: ${metrics.failure_rate_pct}% failure rate in last hour`}
        </p>
      </div>

      {/* Last hour metrics */}
      <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-6 mb-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#c3fd50]" />
          Last Hour
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-2xl font-bold">{metrics.contributions_last_hour}</div>
            <div className="text-xs text-gray-500">Total contributions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-500">{metrics.successful}</div>
            <div className="text-xs text-gray-500">Successful</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-500">{metrics.failed}</div>
            <div className="text-xs text-gray-500">Failed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-500">{metrics.processing + metrics.pending}</div>
            <div className="text-xs text-gray-500">In progress</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#262626] grid grid-cols-2 gap-4">
          <div>
            <div className="text-lg font-bold">{metrics.success_rate_pct}%</div>
            <div className="text-xs text-gray-500">Success rate</div>
          </div>
          <div>
            <div className="text-lg font-bold">{metrics.avg_processing_seconds}s</div>
            <div className="text-xs text-gray-500">Avg processing time</div>
          </div>
        </div>
      </div>

      {/* Last 24 hours */}
      <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-6 mb-6">
        <h3 className="text-lg font-bold mb-4">Last 24 Hours</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-2xl font-bold">{metrics.contributions_last_24h}</div>
            <div className="text-xs text-gray-500">Total contributions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-500">{metrics.successful_24h}</div>
            <div className="text-xs text-gray-500">Successful</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-500">{metrics.failed_24h}</div>
            <div className="text-xs text-gray-500">Failed</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{metrics.success_rate_24h_pct}%</div>
            <div className="text-xs text-gray-500">Success rate</div>
          </div>
        </div>
      </div>

      {/* Recent errors */}
      {errors.length > 0 && (
        <div className="bg-[#1a1a1a] border border-red-800/30 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Recent Errors ({errors.length})
          </h3>
          <div className="space-y-3">
            {errors.map(error => (
              <div key={error.contribution_id} className="bg-[#0f0f0f] border border-[#262626] rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">
                  {new Date(error.created_at).toLocaleString()}
                </div>
                <div className="text-sm text-gray-300 mb-2">
                  {error.content_preview}...
                </div>
                {error.errors && error.errors.length > 0 && (
                  <div className="text-xs font-mono text-red-400">
                    {error.errors[error.errors.length - 1].message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasRecentActivity && (
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-6 text-center">
          <p className="text-gray-400">No contributions in the last hour</p>
        </div>
      )}
    </div>
  )
}
