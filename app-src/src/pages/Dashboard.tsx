import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, Users, Link2, TrendingUp, Info, BookOpen, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardBody } from '../components/ui/Card';

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

const DIMENSION_INFO: Record<string, { letter: string; name: string; desc: string; color: string; explain: string }> = {
  E: {
    letter: 'e/',
    name: 'Ecology',
    desc: 'Where We Are',
    color: '#4a8c6f',
    explain: 'The bioregional and environmental context — watersheds, ecosystems, and the living systems that ground our work in place.',
  },
  H: {
    letter: 'H/',
    name: 'Human',
    desc: "Who's Here",
    color: '#c4956a',
    explain: 'The people, their backgrounds, skills, and the relationships between participants. Every convergence is ultimately about who shows up.',
  },
  L: {
    letter: 'L/',
    name: 'Language',
    desc: 'How We Talk',
    color: '#c3fd50',
    explain: 'The shared vocabulary, concepts, and frameworks that enable coordination. Language is the medium through which collective intelligence flows.',
  },
  A: {
    letter: 'A/',
    name: 'Artifacts',
    desc: "What We're Building",
    color: '#8bbfff',
    explain: 'The tools, protocols, software, and tangible outputs. Artifacts persist beyond the event — they are what remains after the conversation ends.',
  },
  M: {
    letter: 'M/',
    name: 'Methodology',
    desc: 'How We Work',
    color: '#7ccfb8',
    explain: 'The processes, governance patterns, and coordination mechanisms. How groups organize, make decisions, and allocate resources.',
  },
  T: {
    letter: 'T/',
    name: 'Training',
    desc: "What We're Learning",
    color: '#e8927c',
    explain: 'The transformation of practitioners through practice. Skills developed, insights gained, and capacity built during the convergence.',
  },
};

