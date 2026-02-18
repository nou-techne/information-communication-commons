/**
 * Training Analytics Dashboard (Q71)
 * 
 * Insights for TIO-08 (Community Writer) to understand what members
 * are learning and where they get stuck.
 */

import { useState, useEffect } from 'react'
import { useConvergence } from '../contexts/ConvergenceContext'
import { getTrainingStats } from '../lib/education-engine'
import { BarChart2, Users, CheckCircle, Search } from 'lucide-react'

export function TrainingAnalytics() {
  const { convergence } = useConvergence()
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    getTrainingStats(convergence.id).then(setStats)
  }, [convergence.id])

  if (!stats) return <div className="p-8 text-white/40">Loading analytics...</div>

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-white flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-copper-400" />
        Training Insights
      </h2>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
            <Users className="w-3 h-3" /> Active Learners (7d)
          </div>
          <div className="text-2xl font-semibold text-white">{stats.activeLearners}</div>
        </div>
        <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
            <CheckCircle className="w-3 h-3" /> Path Completions
          </div>
          <div className="text-2xl font-semibold text-green-400">{stats.pathCompletions}</div>
        </div>
        <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
            <Search className="w-3 h-3" /> Top Search
          </div>
          <div className="text-lg font-medium text-copper-300">"vesting"</div>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/10 rounded-lg p-6">
        <h3 className="text-sm font-medium text-white mb-4">Most Accessed Content</h3>
        <div className="space-y-3">
          {stats.topContent.map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-white/30 text-xs w-4">{i + 1}</span>
                <span className="text-white/80 text-sm">{item.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-copper-500 rounded-full" 
                    style={{ width: `${(item.views / stats.topContent[0].views) * 100}%` }} 
                  />
                </div>
                <span className="text-white/40 text-xs w-8 text-right">{item.views}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
