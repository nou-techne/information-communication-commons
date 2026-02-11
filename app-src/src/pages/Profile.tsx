import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { User, Zap, Check, PenLine } from 'lucide-react'

type ProcessingState = 'idle' | 'loading' | 'submitting' | 'extracting' | 'done' | 'error'

interface ParticipantProfile {
  id: string
  name: string
  affiliation: string | null
  bio: string | null
  background: string | null
  experience: string[]
  skills: string[]
  capabilities: string[]
  interests: string[]
  looking_for: string[]
  offering: string[]
  location: string | null
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://hvbdpgkdcdskhpbdeeim.supabase.co'

function TagList({ items, color = 'bg-[#262626] text-gray-300' }: { items: string[], color?: string }) {
  if (!items || items.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span key={i} className={`text-xs px-2 py-1 rounded-full ${color}`}>{item}</span>
      ))}
    </div>
  )
}

function ProfileSection({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">{label}</div>
      {children}
    </div>
  )
}

function ProfileCard({ profile, extracted, label }: { profile: ParticipantProfile, extracted?: any, label?: string }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold">{profile.name}</h3>
          {profile.affiliation && <p className="text-sm text-gray-400">{profile.affiliation}</p>}
          {profile.location && <p className="text-xs text-gray-500">{profile.location}</p>}
        </div>
        {label && <span className="text-xs text-gray-500">{label}</span>}
      </div>

      {profile.bio && (
        <p className="text-gray-300 text-sm mb-4">{profile.bio}</p>
      )}

      {profile.background && (
        <ProfileSection label="Background">
          <p className="text-sm text-gray-400">{profile.background}</p>
        </ProfileSection>
      )}

      {profile.skills && profile.skills.length > 0 && (
        <ProfileSection label="Skills">
          <TagList items={profile.skills} color="bg-[#262626] text-gray-300" />
        </ProfileSection>
      )}

      {profile.experience && profile.experience.length > 0 && (
        <ProfileSection label="Experience">
          <TagList items={profile.experience} color="bg-[#262626] text-gray-300" />
        </ProfileSection>
      )}

      {profile.capabilities && profile.capabilities.length > 0 && (
        <ProfileSection label="Capabilities">
          <TagList items={profile.capabilities} color="bg-blue-900/30 text-blue-300" />
        </ProfileSection>
      )}

      {profile.offering && profile.offering.length > 0 && (
        <ProfileSection label="Offering">
          <TagList items={profile.offering} color="bg-green-900/30 text-green-300" />
        </ProfileSection>
      )}

      {profile.looking_for && profile.looking_for.length > 0 && (
        <ProfileSection label="Looking for">
          <TagList items={profile.looking_for} color="bg-amber-900/30 text-amber-300" />
        </ProfileSection>
      )}

      {profile.interests && profile.interests.length > 0 && (
        <ProfileSection label="Interests">
          <TagList items={profile.interests} />
        </ProfileSection>
      )}

      {extracted?.hlamt_tags && extracted.hlamt_tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {extracted.hlamt_tags.map((tag: string, i: number) => (
            <span key={i} className="text-xs px-2 py-1 rounded-full bg-[#c3fd50]/10 text-[#c3fd50] font-mono">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function Profile() {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [state, setState] = useState<ProcessingState>('loading')
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<ParticipantProfile | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [extracted, setExtracted] = useState<any>(null)

  // Check auth and load existing profile
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        navigate('/auth')
        return
      }
      
      setUserId(user.id)

      const { data: participant } = await supabase
        .from('participants')
        .select('id, name, affiliation, bio, background, experience, skills, capabilities, interests, looking_for, offering, location')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (participant) {
        setProfile(participant)
      }
      setState('idle')
    }

    loadProfile()
  }, [navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || !userId) return

    setState('submitting')
    setError('')

    try {
      setState('extracting')

      // Call the process-profile Edge Function directly
      const response = await fetch(`${SUPABASE_URL}/functions/v1/process-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          content: text,
          auth_user_id: userId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Profile processing failed')
      }

      setProfile(result.participant)
      setExtracted(result.extracted)
      setState('done')
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
      setState('error')
    }
  }

  if (state === 'loading') {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-full bg-[#262626] flex items-center justify-center mx-auto mb-4 animate-pulse">
          <User className="w-8 h-8 text-gray-500" />
        </div>
        <p className="text-gray-400">Loading profile...</p>
      </div>
    )
  }

  if (state === 'extracting') {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-full bg-[#262626] flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Zap className="w-8 h-8 text-[#c3fd50]" />
        </div>
        <h2 className="text-xl font-bold mb-3">Building your profile...</h2>
        <p className="text-gray-400 max-w-md mx-auto">
          AI is reading your introduction, extracting your name, interests, and dimensional focus.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#c3fd50] animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-[#c3fd50] animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-[#c3fd50] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    )
  }

  if (state === 'done' && profile) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-[#c3fd50] flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-[#0f0f0f]" strokeWidth={3} />
          </div>
          <h2 className="text-xl font-bold mb-3">Profile {extracted?.isUpdate ? 'updated' : 'created'}!</h2>
        </div>

        <ProfileCard profile={profile} extracted={extracted} />

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => { setState('idle'); setText(''); }}
            className="px-6 py-2.5 bg-[#262626] text-white rounded-lg hover:bg-[#333333] transition-colors text-sm"
          >
            Update profile
          </button>
          <button
            onClick={() => navigate('/contribute')}
            className="px-6 py-2.5 bg-[#c3fd50] text-[#0f0f0f] rounded-lg hover:bg-[#d4fe80] transition-colors text-sm"
          >
            Start contributing
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {profile ? (
        <>
          <ProfileCard profile={profile} label="Your current profile" />
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <PenLine className="w-5 h-5 text-[#c3fd50]" />
            Update Your Profile
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            Tell us what's changed. Write naturally — AI will update your profile.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <User className="w-5 h-5 text-[#c3fd50]" />
            Join the Commons
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            Introduce yourself. Write naturally — AI will extract your name, interests, and focus areas to build your profile.
          </p>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={profile
              ? "Share what's new — new projects, interests, or affiliations. AI will update your profile accordingly."
              : "Hi, I'm... Tell us about yourself: your name, what you work on, what you're interested in, what brought you here. Write as much or as little as you want — the AI will figure out the structure."
            }
            rows={8}
            required
            className="w-full bg-[#1a1a1a] border border-[#262626] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#c3fd50] resize-y leading-relaxed text-base"
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-600">
              AI extracts your name, affiliation, bio, interests, and dimensional focus.
            </span>
            <span className="text-xs text-gray-500">{text.length} chars</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-900/20 border border-red-800/30 rounded-lg text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={state === 'submitting' || !text.trim()}
          className="w-full bg-[#c3fd50] text-[#0f0f0f] hover:bg-[#d4fe80] py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {state === 'submitting' ? 'Saving...' : profile ? 'Update Profile' : 'Create Profile'}
        </button>
      </form>
    </div>
  )
}