// Fixed order for dimensions
const DIMENSION_ORDER = ['E', 'H', 'L', 'A', 'M', 'T'];

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
    const { count: artifactCount } = await supabase
      .from('artifacts')
      .select('*', { count: 'exact', head: true });

    const { count: participantCount } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true });

    const { count: relationshipCount } = await supabase
      .from('artifact_relationships')
      .select('*', { count: 'exact', head: true });

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
      .select('tag_id, tags(name)')
      .not('tags', 'is', null);

    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((row: any) => {
        const tagName = row.tags?.name;
        if (!tagName || !tagName.startsWith('hlamt:')) return;
        const dim = tagName.split(':')[1];
        counts[dim] = (counts[dim] || 0) + 1;
      });

      const dimensionStats: DimensionStat[] = DIMENSION_ORDER.map((dim) => ({
        dimension: dim,
        count: counts[dim] || 0,
        color: DIMENSION_INFO[dim]?.color || '#888',
      }));

      setDimensions(dimensionStats);
    }
  };

  useEffect(() => {
    loadStats();
    loadRecentArtifacts();
    loadDimensions();

    const interval = setInterval(() => {
      loadStats();
      loadRecentArtifacts();
      loadDimensions();
    }, 10000);

    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'artifacts' }, loadStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, loadStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'artifact_relationships' }, loadStats)
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
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const maxDimCount = Math.max(...dimensions.map(d => d.count), 1);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100 p-4 sm:p-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="text-[#c3fd50] font-bold text-4xl sm:text-5xl tracking-tight">EthBoulder</div>
          <div className="text-gray-500 text-4xl sm:text-5xl">.commons.id</div>
        </div>
        <div className="text-gray-500 text-lg mb-4">Knowledge Graph · Live</div>
      </div>

      {/* What is this? */}
      <Card className="mb-8">
        <CardBody>
          <div className="flex items-start gap-3">
            <Compass className="w-5 h-5 text-[#c3fd50] mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="text-lg font-semibold text-gray-200 mb-2">What is this?</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-3">
                This is a <strong className="text-gray-300">living knowledge graph</strong> for ETHBoulder 2026.
                Every session, conversation, and contribution is captured, extracted into structured artifacts, and connected
                through relationships — building a collective map of what happened, who was involved, and what emerged.
              </p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Knowledge is organized across <strong className="text-gray-300">six observation dimensions</strong> from
                the <a href="https://the-habitat.org/thesis" target="_blank" rel="noopener noreferrer" className="text-[#c3fd50] hover:text-white transition-colors">H-LAM/T framework</a> — a
                model for understanding how humans, language, artifacts, and methodology combine to augment collective intelligence.
                Each dimension reveals a different facet of the convergence.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <Card>
          <CardBody className="text-center">
            <div className="flex justify-center mb-3">
              <Activity className="w-7 h-7 text-[#c3fd50]" />
            </div>
            <div className="text-3xl sm:text-4xl font-bold mb-1">{stats.totalArtifacts}</div>
            <div className="text-gray-500 text-xs sm:text-sm uppercase tracking-wide">Artifacts</div>
            <div className="text-gray-600 text-xs mt-1">Ideas, proposals, patterns</div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <div className="flex justify-center mb-3">
              <Users className="w-7 h-7 text-violet-500" />
            </div>
            <div className="text-3xl sm:text-4xl font-bold mb-1">{stats.totalParticipants}</div>
            <div className="text-gray-500 text-xs sm:text-sm uppercase tracking-wide">Participants</div>
            <div className="text-gray-600 text-xs mt-1">People contributing</div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <div className="flex justify-center mb-3">
              <Link2 className="w-7 h-7 text-cyan-500" />
            </div>
            <div className="text-3xl sm:text-4xl font-bold mb-1">{stats.totalRelationships}</div>
            <div className="text-gray-500 text-xs sm:text-sm uppercase tracking-wide">Connections</div>
            <div className="text-gray-600 text-xs mt-1">Links between artifacts</div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <div className="flex justify-center mb-3">
              <TrendingUp className="w-7 h-7 text-[#c3fd50]" />
            </div>
            <div className="text-3xl sm:text-4xl font-bold mb-1">{stats.recentContributions}</div>
            <div className="text-gray-500 text-xs sm:text-sm uppercase tracking-wide">Last Hour</div>
            <div className="text-gray-600 text-xs mt-1">New contributions</div>
          </CardBody>
        </Card>
      </div>

      {/* Observation Dimensions — full width */}
      <Card className="mb-8">
        <CardBody>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-[#c3fd50]" />
            <h2 className="text-xl font-semibold text-gray-200">Observation Dimensions</h2>
          </div>
          <p className="text-gray-500 text-sm mb-5">
            The e/H-LAM/T framework observes convergences through six lenses. Click any dimension to explore its artifacts.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dimensions.map((dim) => {
              const info = DIMENSION_INFO[dim.dimension];
              if (!info) return null;
              const dimKey = dim.dimension === 'E' ? 'e' : dim.dimension;
              const widthPercent = maxDimCount > 0 ? (dim.count / maxDimCount) * 100 : 0;

              return (
                <Link
                  key={dim.dimension}
                  to={`/d/${dimKey}`}
                  className="block rounded-lg border border-[#262626] bg-[#1a1a1a] p-4 hover:border-opacity-60 transition-all group"
                  style={{ borderColor: dim.count > 0 ? info.color + '30' : undefined }}
                >
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-mono text-2xl font-bold" style={{ color: info.color }}>{info.letter}</span>
                    <span className="text-base font-semibold text-gray-200 group-hover:text-white transition-colors">{info.name}</span>
                    <span className="text-xs text-gray-500 ml-auto">{dim.count}</span>
                  </div>
                  <div className="text-xs font-medium mb-2" style={{ color: info.color + 'cc' }}>{info.desc}</div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{info.explain}</p>
                  <div className="w-full bg-[#0f0f0f] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${widthPercent}%`, backgroundColor: info.color }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Two Column: How it works + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* How it works */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-[#c3fd50]" />
              <h2 className="text-lg font-semibold text-gray-200">How It Works</h2>
            </div>
            <div className="space-y-4 text-sm">
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-[#c3fd50]/10 text-[#c3fd50] flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
                <div>
                  <div className="font-medium text-gray-300 mb-0.5">Contribute</div>
                  <div className="text-gray-500">Share session notes, observations, or ideas through the <Link to="/contribute" className="text-[#c3fd50] hover:text-white transition-colors">Contribute</Link> page.</div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-[#c3fd50]/10 text-[#c3fd50] flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
                <div>
                  <div className="font-medium text-gray-300 mb-0.5">Extract</div>
                  <div className="text-gray-500">AI identifies artifacts, people, relationships, and dimensions — structuring free-form notes into a knowledge graph.</div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-[#c3fd50]/10 text-[#c3fd50] flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
                <div>
                  <div className="font-medium text-gray-300 mb-0.5">Connect</div>
                  <div className="text-gray-500">Artifacts link together across sessions and dimensions, revealing patterns no single person could see alone.</div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-[#c3fd50]/10 text-[#c3fd50] flex items-center justify-center flex-shrink-0 text-xs font-bold">4</div>
                <div>
                  <div className="font-medium text-gray-300 mb-0.5">Explore</div>
                  <div className="text-gray-500">Browse the <Link to="/graph" className="text-[#c3fd50] hover:text-white transition-colors">knowledge graph</Link>, <Link to="/dimensions" className="text-[#c3fd50] hover:text-white transition-colors">dimensions</Link>, and <Link to="/" className="text-[#c3fd50] hover:text-white transition-colors">activity feed</Link> to discover what's emerging.</div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Recent Artifacts */}
        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold mb-4 text-gray-200">Recent Artifacts</h2>
            <div className="space-y-2">
              {recentArtifacts.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center">No artifacts yet. Be the first to <Link to="/contribute" className="text-[#c3fd50] hover:text-white">contribute</Link>!</p>
              ) : (
                recentArtifacts.map((artifact) => (
                  <Link
                    key={artifact.id}
                    to={`/artifact/${artifact.id}`}
                    className="flex items-start gap-3 p-3 bg-[#0f0f0f] rounded border border-gray-800 hover:border-[#c3fd50]/30 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${REA_COLORS[artifact.rea_role] || 'bg-gray-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-200 truncate text-sm">{artifact.title}</div>
                      <div className="text-xs text-gray-500">{timeAgo(artifact.created_at)} ago · {artifact.rea_role}</div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* REA Ontology explainer */}
      <Card className="mb-8">
        <CardBody>
          <h2 className="text-lg font-semibold text-gray-200 mb-3">Understanding the Graph</h2>
          <p className="text-gray-500 text-sm mb-4">
            Every artifact in the knowledge graph is classified using the <strong className="text-gray-300">REA ontology</strong> (Resource–Event–Agent) — an accounting framework that makes economic and social relationships legible.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg bg-[#0f0f0f] border border-green-500/20 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="font-medium text-green-400 text-sm">Resource</span>
              </div>
              <p className="text-xs text-gray-500">Things of value — tools, protocols, ideas, proposals. The building blocks that persist beyond the event.</p>
            </div>
            <div className="rounded-lg bg-[#0f0f0f] border border-amber-500/20 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="font-medium text-amber-400 text-sm">Event</span>
              </div>
              <p className="text-xs text-gray-500">Things that happen — sessions, workshops, discussions, decisions. Events transform resources and connect agents.</p>
            </div>
            <div className="rounded-lg bg-[#0f0f0f] border border-blue-500/20 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="font-medium text-blue-400 text-sm">Agent</span>
              </div>
              <p className="text-xs text-gray-500">People and organizations — the participants who create, steward, and transform resources through events.</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Live Indicator */}
      <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-[#1a1a1a] border border-gray-800 rounded-full px-4 py-2">
        <div className="w-2 h-2 rounded-full bg-[#c3fd50] animate-pulse"></div>
        <span className="text-sm text-gray-400">LIVE</span>
      </div>
    </div>
  );
}
