// Sprint 83: Commitment Tracking Dashboard
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { CheckCircle, Clock, XCircle, Circle } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'

interface Commitment {
  id: string
  commitment_text: string
  status: 'made' | 'in_progress' | 'fulfilled' | 'broken'
  due_date: string | null
  created_at: string
  thread_id: string
  thread_title?: string
}

interface CommitmentStats {
  total: number
  made: number
  in_progress: number
  fulfilled: number
  broken: number
  fulfillment_rate: number
}

const STATUS_COLORS = {
  made: 'bg-gray-700 text-gray-300',
  in_progress: 'bg-blue-900/30 text-blue-400',
  fulfilled: 'bg-green-900/30 text-green-400',
  broken: 'bg-red-900/30 text-red-400',
}

const STATUS_ICONS = {
  made: Circle,
  in_progress: Clock,
  fulfilled: CheckCircle,
  broken: XCircle,
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function CommitmentDashboard() {
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [stats, setStats] = useState<CommitmentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [participantId, setParticipantId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) loadData()
  }, [session])

  async function loadData() {
    if (!session) return

    // Get participant ID
    const { data: participant } = await supabase
      .from('participants')
      .select('id')
      .eq('auth_id', session.user.id)
      .single()

    if (!participant) return
    setParticipantId(participant.id)

    // Load commitments
    const { data: commitmentData } = await supabase
      .from('commitments')
      .select(`
        *,
        thread:threads(title)
      `)
      .eq('participant_id', participant.id)
      .order('created_at', { ascending: false })

    const formatted = (commitmentData || []).map(c => ({
      ...c,
      thread_title: c.thread?.title
    }))
    setCommitments(formatted)

    // Load stats
    const { data: statsData } = await supabase.rpc('get_commitment_stats', {
      p_participant_id: participant.id
    })

    if (statsData && statsData.length > 0) {
      setStats(statsData[0])
    }

    setLoading(false)
  }

  async function updateStatus(commitmentId: string, newStatus: Commitment['status']) {
    const { error } = await supabase.rpc('update_commitment_status', {
      p_commitment_id: commitmentId,
      p_status: newStatus
    })

    if (!error) {
      await loadData()
    }
  }

  if (loading) return <div className="text-center text-gray-500 py-12">Loading...</div>

  if (!session) {
    return (
      <div className="text-center py-16">
        <h3 className="text-xl font-bold text-white mb-2">Authentication Required</h3>
        <p className="text-gray-400 text-sm">Sign in to view your commitments</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">My Commitments</h1>
        <p className="text-sm text-gray-400">Track commitments and fulfillment rate</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-300">{stats.made}</div>
            <div className="text-xs text-gray-500">Made</div>
          </div>
          <div className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{stats.in_progress}</div>
            <div className="text-xs text-gray-500">In Progress</div>
          </div>
          <div className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{stats.fulfilled}</div>
            <div className="text-xs text-gray-500">Fulfilled</div>
          </div>
          <div className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-4">
            <div className="text-2xl font-bold text-[#a6ed2a]">{stats.fulfillment_rate}%</div>
            <div className="text-xs text-gray-500">Fulfillment</div>
          </div>
        </div>
      )}

      {/* Commitments List */}
      {commitments.length === 0 ? (
        <div className="text-center py-16 bg-[#0a101d] border border-[#1d2839] rounded-lg">
          <Circle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No commitments yet</h3>
          <p className="text-gray-400 text-sm">Commitments can be extracted from messages</p>
        </div>
      ) : (
        <div className="space-y-3">
          {commitments.map(c => {
            const Icon = STATUS_ICONS[c.status]
            return (
              <div
                key={c.id}
                className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white mb-2">{c.commitment_text}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {c.thread_title && <span>Thread: {c.thread_title}</span>}
                      <span>{timeAgo(c.created_at)}</span>
                      {c.due_date && (
                        <span className={new Date(c.due_date) < new Date() ? 'text-red-400' : ''}>
                          Due: {new Date(c.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[c.status]}`}>
                      {c.status.replace('_', ' ')}
                    </span>
                    {c.status !== 'fulfilled' && c.status !== 'broken' && (
                      <select
                        value={c.status}
                        onChange={(e) => updateStatus(c.id, e.target.value as Commitment['status'])}
                        className="bg-[#080c16] border border-[#1d2839] rounded px-2 py-1 text-xs text-white"
                      >
                        <option value="made">Made</option>
                        <option value="in_progress">In Progress</option>
                        <option value="fulfilled">Fulfilled</option>
                        <option value="broken">Broken</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
