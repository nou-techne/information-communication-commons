/**
 * Unified Member Profile — The "Whole Member" View
 * 
 * Sprint Q72: Single page combining patronage, royalties, learning, governance.
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useConvergence } from '../contexts/ConvergenceContext'
import { supabase } from '../lib/supabase'
import { MemberCapitalDashboard } from '../components/MemberCapitalDashboard'
import { MemberContributionHistory } from '../components/MemberContributionHistory'
import { MemberRoyaltiesDashboard } from '../components/MemberRoyaltiesDashboard'
import { ContextualHelp } from '../components/ContextualHelp'
import {
  User, Wallet, FileText, Gem, GraduationCap,
  Vote, Shield, Clock, Loader2
} from 'lucide-react'

type Tab = 'overview' | 'contributions' | 'royalties' | 'governance' | 'learning'

interface MemberData {
  id: string
  name: string
  affiliation?: string
  bio?: string
  interests: string[]
  tier: string
  joinedAt: string
}

export function MemberProfile() {
  const { memberId } = useParams<{ memberId: string }>()
  const { convergence } = useConvergence()
  const [tab, setTab] = useState<Tab>('overview')
  const [member, setMember] = useState<MemberData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSelf, setIsSelf] = useState(false)

  // Stats (computed)
  const [stats, setStats] = useState({
    contributions: 0,
    ventures: 0,
    pathsCompleted: 0,
    votescast: 0,
  })

  useEffect(() => {
    loadMember()
  }, [memberId])

  async function loadMember() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()

    // Load participant
    const { data: participant } = await supabase
      .from('participants')
      .select('*')
      .eq('id', memberId)
      .single()

    if (participant) {
      setMember({
        id: participant.id,
        name: participant.name,
        affiliation: participant.affiliation,
        bio: participant.bio,
        interests: participant.interests || [],
        tier: 'cooperative', // would derive from chain
        joinedAt: participant.created_at,
      })
      setIsSelf(session?.user?.id === participant.auth_user_id)
    }

    // Count contributions
    const { count: contribCount } = await supabase
      .from('contributions')
      .select('id', { count: 'exact', head: true })
      .eq('participant_id', memberId)
    
    setStats(prev => ({ ...prev, contributions: contribCount || 0 }))
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-white/40">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading profile...
      </div>
    )
  }

  if (!member) {
    return <div className="text-center py-16 text-white/40">Member not found</div>
  }

  const tabs: { key: Tab; label: string; icon: typeof Wallet }[] = [
    { key: 'overview', label: 'Overview', icon: User },
    { key: 'contributions', label: 'Contributions', icon: FileText },
    { key: 'royalties', label: 'Royalties', icon: Gem },
    { key: 'governance', label: 'Governance', icon: Vote },
    { key: 'learning', label: 'Learning', icon: GraduationCap },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-5">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-copper-500/30 to-copper-600/10 border border-copper-400/30 flex items-center justify-center">
          <User className="w-7 h-7 text-copper-300" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-white">{member.name}</h1>
            <span className="text-xs bg-copper-400/10 text-copper-300 px-2 py-0.5 rounded-full capitalize">
              {member.tier}
            </span>
            {isSelf && (
              <span className="text-xs bg-green-400/10 text-green-400 px-2 py-0.5 rounded-full">You</span>
            )}
          </div>
          {member.affiliation && (
            <p className="text-sm text-white/50 mt-1">{member.affiliation}</p>
          )}
          {member.bio && (
            <p className="text-sm text-white/60 mt-2 max-w-lg">{member.bio}</p>
          )}
          <div className="flex items-center gap-2 mt-2 text-xs text-white/30">
            <Clock className="w-3 h-3" />
            Member since {new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Contributions', value: stats.contributions, icon: FileText },
          { label: 'Ventures', value: stats.ventures, icon: Gem },
          { label: 'Paths Done', value: stats.pathsCompleted, icon: GraduationCap },
          { label: 'Votes Cast', value: stats.votescast, icon: Vote },
        ].map(s => (
          <div key={s.label} className="bg-white/[0.02] border border-white/10 rounded-lg p-3 text-center">
            <s.icon className="w-4 h-4 text-white/30 mx-auto mb-1" />
            <div className="text-lg font-medium text-white">{s.value}</div>
            <div className="text-[10px] text-white/40">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Interests */}
      {member.interests.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {member.interests.map(interest => (
            <span key={interest} className="text-xs bg-white/5 text-white/40 px-2 py-0.5 rounded-full">
              {interest}
            </span>
          ))}
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-white/10 pb-0.5">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-t transition-colors ${
              tab === t.key
                ? 'bg-white/5 text-copper-300 border-b-2 border-copper-400'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {tab === 'overview' && (
          <div className="space-y-6">
            <MemberCapitalDashboard memberId={member.id} memberName={member.name} />
          </div>
        )}
        {tab === 'contributions' && (
          <MemberContributionHistory participantId={member.id} memberName={member.name} />
        )}
        {tab === 'royalties' && (
          <MemberRoyaltiesDashboard memberId={member.id} memberName={member.name} />
        )}
        {tab === 'governance' && (
          <div className="text-center py-12 text-white/30">
            <Vote className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Governance participation history</p>
            <p className="text-xs text-white/20 mt-1">Voting record will appear here after period close proposals.</p>
          </div>
        )}
        {tab === 'learning' && (
          <div className="text-center py-12 text-white/30">
            <GraduationCap className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Learning progress</p>
            <p className="text-xs text-white/20 mt-1">Completed paths and glossary engagement.</p>
          </div>
        )}
      </div>
    </div>
  )
}
