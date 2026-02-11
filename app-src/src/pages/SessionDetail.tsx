import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Calendar, MapPin, Users, FileText, GitBranch, PenLine } from 'lucide-react'

interface Session {
  id: string
  title: string
  description: string
  time_start: string | null
  time_end: string | null
  location: string | null
  track: string | null
  speakers: string[] | null
  session_type: string | null
}

interface Artifact {
  id: string
  title: string
  type: string
  rea_role: string
}

interface Contribution {
  id: string
  content: string
  status: string
  created_at: string
  participant_name: string | null
}

interface Participant {
  id: string
  name: string
}

export function SessionDetail() {
  const { id } = useParams<{ id: string }>()
  const [session, setSession] = useState<Session | null>(null)
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) loadSession()
  }, [id])

  async function loadSession() {
    const { data, error } = await supabase.rpc('get_session_detail', { p_session_id: id })
    
    if (error) {
      console.error('Error loading session:', error)
      setLoading(false)
      return
    }

    if (data) {
      setSession(data.session)
      setArtifacts(data.artifacts || [])
      setContributions(data.contributions || [])
      setParticipants(data.participants || [])
    }
    setLoading(false)
  }

  function formatTime(time: string | null) {
    if (!time) return ''
    const d = new Date(time)
    return d.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
    })
  }

  if (loading) {
    return <div className="text-center text-gray-500 py-12">Loading session...</div>
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Session not found</p>
        <Link to="/" className="text-[#c3fd50] hover:underline mt-4 inline-block">
          Return to Explore
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{session.title}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
          {session.time_start && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                {formatTime(session.time_start)}
                {session.time_end && ` - ${formatTime(session.time_end)}`}
              </span>
            </div>
          )}
          {session.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{session.location}</span>
            </div>
          )}
          {session.track && (
            <div className="px-2 py-1 bg-[#262626] rounded text-xs">
              {session.track}
            </div>
          )}
          {session.session_type && (
            <div className="px-2 py-1 bg-[#262626] rounded text-xs capitalize">
              {session.session_type}
            </div>
          )}
        </div>
      </div>

      {session.description && (
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-4 mb-6">
          <p className="text-gray-300 whitespace-pre-wrap">{session.description}</p>
        </div>
      )}

      {session.speakers && session.speakers.length > 0 && (
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-[#c3fd50]" />
            <h2 className="font-medium">Speakers</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {session.speakers.map((speaker, i) => (
              <span key={i} className="px-2 py-1 bg-[#262626] rounded text-sm text-gray-300">
                {speaker}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <Link
          to={`/contribute?session=${id}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#c3fd50] text-[#0f0f0f] rounded-lg hover:bg-[#d4fe80] transition-colors font-medium"
        >
          <PenLine className="w-4 h-4" />
          Contribute to this session
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="w-5 h-5 text-[#c3fd50]" />
            <h2 className="font-bold">Artifacts ({artifacts.length})</h2>
          </div>
          {artifacts.length === 0 ? (
            <p className="text-sm text-gray-500">No artifacts yet</p>
          ) : (
            <div className="space-y-2">
              {artifacts.map(a => (
                <Link
                  key={a.id}
                  to={`/artifact/${a.id}`}
                  className="block bg-[#1a1a1a] border border-[#262626] rounded-lg p-3 hover:border-[#c3fd50] transition-colors"
                >
                  <div className="font-medium text-sm mb-1">{a.title}</div>
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-0.5 bg-[#262626] rounded">{a.type}</span>
                    <span className="px-2 py-0.5 bg-[#262626] rounded">{a.rea_role}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-[#c3fd50]" />
            <h2 className="font-bold">Contributions ({contributions.length})</h2>
          </div>
          {contributions.length === 0 ? (
            <p className="text-sm text-gray-500">No contributions yet</p>
          ) : (
            <div className="space-y-2">
              {contributions.map(c => (
                <Link
                  key={c.id}
                  to={`/contribution/${c.id}`}
                  className="block bg-[#1a1a1a] border border-[#262626] rounded-lg p-3 hover:border-[#c3fd50] transition-colors"
                >
                  <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                    {c.content.substring(0, 150)}...
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    {c.participant_name && <span>{c.participant_name}</span>}
                    <span className={c.status === 'complete' ? 'text-green-500' : 'text-yellow-500'}>
                      {c.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {participants.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-[#c3fd50]" />
            <h2 className="font-bold">Participants ({participants.length})</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {participants.map(p => (
              <Link
                key={p.id}
                to={`/p/${p.id}`}
                className="px-3 py-1.5 bg-[#1a1a1a] border border-[#262626] rounded-lg hover:border-[#c3fd50] transition-colors text-sm"
              >
                {p.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
