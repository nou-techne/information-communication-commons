// Sprint 77: Agent API Keys Management
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Key, Plus, Trash2, Copy, Check, AlertCircle } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'

interface ApiKey {
  id: string
  key_prefix: string
  name: string | null
  scopes: string[]
  rate_limit_per_hour: number
  last_used_at: string | null
  created_at: string
  expires_at: string | null
  revoked_at: string | null
}

function timeAgo(date: string | null) {
  if (!date) return 'Never'
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(1000)
  const [creating, setCreating] = useState(false)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) loadKeys()
  }, [session])

  async function loadKeys() {
    const { data } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false })
    setKeys((data as ApiKey[]) || [])
    setLoading(false)
  }

  async function createKey() {
    if (!session || !newKeyName.trim()) return
    setCreating(true)

    // Get current participant ID
    const { data: participant } = await supabase
      .from('participants')
      .select('id')
      .eq('auth_id', session.user.id)
      .single()

    if (!participant) {
      alert('Participant profile not found')
      setCreating(false)
      return
    }

    const { data, error } = await supabase.rpc('create_api_key', {
      p_participant_id: participant.id,
      p_name: newKeyName.trim(),
      p_rate_limit: newKeyRateLimit,
      p_environment: 'live'
    })

    if (error) {
      alert(`Error: ${error.message}`)
    } else if (data && data.length > 0) {
      setNewlyCreatedKey(data[0].api_key)
      setNewKeyName('')
      await loadKeys()
    }
    setCreating(false)
  }

  async function revokeKey(keyPrefix: string) {
    if (!confirm(`Revoke API key ${keyPrefix}? This cannot be undone.`)) return
    
    const { error } = await supabase.rpc('revoke_api_key', {
      p_key_prefix: keyPrefix
    })

    if (!error) {
      await loadKeys()
    } else {
      alert(`Error: ${error.message}`)
    }
  }

  function copyKey() {
    if (newlyCreatedKey) {
      navigator.clipboard.writeText(newlyCreatedKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function closeKeyModal() {
    setNewlyCreatedKey(null)
    setShowCreate(false)
  }

  if (loading) return <div className="text-center text-gray-500 py-12">Loading...</div>

  if (!session) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Authentication Required</h3>
        <p className="text-gray-400 text-sm">Sign in to manage API keys</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">API Keys</h1>
          <p className="text-sm text-gray-400">Manage API keys for programmatic access</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-[#a6ed2a] text-[#080c16] px-4 py-2 rounded-lg font-medium hover:bg-[#b8f247] transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          New Key
        </button>
      </div>

      {/* Newly created key modal */}
      {newlyCreatedKey && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-6 max-w-lg w-full">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Save Your API Key</h2>
                <p className="text-sm text-gray-400">Copy this key now. You won't be able to see it again!</p>
              </div>
            </div>
            <div className="bg-[#080c16] border border-[#1d2839] rounded-lg p-3 mb-4">
              <code className="text-[#a6ed2a] text-sm break-all">{newlyCreatedKey}</code>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyKey}
                className="flex-1 flex items-center justify-center gap-2 bg-[#1d2839] text-white px-4 py-2 rounded-lg hover:bg-[#2a3a4f] transition-colors text-sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Key'}
              </button>
              <button
                onClick={closeKeyModal}
                className="flex-1 bg-[#a6ed2a] text-[#080c16] px-4 py-2 rounded-lg font-medium hover:bg-[#b8f247] transition-colors text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create key modal */}
      {showCreate && !newlyCreatedKey && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-bold text-white mb-4">Create API Key</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  placeholder="My Agent Key"
                  className="w-full bg-[#080c16] border border-[#1d2839] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#a6ed2a] text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Rate Limit (requests/hour)</label>
                <input
                  type="number"
                  value={newKeyRateLimit}
                  onChange={e => setNewKeyRateLimit(parseInt(e.target.value) || 1000)}
                  min="100"
                  max="10000"
                  className="w-full bg-[#080c16] border border-[#1d2839] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#a6ed2a] text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Default: 1000 req/hr</p>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 bg-[#1d2839] text-white px-4 py-2 rounded-lg hover:bg-[#2a3a4f] transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={createKey}
                disabled={!newKeyName.trim() || creating}
                className="flex-1 bg-[#a6ed2a] text-[#080c16] px-4 py-2 rounded-lg font-medium hover:bg-[#b8f247] transition-colors text-sm disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keys list */}
      {keys.length === 0 ? (
        <div className="text-center py-16">
          <Key className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No API keys yet</h3>
          <p className="text-gray-400 text-sm">Create your first API key to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map(key => (
            <div
              key={key.id}
              className={`bg-[#0a101d] border rounded-lg p-4 ${
                key.revoked_at ? 'border-red-900/50 opacity-60' : 'border-[#1d2839]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Key className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="font-semibold text-white">{key.name || 'Unnamed Key'}</span>
                    {key.revoked_at && (
                      <span className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded">Revoked</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <code className="text-[#a6ed2a]">{key.key_prefix}...</code>
                    <span>{key.rate_limit_per_hour} req/hr</span>
                    <span>Last used: {timeAgo(key.last_used_at)}</span>
                  </div>
                </div>
                {!key.revoked_at && (
                  <button
                    onClick={() => revokeKey(key.key_prefix)}
                    className="text-gray-400 hover:text-red-400 transition-colors ml-4"
                    title="Revoke key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
