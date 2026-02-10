import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase, ARTIFACT_COLORS, STATE_LABELS } from '../lib/supabase'
import type { Artifact, Commitment } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

interface Contribution {
  id: string
  content: string
  status: string
  created_at: string
  processed_at: string | null
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function MyThread() {
  const [session, setSession] = useState<Session | null>(null)
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load contributions for everyone (no auth required)
    loadContributions()

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) { setLoading(false); return }
      loadParticipant(data.session.user.id)
    })

    // Real-time subscription for contribution status updates
    const contribSub = supabase.channel('my-contributions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, () => {
        loadContributions()
      })
      .subscribe()

    return () => { supabase.removeChannel(contribSub) }
  }, [])

  async function loadContributions() {
    const { data } = await supabase
      .from('contributions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    setContributions(data || [])
  }

  async function loadParticipant(authId: string) {
    const { data: p } = await supabase.from('participants').select('id').eq('auth_user_id', authId).single()
    if (!p) { setLoading(false); return }
    setParticipantId(p.id)

    const [{ data: arts }, { data: comms }] = await Promise.all([
      supabase.from('artifacts').select('*').or(`created_by.eq.${p.id},steward_id.eq.${p.id}`).order('created_at', { ascending: false }).limit(20),
      supabase.from('commitments').select('*').eq('participant_id', p.id).order('created_at', { ascending: false }),
    ])
    setArtifacts(arts || [])
    setCommitments(comms || [])
    setLoading(false)
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-900/50 text-yellow-300',
    processing: 'bg-blue-900/50 text-blue-300',
    complete: 'bg-green-900/50 text-green-300',
    error: 'bg-red-900/50 text-red-300',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Thread</h1>
        <Link to="/contribute" className="bg-[#c3fd50] text-[#0f0f0f] hover:bg-[#d4fe80] px-4 py-2 rounded-lg text-sm transition-colors">
          + Contribute
        </Link>
      </div>

      {/* Contributions */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-gray-300">Contributions</h2>
        {contributions.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 text-center">
            <p className="text-gray-400">No contributions yet.</p>
            <p className="text-sm text-gray-500 mt-2">Share something on the Contribute page and watch it appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {contributions.map(c => (
              <div key={c.id} className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[c.status] || 'bg-gray-800 text-gray-400'}`}>
                    {c.status}
                  </span>
                  <span className="text-xs text-gray-500">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-sm text-gray-300 line-clamp-3">{c.content}</p>
                {c.processed_at && (
                  <p className="text-xs text-gray-600 mt-2">Processed {timeAgo(c.processed_at)}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Artifacts (if signed in with linked participant) */}
      {artifacts.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-gray-300">My Artifacts</h2>
          <div className="space-y-2">
            {artifacts.map(a => (
              <Link key={a.id} to={`/artifact/${a.id}`} className="flex items-center gap-3 bg-[#1a1a1a] border border-[#262626] rounded-lg p-3 hover:border-[#c3fd50] transition-colors">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ARTIFACT_COLORS[a.type] }} />
                <span className="flex-1 font-medium">{a.title}</span>
                <span className="text-xs text-gray-500">{STATE_LABELS[a.state]}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Commitments (if signed in with linked participant) */}
      {commitments.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 text-gray-300">My Commitments</h2>
          <div className="space-y-2">
            {commitments.map(c => (
              <div key={c.id} className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#f4d9a0]">{c.description}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    c.status === 'fulfilled' ? 'bg-green-900 text-green-300' :
                    c.status === 'in_progress' ? 'bg-blue-900 text-blue-300' :
                    c.status === 'broken' ? 'bg-red-900 text-red-300' :
                    'bg-gray-800 text-gray-400'
                  }`}>{c.status}</span>
                </div>
                {c.due_date && <div className="text-xs text-gray-500 mt-1">Due: {c.due_date}</div>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
