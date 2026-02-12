import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Handshake } from 'lucide-react'

interface Props {
  artifactId: string
  participantId?: string | null
  compact?: boolean
}

export function CoordinateButton({ artifactId, compact = false }: Props) {
  const [interested, setInterested] = useState(false)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [resolvedParticipantId, setResolvedParticipantId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      // Get auth session
      const { data: { session: s } } = await supabase.auth.getSession()
      setSession(s)

      // Get count of interests for this artifact
      const { count: total } = await supabase
        .from('coordination_interests')
        .select('*', { count: 'exact', head: true })
        .eq('artifact_id', artifactId)

      setCount(total || 0)

      // Check if current user is interested
      if (s?.user) {
        const { data: p } = await supabase
          .from('participants')
          .select('id')
          .eq('auth_user_id', s.user.id)
          .maybeSingle()

        if (p) {
          setResolvedParticipantId(p.id)
          const { data: interest } = await supabase
            .from('coordination_interests')
            .select('id')
            .eq('artifact_id', artifactId)
            .eq('participant_id', p.id)
            .maybeSingle()
          setInterested(!!interest)
        }
      }
    }
    load()
  }, [artifactId])

  async function getOrCreateParticipant(): Promise<string | null> {
    if (resolvedParticipantId) return resolvedParticipantId
    if (!session?.user) return null

    // Try to find existing
    const { data: p } = await supabase
      .from('participants')
      .select('id')
      .eq('auth_user_id', session.user.id)
      .maybeSingle()

    if (p) {
      setResolvedParticipantId(p.id)
      return p.id
    }

    // Create new participant
    const { data: np } = await supabase
      .from('participants')
      .insert({ name: session.user.email?.split('@')[0] || 'anon', auth_user_id: session.user.id })
      .select('id')
      .single()

    if (np) {
      setResolvedParticipantId(np.id)
      return np.id
    }
    return null
  }

  async function toggleInterest() {
    if (!session || loading) return
    setLoading(true)

    try {
      const pid = await getOrCreateParticipant()
      if (!pid) {
        setLoading(false)
        return
      }

      if (interested) {
        await supabase
          .from('coordination_interests')
          .delete()
          .eq('artifact_id', artifactId)
          .eq('participant_id', pid)
        setInterested(false)
        setCount(c => Math.max(0, c - 1))
      } else {
        await supabase
          .from('coordination_interests')
          .insert({ artifact_id: artifactId, participant_id: pid })
        setInterested(true)
        setCount(c => c + 1)
      }
    } catch (err) {
      console.error('Coordinate toggle error:', err)
    }
    setLoading(false)
  }

  const isDisabled = !session

  if (compact) {
    return (
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleInterest(); }}
        disabled={isDisabled || loading}
        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
          interested
            ? 'bg-[#a6ed2a]/20 text-[#a6ed2a] border border-[#a6ed2a]/30'
            : 'bg-[#1d2839] text-gray-400 hover:text-[#a6ed2a] hover:bg-[#a6ed2a]/10'
        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title={session ? (interested ? 'Remove coordination interest' : 'I want to coordinate on this') : 'Sign in to coordinate'}
      >
        <Handshake className="w-3 h-3" />
        {count > 0 && <span>{count}</span>}
      </button>
    )
  }

  return (
    <button
      onClick={toggleInterest}
      disabled={isDisabled || loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
        interested
          ? 'bg-[#a6ed2a]/20 text-[#a6ed2a] border border-[#a6ed2a]/30'
          : 'bg-[#1d2839] text-gray-300 hover:text-[#a6ed2a] hover:bg-[#a6ed2a]/10'
      } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <Handshake className="w-4 h-4" />
      <span>{interested ? 'Coordinating' : 'Coordinate'}</span>
      {count > 0 && (
        <span className="px-1.5 py-0.5 rounded-full bg-[#1d2839] text-xs">{count}</span>
      )}
    </button>
  )
}
