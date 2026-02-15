import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Hash, Plus, X, Lock } from 'lucide-react'
import { useConvergence } from '../contexts/ConvergenceContext'
import type { Session } from '@supabase/supabase-js'

interface Channel {
  id: string
  convergence_id: string | null
  name: string
  slug: string
  description: string | null
  type: 'general' | 'dimension' | 'session' | 'topic' | 'meta'
  visibility: string
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
  const [newVisibility, setNewVisibility] = useState<'public' | 'members'>('public')
  const [creating, setCreating] = useState(false)
  const [unreadChannels, setUnreadChannels] = useState<Set<string>>(new Set())

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
    
    // Check unread status per channel
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
      visibility: newVisibility,
      convergence_id: convergence.id,
      created_by: session.user.id,
    })
    if (!error) {
      setNewName('')
      setNewDesc('')
      setNewType('general')
      setShowCreate(false)
      await loadChannels()
    }
    setCreating(false)
  }

  const grouped = TYPE_ORDER.map(type => ({
    type,
    label: TYPE_LABELS[type],
    channels: channels.filter(c => c.type === type),
  })).filter(g => g.channels.length > 0)

  if (loading) return <div className="text-center text-gray-500 py-12">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Channels</h1>
          <p className="text-gray-400 text-sm">Discussion spaces organized by topic and purpose.</p>
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

      {/* Channel list grouped by type */}
      {grouped.length === 0 ? (
        <div className="text-center py-16">
          <Hash className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No channels yet</h3>
          <p className="text-gray-400 text-sm">Create the first channel to start discussions.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(group => (
            <div key={group.type}>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{group.label}</h2>
              <div className="space-y-1">
                {group.channels.map(ch => (
                  <Link
                    key={ch.id}
                    to={`/channels/${ch.slug}`}
                    className="flex items-center gap-3 bg-[#0a101d] border border-[#1d2839] rounded-lg px-4 py-4 hover:border-[#a6ed2a] transition-colors group"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#1d2839] flex items-center justify-center text-gray-400 group-hover:text-[#a6ed2a] group-hover:bg-[#1d2839]/80 transition-colors">
                      {ch.visibility === 'members' || ch.visibility === 'admin' ? <Lock className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-base group-hover:text-[#a6ed2a] transition-colors">{ch.name}</span>
                        {unreadChannels.has(ch.slug) && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      {ch.description ? (
                        <p className="text-sm text-gray-400 truncate mt-0.5">{ch.description}</p>
                      ) : (
                        <p className="text-sm text-gray-600 mt-0.5">No description</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-500">{timeAgo(ch.updated_at)}</span>
                      <svg className="w-4 h-4 text-gray-600 group-hover:text-[#a6ed2a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
