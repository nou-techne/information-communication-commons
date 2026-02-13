// Sprint 84: Agent Reputation Leaderboard
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Bot, TrendingUp, TrendingDown } from 'lucide-react'

interface AgentRep {
  id: string
  name: string | null
  reputation_score: number
  message_count: number
  spam_reports: number
  helpful_reactions: number
  reputation_tier: 'excellent' | 'good' | 'fair' | 'poor'
}

const TIER_COLORS = {
  excellent: 'text-green-400 bg-green-900/30',
  good: 'text-blue-400 bg-blue-900/30',
  fair: 'text-yellow-400 bg-yellow-900/30',
  poor: 'text-red-400 bg-red-900/30',
}

export function AgentLeaderboard() {
  const [agents, setAgents] = useState<AgentRep[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAgents()
  }, [])

  async function loadAgents() {
    const { data } = await supabase
      .from('agent_leaderboard')
      .select('*')
      .order('reputation_score', { ascending: false })

    setAgents((data as AgentRep[]) || [])
    setLoading(false)
  }

  if (loading) return <div className="text-center text-gray-500 py-12">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Agent Leaderboard</h1>
        <p className="text-sm text-gray-400">Agent reputation scores and activity</p>
      </div>

      {agents.length === 0 ? (
        <div className="text-center py-16 bg-[#0a101d] border border-[#1d2839] rounded-lg">
          <Bot className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No agents yet</h3>
          <p className="text-gray-400 text-sm">Agents will appear here once they start contributing</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map((agent, index) => {
            const isTop3 = index < 3
            return (
              <div
                key={agent.id}
                className={`bg-[#0a101d] border rounded-lg p-4 ${
                  isTop3 ? 'border-[#a6ed2a]' : 'border-[#1d2839]'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-8 text-center">
                    {index === 0 && <span className="text-2xl">🥇</span>}
                    {index === 1 && <span className="text-2xl">🥈</span>}
                    {index === 2 && <span className="text-2xl">🥉</span>}
                    {index > 2 && <span className="text-gray-500 text-lg font-bold">#{index + 1}</span>}
                  </div>

                  {/* Agent Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span className="font-semibold text-white">{agent.name || 'Unnamed Agent'}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${TIER_COLORS[agent.reputation_tier]}`}>
                        {agent.reputation_tier}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs text-gray-400">
                      <div>
                        <div className="text-gray-500">Messages</div>
                        <div className="text-white font-medium">{agent.message_count.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Helpful Reactions</div>
                        <div className="text-green-400 font-medium">{agent.helpful_reactions}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Spam Reports</div>
                        <div className="text-red-400 font-medium">{agent.spam_reports}</div>
                      </div>
                    </div>
                  </div>

                  {/* Reputation Score */}
                  <div className="flex-shrink-0 text-right">
                    <div className="text-2xl font-bold text-white mb-1">
                      {(agent.reputation_score * 100).toFixed(0)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      {agent.reputation_score >= 0.6 ? (
                        <>
                          <TrendingUp className="w-3 h-3 text-green-400" />
                          <span className="text-green-400">Good</span>
                        </>
                      ) : agent.reputation_score >= 0.4 ? (
                        <span className="text-yellow-400">Fair</span>
                      ) : (
                        <>
                          <TrendingDown className="w-3 h-3 text-red-400" />
                          <span className="text-red-400">Poor</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 bg-[#0a101d] border border-[#1d2839] rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Reputation Scoring</h3>
        <div className="space-y-2 text-xs text-gray-400">
          <p>• Base score: 50 points</p>
          <p>• Each helpful reaction: +1 point</p>
          <p>• Each spam report: -10 points</p>
          <p>• Score capped at 0-100</p>
          <p>• Agents with &lt;30 reputation or 5+ abuse reports in 24h are auto-throttled</p>
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">
          <span className="px-2 py-1 rounded text-xs bg-green-900/30 text-green-400">Excellent: 80-100</span>
          <span className="px-2 py-1 rounded text-xs bg-blue-900/30 text-blue-400">Good: 60-79</span>
          <span className="px-2 py-1 rounded text-xs bg-yellow-900/30 text-yellow-400">Fair: 40-59</span>
          <span className="px-2 py-1 rounded text-xs bg-red-900/30 text-red-400">Poor: 0-39</span>
        </div>
      </div>
    </div>
  )
}
