import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase, ARTIFACT_COLORS, STATE_LABELS } from '../lib/supabase'
import type { Artifact, Commitment } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

export function MyThread() {
  const [session, setSession] = useState<Session | null>(null)
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) { setLoading(false); return }
      loadParticipant(data.session.user.id)
    })
  }, [])

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

  if (!session) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-4">🧵 My Thread</h2>
        <p className="text-gray-400 mb-4">Sign in to see your artifacts, commitments, and connections.</p>
        <Link to="/auth" className="bg-[#3d7cc9] hover:bg-[#5b9de4] text-white px-6 py-2 rounded-lg transition-colors">
          Sign in
        </Link>
      </div>
    )
  }

  if (loading) return <div className="text-center text-gray-500 py-12">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🧵 My Thread</h1>
        <Link to="/contribute" className="bg-[#3d7cc9] hover:bg-[#5b9de4] text-white px-4 py-2 rounded-lg text-sm transition-colors">
          + Contribute
        </Link>
      </div>

      {!participantId && (
        <div className="bg-[#111d33] border border-[#1a2a44] rounded-xl p-6 text-center">
          <p className="text-gray-400">No participant profile linked to your account yet.</p>
          <p className="text-sm text-gray-500 mt-2">Your profile will be created when you contribute your first artifact.</p>
        </div>
      )}

      {artifacts.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-gray-300">My Artifacts</h2>
          <div className="space-y-2">
            {artifacts.map(a => (
              <Link key={a.id} to={`/artifact/${a.id}`} className="flex items-center gap-3 bg-[#111d33] border border-[#1a2a44] rounded-lg p-3 hover:border-[#5b9de4] transition-colors">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ARTIFACT_COLORS[a.type] }} />
                <span className="flex-1 font-medium">{a.title}</span>
                <span className="text-xs text-gray-500">{STATE_LABELS[a.state]}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {commitments.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 text-gray-300">My Commitments</h2>
          <div className="space-y-2">
            {commitments.map(c => (
              <div key={c.id} className="bg-[#111d33] border border-[#1a2a44] rounded-lg p-3">
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
