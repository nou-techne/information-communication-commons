import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, Users, Link2, TrendingUp } from 'lucide-react';

interface Stats {
  totalArtifacts: number;
  totalParticipants: number;
  totalRelationships: number;
  recentContributions: number;
}

interface RecentArtifact {
  id: string;
  title: string;
  created_at: string;
  rea_role: 'resource' | 'event' | 'agent';
}

interface DimensionStat {
  dimension: string;
  count: number;
  color: string;
}

const REA_COLORS = {
  resource: 'bg-green-500',
  event: 'bg-amber-500',
  agent: 'bg-blue-500',
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalArtifacts: 0,
    totalParticipants: 0,
    totalRelationships: 0,
    recentContributions: 0,
  });
  const [recentArtifacts, setRecentArtifacts] = useState<RecentArtifact[]>([]);
  const [dimensions, setDimensions] = useState<DimensionStat[]>([]);

  const loadStats = async () => {
    // Total artifacts
    const { count: artifactCount } = await supabase
      .from('artifacts')
      .select('*', { count: 'exact', head: true });

    // Total participants (agent artifacts with agent_type='human')
    const { count: participantCount } = await supabase
      .from('artifacts')
      .select('*', { count: 'exact', head: true })
      .eq('rea_role', 'agent')
      .eq('agent_type', 'human');

    // Total relationships
    const { count: relationshipCount } = await supabase
      .from('artifact_relationships')
      .select('*', { count: 'exact', head: true });

    // Recent contributions (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabase
      .from('contributions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneHourAgo);

    setStats({
      totalArtifacts: artifactCount || 0,
      totalParticipants: participantCount || 0,
      totalRelationships: relationshipCount || 0,
      recentContributions: recentCount || 0,
    });
  };

  const loadRecentArtifacts = async () => {
    const { data } = await supabase
      .from('artifacts')
      .select('id, title, created_at, rea_role')
      .order('created_at', { ascending: false })
      .limit(8);

    if (data) {
      setRecentArtifacts(data as RecentArtifact[]);
    }
  };

  const loadDimensions = async () => {
    const { data } = await supabase
      .from('artifact_tags')
      .select('tag')
      .like('tag', 'hlamt:%');

    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((row) => {
        const dim = row.tag.split(':')[1];
        counts[dim] = (counts[dim] || 0) + 1;
      });

      const dimensionColors: Record<string, string> = {
        E: 'bg-emerald-500',
        H: 'bg-violet-500',
        L: 'bg-pink-500',
        A: 'bg-cyan-500',
        M: 'bg-amber-500',
        T: 'bg-orange-500',
      };

      const dimensionStats: DimensionStat[] = Object.entries(counts).map(([dim, count]) => ({
        dimension: dim,
        count,
        color: dimensionColors[dim] || 'bg-gray-500',
      }));

      dimensionStats.sort((a, b) => b.count - a.count);
      setDimensions(dimensionStats);
    }
  };

  useEffect(() => {
    loadStats();
    loadRecentArtifacts();
    loadDimensions();

    // Refresh every 10 seconds
    const interval = setInterval(() => {
      loadStats();
      loadRecentArtifacts();
      loadDimensions();
    }, 10000);

    // Subscribe to real-time updates
    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'artifacts' }, loadStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, loadStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'relationships' }, loadStats)
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const timeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100 p-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="text-[#c3fd50] font-bold text-5xl tracking-tight">EthBoulder</div>
          <div className="text-gray-500 text-5xl">.commons.id</div>
        </div>
        <div className="text-gray-500 text-lg">Knowledge Graph · Live</div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 text-center">
          <div className="flex justify-center mb-3">
            <Activity className="w-8 h-8 text-[#c3fd50]" />
          </div>
          <div className="text-4xl font-bold mb-1">{stats.totalArtifacts}</div>
          <div className="text-gray-500 text-sm uppercase tracking-wide">Artifacts</div>
        </div>

        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 text-center">
          <div className="flex justify-center mb-3">
            <Users className="w-8 h-8 text-violet-500" />
          </div>
          <div className="text-4xl font-bold mb-1">{stats.totalParticipants}</div>
          <div className="text-gray-500 text-sm uppercase tracking-wide">Participants</div>
        </div>

        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 text-center">
          <div className="flex justify-center mb-3">
            <Link2 className="w-8 h-8 text-cyan-500" />
          </div>
          <div className="text-4xl font-bold mb-1">{stats.totalRelationships}</div>
          <div className="text-gray-500 text-sm uppercase tracking-wide">Relationships</div>
        </div>

        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 text-center">
          <div className="flex justify-center mb-3">
            <TrendingUp className="w-8 h-8 text-[#c3fd50]" />
          </div>
          <div className="text-4xl font-bold mb-1">{stats.recentContributions}</div>
          <div className="text-gray-500 text-sm uppercase tracking-wide">Last Hour</div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-8">
        {/* Recent Artifacts */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-300">Recent Artifacts</h2>
          <div className="space-y-3">
            {recentArtifacts.map((artifact) => (
              <div key={artifact.id} className="flex items-start gap-3 p-3 bg-[#0f0f0f] rounded border border-gray-800">
                <div className={`w-2 h-2 rounded-full mt-2 ${REA_COLORS[artifact.rea_role]}`}></div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-200 truncate">{artifact.title}</div>
                  <div className="text-sm text-gray-500">{timeAgo(artifact.created_at)} ago</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dimension Distribution */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-300">Dimension Distribution</h2>
          <div className="space-y-4">
            {dimensions.map((dim) => {
              const maxCount = dimensions[0]?.count || 1;
              const widthPercent = (dim.count / maxCount) * 100;
              
              return (
                <div key={dim.dimension}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${dim.color}`}></div>
                      <span className="text-gray-300 font-medium">{dim.dimension}/</span>
                    </div>
                    <span className="text-2xl font-bold">{dim.count}</span>
                  </div>
                  <div className="w-full bg-[#0f0f0f] rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${dim.color} transition-all duration-500`}
                      style={{ width: `${widthPercent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Indicator */}
      <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-[#1a1a1a] border border-gray-800 rounded-full px-4 py-2">
        <div className="w-2 h-2 rounded-full bg-[#c3fd50] animate-pulse"></div>
        <span className="text-sm text-gray-400">LIVE</span>
      </div>
    </div>
  );
}
