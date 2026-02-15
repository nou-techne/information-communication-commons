import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Hash, Plus, X, Lock, Users, Bot, Cpu } from 'lucide-react'
import { useConvergence } from '../contexts/ConvergenceContext'
import type { Session } from '@supabase/supabase-js'

type CommunicationMode = 'human-to-human' | 'human-to-agent' | 'agent-to-agent'

interface Channel {
  id: string
  convergence_id: string | null
  name: string
  slug: string
  description: string | null
  type: 'general' | 'dimension' | 'session' | 'topic' | 'meta'
  visibility: string
  communication_mode: CommunicationMode
  created_by: string | null
  position: number
  created_at: string
  updated_at: string
}

const TYPE_ORDER: Channel['type'][] = ['general', 'dimension', 'session', 'topic', 'meta']
const TYPE_LABELS: Record<Channel['type'], string> = {
  general: 'General',
  dimension: 'Dimensions',
  session: 'Sessions',
  topic: 'Topics',
  meta: 'Meta',
}

const MODE_ORDER: CommunicationMode[] = ['human-to-human', 'human-to-agent', 'agent-to-agent']
const MODE_CONFIG: Record<CommunicationMode, {
  label: string
  description: string
  color: string
  bgColor: string
  borderColor: string
  iconBg: string
  icon: 'users' | 'bot' | 'cpu'
}> = {
  'human-to-human': {
    label: 'Human \u2194 Human',
    description: 'People connecting with people — discussion, debate, and shared understanding.',
    color: '#a6ed2a',
    bgColor: 'rgba(166, 237, 42, 0.06)',
    borderColor: 'rgba(166, 237, 42, 0.2)',
    iconBg: 'rgba(166, 237, 42, 0.15)',
    icon: 'users',
  },
  'human-to-agent': {
    label: 'Human \u2194 Agent',
    description: 'Humans directing agents, asking questions, and receiving synthesized knowledge.',
    color: '#60a5fa',
    bgColor: 'rgba(96, 165, 250, 0.06)',
    borderColor: 'rgba(96, 165, 250, 0.2)',
    iconBg: 'rgba(96, 165, 250, 0.15)',
    icon: 'bot',
  },
  'agent-to-agent': {
    label: 'Agent \u2194 Agent',
    description: 'Autonomous coordination between agents — extraction, synthesis, and graph maintenance.',
    color: '#a78bfa',
    bgColor: 'rgba(167, 139, 250, 0.06)',
    borderColor: 'rgba(167, 139, 250, 0.2)',
    iconBg: 'rgba(167, 139, 250, 0.15)',
    icon: 'cpu',
  },
}

