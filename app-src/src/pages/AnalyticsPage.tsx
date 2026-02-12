import { useState, useEffect } from 'react'
import { BarChart3, Users, MessageSquare, Network, TrendingUp, Calendar } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../components/ui/Card'

interface MetricCardProps {
  label: string
  value: number | string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
}

function MetricCard({ label, value, icon, trend, trendValue }: MetricCardProps) {
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    stable: 'text-gray-400',
  }

  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-sm text-gray-400 mb-1">{label}</div>
            <div className="text-3xl font-bold text-white mb-2">{value}</div>
            {trend && trendValue && (
              <div className={`text-xs flex items-center gap-1 ${trendColors[trend]}`}>
                <TrendingUp className="w-3 h-3" />
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className="text-[#a6ed2a] opacity-50">{icon}</div>
        </div>
      </CardBody>
    </Card>
  )
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState({
    totalContributions: 0,
    activeThreads: 0,
    graphNodes: 0,
    participants: 0,
  })

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    // TODO: Load actual metrics from API/store
    // For now, using placeholder values
    setMetrics({
      totalContributions: 127,
      activeThreads: 34,
      graphNodes: 456,
      participants: 28,
    })
  }, [timeRange])

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-6 h-6 text-[#a6ed2a]" />
          <h1 className="text-2xl font-bold">Analytics</h1>
        </div>
        <p className="text-sm text-gray-400">
          Platform metrics and activity insights
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2 mb-6">
        {(['7d', '30d', '90d', 'all'] as const).map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              timeRange === range
                ? 'bg-[#a6ed2a] text-black font-medium'
                : 'bg-[#0a101d] text-gray-400 hover:text-white border border-[#1d2839]'
            }`}
          >
            {range === 'all' ? 'All Time' : range.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Total Contributions"
          value={metrics.totalContributions}
          icon={<MessageSquare className="w-8 h-8" />}
          trend="up"
          trendValue="+12% vs last period"
        />
        <MetricCard
          label="Active Threads"
          value={metrics.activeThreads}
          icon={<MessageSquare className="w-8 h-8" />}
          trend="up"
          trendValue="+8% vs last period"
        />
        <MetricCard
          label="Graph Nodes"
          value={metrics.graphNodes}
          icon={<Network className="w-8 h-8" />}
          trend="up"
          trendValue="+23% vs last period"
        />
        <MetricCard
          label="Participants"
          value={metrics.participants}
          icon={<Users className="w-8 h-8" />}
          trend="stable"
          trendValue="No change"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <h3 className="font-bold">Contributions Over Time</h3>
          </CardHeader>
          <CardBody>
            <div className="h-64 flex items-center justify-center border border-dashed border-[#1d2839] rounded">
              <div className="text-center text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Time series chart placeholder</p>
                <p className="text-xs mt-1">Daily contribution activity</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-bold">Thread Activity</h3>
          </CardHeader>
          <CardBody>
            <div className="h-64 flex items-center justify-center border border-dashed border-[#1d2839] rounded">
              <div className="text-center text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Activity chart placeholder</p>
                <p className="text-xs mt-1">Thread creation & resolution</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <h3 className="font-bold">Top Contributors</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {[
                { name: 'Alice Johnson', count: 24 },
                { name: 'Bob Smith', count: 19 },
                { name: 'Carol Davis', count: 15 },
                { name: 'David Lee', count: 12 },
                { name: 'Emma Wilson', count: 9 },
              ].map((contributor, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#a6ed2a]/10 flex items-center justify-center text-xs font-medium text-[#a6ed2a]">
                      {i + 1}
                    </div>
                    <span className="text-sm text-gray-300">{contributor.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">{contributor.count}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-bold">Contributions by Dimension</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {[
                { dimension: 'Human', count: 45, color: '#3b82f6' },
                { dimension: 'Language', count: 32, color: '#8b5cf6' },
                { dimension: 'Artifact', count: 28, color: '#ec4899' },
                { dimension: 'Methodology', count: 22, color: '#f59e0b' },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">{item.dimension}</span>
                    <span className="text-sm text-gray-500">{item.count}</span>
                  </div>
                  <div className="w-full bg-[#080c16] rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${(item.count / 45) * 100}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-bold">Graph Statistics</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Nodes</span>
                <span className="text-white font-medium">456</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Edges</span>
                <span className="text-white font-medium">892</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Density</span>
                <span className="text-white font-medium">0.43</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg Degree</span>
                <span className="text-white font-medium">3.91</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Components</span>
                <span className="text-white font-medium">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Clustering</span>
                <span className="text-white font-medium">0.67</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
