import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Handshake } from 'lucide-react'

interface Props {
  artifactId: string
  participantId: string | null
  compact?: boolean
}

export function CoordinateButton({ artifactId, participantId, compact = false }: Props) {
  const [interested, setInterested] = useState(false)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      // Get count of interests for this artifact
      const { count: total } = await supabase
        .from('coordination_interests')
        .select('*', { count: 'exact', head: true })
        .eq('artifact_id', artifactId)

      setCount(total || 0)

      // Check if current participant is interested
      if (participantId) {
        const { data } = await supabase
          .from('coordination_interests')
          .select('id')
          .eq('artifact_id', artifactId)
          .eq('participant_id', participantId)
          .maybeSingle()

        setInterested(!!data)
      }
    }
    load()
  }, [artifactId, participantId])

  async function toggleInterest() {
    if (!participantId || loading) return
    setLoading(true)

    try {
      if (interested) {
        await supabase
          .from('coordination_interests')
          .delete()
          .eq('artifact_id', artifactId)
          .eq('participant_id', participantId)
        setInterested(false)
        setCount(c => Math.max(0, c - 1))
      } else {
        await supabase
          .from('coordination_interests')
          .insert({ artifact_id: artifactId, participant_id: participantId })
        setInterested(true)
        setCount(c => c + 1)
      }
    } catch (err) {
      console.error('Coordinate toggle error:', err)
    }
    setLoading(false)
  }

  if (compact) {
    return (
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleInterest(); }}
        disabled={!participantId || loading}
        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
          interested
            ? 'bg-[#a6ed2a]/20 text-[#a6ed2a] border border-[#a6ed2a]/30'
            : 'bg-[#1d2839] text-gray-400 hover:text-[#a6ed2a] hover:bg-[#a6ed2a]/10'
        } ${!participantId ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={participantId ? (interested ? 'Remove coordination interest' : 'I want to coordinate on this') : 'Sign in to coordinate'}
      >
        <Handshake className="w-3 h-3" />
        {count > 0 && <span>{count}</span>}
      </button>
    )
  }

  return (
    <button
      onClick={toggleInterest}
      disabled={!participantId || loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
        interested
          ? 'bg-[#a6ed2a]/20 text-[#a6ed2a] border border-[#a6ed2a]/30'
          : 'bg-[#1d2839] text-gray-300 hover:text-[#a6ed2a] hover:bg-[#a6ed2a]/10'
      } ${!participantId ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Handshake className="w-4 h-4" />
      <span>{interested ? 'Coordinating' : 'Coordinate'}</span>
      {count > 0 && (
        <span className="px-1.5 py-0.5 rounded-full bg-[#1d2839] text-xs">{count}</span>
      )}
    </button>
  )
}