function ModeIcon({ mode, className }: { mode: CommunicationMode; className?: string }) {
  const config = MODE_CONFIG[mode]
  if (config.icon === 'users') return <Users className={className} />
  if (config.icon === 'bot') return <Bot className={className} />
  return <Cpu className={className} />
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function Channels() {
  const { convergence } = useConvergence()
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newType, setNewType] = useState<Channel['type']>('general')
  const [newMode, setNewMode] = useState<CommunicationMode>('human-to-human')
  const [newVisibility, setNewVisibility] = useState<'public' | 'members'>('public')
  const [creating, setCreating] = useState(false)
  const [unreadChannels, setUnreadChannels] = useState<Set<string>>(new Set())
  const [modeFilter, setModeFilter] = useState<'all' | CommunicationMode>('all')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    loadChannels()
  }, [])

  async function loadChannels() {
    const { data } = await supabase
      .from('channels')
      .select('*')
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })
    const loadedChannels = (data as Channel[]) || []
    setChannels(loadedChannels)
    
    const lastRead: Record<string, string> = JSON.parse(localStorage.getItem('channel_last_read') || '{}')
    const unread = new Set<string>()
    for (const ch of loadedChannels) {
      const lr = lastRead[ch.slug]
      if (lr && new Date(ch.updated_at) > new Date(lr)) {
        unread.add(ch.slug)
      } else if (!lr) {
        unread.add(ch.slug)
      }
    }
    setUnreadChannels(unread)
    setLoading(false)
  }

  async function createChannel() {
    if (!newName.trim() || !session) return
    setCreating(true)
    const slug = newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const { error } = await supabase.from('channels').insert({
      name: newName.trim(),
      slug,
      description: newDesc.trim() || null,
      type: newType,
      communication_mode: newMode,
      visibility: newVisibility,
      convergence_id: convergence.id,
      created_by: session.user.id,
    })
    if (!error) {
      setNewName('')
      setNewDesc('')
      setNewType('general')
      setNewMode('human-to-human')
      setShowCreate(false)
      await loadChannels()
    }
    setCreating(false)
  }

  // Filter channels by mode
  const filteredChannels = modeFilter === 'all'
    ? channels
    : channels.filter(c => c.communication_mode === modeFilter)

  // Group by communication mode, then by type within each mode
  const groupedByMode = MODE_ORDER.map(mode => {
    const modeChannels = filteredChannels.filter(c => c.communication_mode === mode)
    const typeGroups = TYPE_ORDER.map(type => ({
      type,
      label: TYPE_LABELS[type],
      channels: modeChannels.filter(c => c.type === type),
    })).filter(g => g.channels.length > 0)
    return { mode, config: MODE_CONFIG[mode], typeGroups, count: modeChannels.length }
  }).filter(g => g.count > 0)

  // Mode counts for filter badges
  const modeCounts = {
    all: channels.length,
    'human-to-human': channels.filter(c => c.communication_mode === 'human-to-human').length,
    'human-to-agent': channels.filter(c => c.communication_mode === 'human-to-agent').length,
    'agent-to-agent': channels.filter(c => c.communication_mode === 'agent-to-agent').length,
  }

  if (loading) return <div className="text-center text-gray-500 py-12">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Channels</h1>
          <p className="text-gray-400 text-sm">Three modes of communication in the commons.</p>
        </div>
        {session && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-[#a6ed2a] text-[#080c16] font-medium px-4 py-2 rounded-lg hover:bg-[#b8f247] transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            New Channel
          </button>
        )}
      </div>

      {/* Communication Mode Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {MODE_ORDER.map(mode => {
          const config = MODE_CONFIG[mode]
          const count = modeCounts[mode]
          const isActive = modeFilter === mode
          return (
            <button
              key={mode}
              onClick={() => setModeFilter(modeFilter === mode ? 'all' : mode)}
              className="text-left rounded-xl p-4 border transition-all"
              style={{
                backgroundColor: isActive ? config.bgColor : 'transparent',
                borderColor: isActive ? config.color : '#1d2839',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: config.iconBg }}
                >
                  <ModeIcon mode={mode} className="w-4 h-4" style={{ color: config.color } as React.CSSProperties} />
                </div>
                <span className="font-semibold text-sm" style={{ color: config.color }}>{config.label}</span>
                <span className="text-xs text-gray-500 ml-auto">{count}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{config.description}</p>
            </button>
          )
        })}
      </div>

      {/* Active filter indicator */}
      {modeFilter !== 'all' && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-500">Showing:</span>
          <span
            className="text-xs font-medium px-2 py-1 rounded-full"
            style={{
              backgroundColor: MODE_CONFIG[modeFilter].bgColor,
              color: MODE_CONFIG[modeFilter].color,
              border: `1px solid ${MODE_CONFIG[modeFilter].borderColor}`,
            }}
          >
            {MODE_CONFIG[modeFilter].label}
          </span>
          <button
            onClick={() => setModeFilter('all')}
            className="text-xs text-gray-500 hover:text-white ml-1"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-[#0a101d] border border-[#1d2839] rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">New Channel</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="channel-name"
                  className="w-full bg-[#080c16] border border-[#1d2839] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#a6ed2a] text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="What's this channel about?"
                  rows={2}
                  className="w-full bg-[#080c16] border border-[#1d2839] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#a6ed2a] text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Communication Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {MODE_ORDER.map(mode => {
                    const config = MODE_CONFIG[mode]
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setNewMode(mode)}
                        className="p-2 rounded-lg border text-center transition-all"
                        style={{
                          backgroundColor: newMode === mode ? config.bgColor : 'transparent',
                          borderColor: newMode === mode ? config.color : '#1d2839',
                        }}
                      >
                        <ModeIcon mode={mode} className="w-4 h-4 mx-auto mb-1" style={{ color: config.color } as React.CSSProperties} />
                        <span className="text-xs" style={{ color: newMode === mode ? config.color : '#9ca3af' }}>
                          {mode === 'human-to-human' ? 'H\u2194H' : mode === 'human-to-agent' ? 'H\u2194A' : 'A\u2194A'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as Channel['type'])}
                  className="w-full bg-[#080c16] border border-[#1d2839] rounded-lg px-3 py-2 text-white text-sm"
                >
                  {TYPE_ORDER.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Visibility</label>
                <select
                  value={newVisibility}
                  onChange={e => setNewVisibility(e.target.value as 'public' | 'members')}
                  className="w-full bg-[#080c16] border border-[#1d2839] rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="public">Public — Anyone can view</option>
                  <option value="members">Members — Authenticated users only</option>
                </select>
              </div>
              <button
                onClick={createChannel}
                disabled={!newName.trim() || creating}
                className="w-full bg-[#a6ed2a] text-[#080c16] font-medium py-2 rounded-lg hover:bg-[#b8f247] transition-colors text-sm disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Channel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Channel list grouped by communication mode */}
      {groupedByMode.length === 0 ? (
        <div className="text-center py-16">
          <Hash className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No channels yet</h3>
          <p className="text-gray-400 text-sm">Create the first channel to start discussions.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedByMode.map(({ mode, config, typeGroups }) => (
            <div key={mode}>
              {/* Mode section header */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: config.iconBg }}
                >
                  <ModeIcon mode={mode} className="w-4 h-4" style={{ color: config.color } as React.CSSProperties} />
                </div>
                <div>
                  <h2 className="text-sm font-bold" style={{ color: config.color }}>{config.label}</h2>
                </div>
                <div className="flex-1 h-px" style={{ backgroundColor: config.borderColor }} />
              </div>

              {/* Type groups within this mode */}
              <div className="space-y-4 ml-2">
                {typeGroups.map(group => (
                  <div key={group.type}>
                    {typeGroups.length > 1 && (
                      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 ml-1">{group.label}</h3>
                    )}
                    <div className="space-y-1">
                      {group.channels.map(ch => (
                        <Link
                          key={ch.id}
                          to={`/channels/${ch.slug}`}
                          className="flex items-center gap-3 rounded-lg px-4 py-3 border transition-all group"
                          style={{
                            backgroundColor: config.bgColor,
                            borderColor: '#1d2839',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = config.color }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1d2839' }}
                        >
                          <div
                            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                            style={{ backgroundColor: config.iconBg }}
                          >
                            {ch.visibility === 'members' ? (
                              <Lock className="w-4 h-4" style={{ color: config.color }} />
                            ) : (
                              <Hash className="w-4 h-4" style={{ color: config.color }} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white text-sm group-hover:opacity-90 transition-colors">{ch.name}</span>
                              {unreadChannels.has(ch.slug) && (
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: config.color }} />
                              )}
                            </div>
                            {ch.description ? (
                              <p className="text-xs text-gray-500 truncate mt-0.5">{ch.description}</p>
                            ) : (
                              <p className="text-xs text-gray-700 mt-0.5">No description</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-gray-600">{timeAgo(ch.updated_at)}</span>
                            <svg className="w-4 h-4 text-gray-700 group-hover:opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
