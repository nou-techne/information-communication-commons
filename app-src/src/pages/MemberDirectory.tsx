/**
 * Member Directory — Public view of founding members from chain entries
 * Sprint Q101
 */

import { useState, useEffect } from 'react'
import { useConvergence } from '../contexts/ConvergenceContext'
import { supabase } from '../lib/supabase'
import { Users, User, Calendar, Link2, ShieldCheck } from 'lucide-react'

interface MemberEntry {
  chain_index: number
  content_hash: string
  payload: Record<string, unknown>
  created_at: string
}

interface Member {
  name: string
  role: string
  joinedAt: string
  chainIndex: number
  hash: string
}

export function MemberDirectory() {
  const { convergence } = useConvergence()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMembers()
  }, [convergence.id])

  async function loadMembers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('chain_entries')
      .select('chain_index, content_hash, payload, created_at')
      .eq('convergence_id', convergence.id)
      .eq('event_type', 'people.member.created')
      .order('chain_index', { ascending: true })

    if (error || !data) {
      setLoading(false)
      return
    }

    const parsed = (data as MemberEntry[]).map(entry => {
      const p = entry.payload as Record<string, unknown>
      return {
        name: (p.name as string) || (p.member_name as string) || `Member #${entry.chain_index}`,
        role: (p.role as string) || (p.member_role as string) || 'Patron Member',
        joinedAt: entry.created_at,
        chainIndex: entry.chain_index,
        hash: entry.content_hash,
      }
    })
    setMembers(parsed)
    setLoading(false)
  }

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch { return iso }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
          <Users className="w-6 h-6 text-amber-400" />
          Members
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Founding members of {convergence.name} — verified on chain
        </p>
      </div>

      {loading ? (
        <div className="text-center text-white/30 py-12">Loading members from chain…</div>
      ) : members.length === 0 ? (
        <div className="text-center text-white/30 py-12">No members found on chain.</div>
      ) : (
        <>
          <div className="flex items-center gap-2 text-xs text-white/30">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{members.length} members verified on append-only chain</span>
          </div>

          <div className="grid gap-3">
            {members.map(member => (
              <div
                key={member.chainIndex}
                className="flex items-center gap-4 p-4 border border-white/5 rounded-lg bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{member.name}</div>
                  <div className="text-xs text-white/40">{member.role}</div>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-white/20 flex-shrink-0">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(member.joinedAt)}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Link2 className="w-3 h-3" />
                    #{member.chainIndex}
                  </span>
                  <span className="font-mono hidden sm:inline" title={member.hash}>
                    {member.hash.slice(0, 8)}…
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
