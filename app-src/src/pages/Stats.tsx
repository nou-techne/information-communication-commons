import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { TrendingUp, Users, GitBranch, FileText, Zap } from 'lucide-react'
import { useConvergence } from '../contexts/ConvergenceContext'

interface Stats {
  contributions: number
  artifacts: number
  participants: number
  relationships: number
  sessions: number
}

interface TopDimension {
  key: string
  count: number
  label: string
}

interface TopType {
  type: string
  count: number
}

const DIMENSION_LABELS: Record<string, string> = {
  'hlamt:e': 'e/ Environment',
  'hlamt:H': 'H/ Human',
  'hlamt:L': 'L/ Language',
  'hlamt:A': 'A/ Artifacts',
  'hlamt:M': 'M/ Methodology',
  'hlamt:T': 'T/ Training',
  'hlamt:S': 'S/ Sessions',
}

export function Stats() {
  const { convergence } = useConvergence()
  const [stats, setStats] = useState<Stats>({
    contributions: 0,
    artifacts: 0,
    participants: 0,
    relationships: 0,
    sessions: 0,
  })
  const [topDimensions, setTopDimensions] = useState<TopDimension[]>([])
  const [topTypes, setTopTypes] = useState<TopType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()

    // Real-time updates
    const channel = supabase.channel('stats-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, loadStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'artifacts' }, loadStats)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadStats() {
    const [
      { count: contributionCount },
      { count: artifactCount },
      { count: participantCount },
      { count: relationshipCount },
      { count: sessionCount },
      { data: tagData },
      { data: typeData },
    ] = await Promise.all([
      supabase.from('contributions').select('*', { count: 'exact', head: true }),
      supabase.from('artifacts').select('*', { count: 'exact', head: true }),
      supabase.from('public_participants').select('*', { count: 'exact', head: true }),
      supabase.from('artifact_relationships').select('*', { count: 'exact', head: true }),
      supabase.from('sessions').select('*', { count: 'exact', head: true }),
      supabase
        .from('tags')
        .select('name, artifact_tags(count)')
        .like('name', 'hlamt:%')
        .order('name'),
      supabase
        .from('artifacts')
        .select('type')
        .not('type', 'is', null),
    ])

    setStats({
      contributions: contributionCount || 0,
      artifacts: artifactCount || 0,
      participants: participantCount || 0,
      relationships: relationshipCount || 0,
      sessions: sessionCount || 0,
    })

    // Process dimension counts
    if (tagData) {
      const dims: TopDimension[] = tagData
        .map(t => ({
          key: t.name,
          count: (t.artifact_tags as any)?.[0]?.count || 0,
          label: DIMENSION_LABELS[t.name] || t.name,
        }))
        .sort((a, b) => b.count - a.count)
      setTopDimensions(dims)
    }

    // Process type counts
    if (typeData) {
      const typeCounts: Record<string, number> = {}
      for (const row of typeData) {
        typeCounts[row.type] = (typeCounts[row.type] || 0) + 1
      }
      const types: TopType[] = Object.entries(typeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
      setTopTypes(types)
    }

    setLoading(false)
  }

  if (loading) {
    return <div className="text-center text-gray-500 py-12">Loading stats...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{convergence.name} Stats</h1>
        <p className="text-gray-400 text-sm">Real-time knowledge graph statistics</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-[#a6ed2a]" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">Contributions</span>
          </div>
          <div className="text-2xl font-bold">{stats.contributions.toLocaleString()}</div>
        </div>

        <div className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <GitBranch className="w-4 h-4 text-[#a6ed2a]" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">Artifacts</span>
          </div>
          <div className="text-2xl font-bold">{stats.artifacts.toLocaleString()}</div>
        </div>

        <div className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-[#a6ed2a]" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">Participants</span>
          </div>
          <div className="text-2xl font-bold">{stats.participants.toLocaleString()}</div>
        </div>

        <div className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-[#a6ed2a]" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">Relationships</span>
          </div>
          <div className="text-2xl font-bold">{stats.relationships.toLocaleString()}</div>
        </div>

        <div className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-[#a6ed2a]" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">Sessions</span>
          </div>
          <div className="text-2xl font-bold">{stats.sessions.toLocaleString()}</div>
        </div>
      </div>

      {/* Top Dimensions */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-4">
          <h2 className="font-bold mb-3">Top Dimensions</h2>
          <div className="space-y-2">
            {topDimensions.map(d => (
              <div key={d.key} className="flex items-center justify-between">
                <span className="text-sm">{d.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-[#1d2839] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#a6ed2a]"
                      style={{ width: `${(d.count / (topDimensions[0]?.count || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-8 text-right">{d.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-4">
          <h2 className="font-bold mb-3">Top Artifact Types</h2>
          <div className="space-y-2">
            {topTypes.map(t => (
              <div key={t.type} className="flex items-center justify-between">
                <span className="text-sm capitalize">{t.type}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-[#1d2839] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#a6ed2a]"
                      style={{ width: `${(t.count / (topTypes[0]?.count || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-8 text-right">{t.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-600">
        Updates in real-time as new contributions are processed
      </div>
    </div>
  )
}
