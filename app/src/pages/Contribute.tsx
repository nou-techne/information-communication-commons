import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { ArtifactType } from '../lib/supabase'

const TYPES: ArtifactType[] = ['idea', 'proposal', 'commitment', 'pattern', 'synthesis', 'question', 'reflection']

type FormTab = 'artifact' | 'reflection' | 'connection' | 'commitment'

export function Contribute() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<FormTab>('artifact')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [artifacts, setArtifacts] = useState<{ id: string; title: string }[]>([])

  // Artifact form
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [type, setType] = useState<ArtifactType>('idea')
  const [tagsInput, setTagsInput] = useState('')

  // Reflection form
  const [refArtifactId, setRefArtifactId] = useState('')
  const [refBody, setRefBody] = useState('')

  // Connection form
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [relType, setRelType] = useState('related_to')

  // Commitment form
  const [commitDesc, setCommitDesc] = useState('')
  const [commitArtifactId, setCommitArtifactId] = useState('')
  const [commitDue, setCommitDue] = useState('')

  useEffect(() => {
    supabase.from('artifacts').select('id, title').order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => setArtifacts(data || []))
  }, [])

  async function submitArtifact(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.from('artifacts').insert({
      title, summary, type, state: 'seed',
    }).select().single()

    if (error) { setMsg(`Error: ${error.message}`); setLoading(false); return }

    // Add tags
    if (tagsInput.trim()) {
      const tagNames = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
      for (const name of tagNames) {
        const { data: tag } = await supabase.from('tags').upsert({ name, category: 'theme' }, { onConflict: 'name' }).select().single()
        if (tag) await supabase.from('artifact_tags').insert({ artifact_id: data.id, tag_id: tag.id })
      }
    }

    setLoading(false)
    navigate(`/artifact/${data.id}`)
  }

  async function submitReflection(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.from('artifacts').insert({
      title: `Reflection on ${artifacts.find(a => a.id === refArtifactId)?.title || 'artifact'}`,
      body: refBody, type: 'reflection', state: 'seed',
    }).select().single()

    if (!error && data) {
      await supabase.from('artifact_relationships').insert({
        from_artifact_id: data.id, to_artifact_id: refArtifactId, type: 'builds_on',
      })
      navigate(`/artifact/${data.id}`)
    } else {
      setMsg(`Error: ${error?.message}`)
    }
    setLoading(false)
  }

  async function submitConnection(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('artifact_relationships').insert({
      from_artifact_id: fromId, to_artifact_id: toId, type: relType,
    })
    setMsg(error ? `Error: ${error.message}` : 'Connection created!')
    setLoading(false)
  }

  async function submitCommitment(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    // Get current user's participant ID
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setMsg('Please sign in first'); setLoading(false); return }

    const { data: participant } = await supabase.from('participants').select('id').eq('auth_user_id', session.user.id).single()
    if (!participant) { setMsg('No participant profile found'); setLoading(false); return }

    const { error } = await supabase.from('commitments').insert({
      description: commitDesc,
      participant_id: participant.id,
      artifact_id: commitArtifactId || null,
      due_date: commitDue || null,
      status: 'made',
    })
    setMsg(error ? `Error: ${error.message}` : 'Commitment recorded!')
    setLoading(false)
  }

  const tabs: { key: FormTab; label: string }[] = [
    { key: 'artifact', label: '✍️ New Artifact' },
    { key: 'reflection', label: '💭 Reflection' },
    { key: 'connection', label: '🔗 Connection' },
    { key: 'commitment', label: '🤝 Commitment' },
  ]

  const selectClass = "w-full bg-[#111d33] border border-[#1a2a44] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#5b9de4]"
  const inputClass = selectClass
  const btnClass = "w-full bg-[#3d7cc9] hover:bg-[#5b9de4] text-white py-3 rounded-lg transition-colors disabled:opacity-50"

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">✍️ Contribute</h1>

      <div className="flex gap-1 mb-6 bg-[#111d33] rounded-lg p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setMsg('') }}
            className={`flex-1 py-2 text-sm rounded-md transition-colors ${tab === t.key ? 'bg-[#1a2a44] text-white' : 'text-gray-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {msg && <div className="mb-4 p-3 bg-[#1a2a44] rounded-lg text-sm">{msg}</div>}

      {tab === 'artifact' && (
        <form onSubmit={submitArtifact} className="space-y-4">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" required className={inputClass} />
          <textarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="Summary" rows={4} className={inputClass} />
          <select value={type} onChange={e => setType(e.target.value as ArtifactType)} className={selectClass}>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="Tags (comma-separated)" className={inputClass} />
          <button type="submit" disabled={loading} className={btnClass}>{loading ? 'Creating...' : 'Create Artifact'}</button>
        </form>
      )}

      {tab === 'reflection' && (
        <form onSubmit={submitReflection} className="space-y-4">
          <select value={refArtifactId} onChange={e => setRefArtifactId(e.target.value)} required className={selectClass}>
            <option value="">Select artifact to reflect on...</option>
            {artifacts.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
          <textarea value={refBody} onChange={e => setRefBody(e.target.value)} placeholder="Your reflection..." rows={6} required className={inputClass} />
          <button type="submit" disabled={loading} className={btnClass}>{loading ? 'Submitting...' : 'Submit Reflection'}</button>
        </form>
      )}

      {tab === 'connection' && (
        <form onSubmit={submitConnection} className="space-y-4">
          <select value={fromId} onChange={e => setFromId(e.target.value)} required className={selectClass}>
            <option value="">From artifact...</option>
            {artifacts.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
          <select value={relType} onChange={e => setRelType(e.target.value)} className={selectClass}>
            {['builds_on', 'extends', 'contradicts', 'supersedes', 'related_to'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={toId} onChange={e => setToId(e.target.value)} required className={selectClass}>
            <option value="">To artifact...</option>
            {artifacts.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
          <button type="submit" disabled={loading} className={btnClass}>{loading ? 'Linking...' : 'Create Connection'}</button>
        </form>
      )}

      {tab === 'commitment' && (
        <form onSubmit={submitCommitment} className="space-y-4">
          <textarea value={commitDesc} onChange={e => setCommitDesc(e.target.value)} placeholder="What are you committing to?" rows={3} required className={inputClass} />
          <select value={commitArtifactId} onChange={e => setCommitArtifactId(e.target.value)} className={selectClass}>
            <option value="">Related artifact (optional)</option>
            {artifacts.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
          <input type="date" value={commitDue} onChange={e => setCommitDue(e.target.value)} className={inputClass} />
          <button type="submit" disabled={loading} className={btnClass}>{loading ? 'Recording...' : 'Record Commitment'}</button>
        </form>
      )}
    </div>
  )
}
