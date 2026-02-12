import { useState, useEffect } from 'react'
import { Calendar, MapPin, Users, MessageSquare, FileText, TrendingUp } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import { convergenceStore } from '../stores/convergence-store'
import { formatDateRange, getDurationDays } from '../types/convergence'
import type { Convergence } from '../types/convergence'

export default function ConvergenceDashboardPage() {
  const [convergence, setConvergence] = useState<Convergence | null>(null)

  useEffect(() => {
    const active = convergenceStore.getActive()
    setConvergence(active)
  }, [])

  if (!convergence) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">No convergence selected</p>
          <p className="text-sm text-gray-600">
            Select a convergence from the dropdown in the navigation
          </p>
        </div>
      </div>
    )
  }

  const durationDays = getDurationDays(convergence)

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{convergence.name}</h1>
            <p className="text-gray-400 mb-4">{convergence.description}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <Calendar className="w-4 h-4" />
                <span>{formatDateRange(convergence)}</span>
                <span className="text-gray-500">({durationDays} days)</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <MapPin className="w-4 h-4" />
                <span>
                  {convergence.location.city}, {convergence.location.country}
                </span>
              </div>
              {convergence.participantCount && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Users className="w-4 h-4" />
                  <span>{convergence.participantCount} participants</span>
                </div>
              )}
            </div>
          </div>
          <div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                convergence.status === 'active'
                  ? 'bg-green-500/20 text-green-400'
                  : convergence.status === 'upcoming'
                  ? 'bg-blue-500/20 text-blue-400'
                  : convergence.status === 'completed'
                  ? 'bg-gray-500/20 text-gray-400'
                  : 'bg-gray-600/20 text-gray-500'
              }`}
            >
              {convergence.status}
            </span>
          </div>
        </div>

        {convergence.metadata?.theme && (
          <div className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-4">
            <div className="text-xs font-bold text-gray-500 uppercase mb-1">Theme</div>
            <div className="text-sm text-gray-300">{convergence.metadata.theme}</div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400 mb-1">Contributions</div>
                <div className="text-3xl font-bold">127</div>
                <div className="text-xs text-gray-500 mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  +12% from previous
                </div>
              </div>
              <MessageSquare className="w-8 h-8 text-[#a6ed2a] opacity-50" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400 mb-1">Active Threads</div>
                <div className="text-3xl font-bold">34</div>
                <div className="text-xs text-gray-500 mt-1">23 resolved</div>
              </div>
              <MessageSquare className="w-8 h-8 text-[#a6ed2a] opacity-50" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400 mb-1">Artifacts</div>
                <div className="text-3xl font-bold">89</div>
                <div className="text-xs text-gray-500 mt-1">From 67 contributors</div>
              </div>
              <FileText className="w-8 h-8 text-[#a6ed2a] opacity-50" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Dimension Breakdown */}
      {convergence.dimensionsFocus && convergence.dimensionsFocus.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <h3 className="font-bold">Dimension Focus</h3>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-2">
              {convergence.dimensionsFocus.map(dim => (
                <div
                  key={dim}
                  className="px-3 py-2 rounded-lg bg-[#0a101d] border border-[#1d2839] text-sm"
                >
                  <span className="font-medium capitalize">{dim}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <div className="text-xs text-gray-500 mb-2">Contribution Distribution</div>
              {convergence.dimensionsFocus.map((dim, i) => {
                const values = [45, 32, 28, 22, 15]
                const value = values[i] || 10
                return (
                  <div key={dim}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300 capitalize">{dim}</span>
                      <span className="text-sm text-gray-500">{value}</span>
                    </div>
                    <div className="w-full bg-[#080c16] rounded-full h-2">
                      <div
                        className="bg-[#a6ed2a] h-2 rounded-full"
                        style={{ width: `${(value / 45) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <h3 className="font-bold">Recent Activity</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {[
              { type: 'contribution', text: 'New contribution submitted', author: 'Alice', time: '5m ago' },
              { type: 'thread', text: 'Thread "API Design" resolved', author: 'Bob', time: '12m ago' },
              { type: 'artifact', text: 'Artifact "Protocol Spec" created', author: 'Carol', time: '23m ago' },
              { type: 'thread', text: 'New thread "UX Feedback" started', author: 'David', time: '34m ago' },
              { type: 'contribution', text: 'Contribution processed → 3 artifacts', author: 'Emma', time: '1h ago' },
            ].map((activity, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded bg-[#0a101d] hover:bg-[#1d2839] transition-colors"
              >
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    activity.type === 'contribution'
                      ? 'bg-blue-400'
                      : activity.type === 'thread'
                      ? 'bg-green-400'
                      : 'bg-purple-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-300">{activity.text}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {activity.author} · {activity.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
