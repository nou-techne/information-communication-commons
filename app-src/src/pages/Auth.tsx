import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'
import { Mail } from 'lucide-react'

const FEATURES = [
  { letter: 'e/', color: '#4a8c6f', text: 'Ground ideas in place and ecology' },
  { letter: 'H/', color: '#c4956a', text: 'Connect with people who share your questions' },
  { letter: 'A/', color: '#8bbfff', text: 'Build artifacts that outlast the event' },
]

export function Auth() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: 'https://commons.id/app/',
      },
    })
    setLoading(false)
    if (authError) {
      setError(authError.message)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-20 h-20 rounded-full bg-[#c3fd50] flex items-center justify-center mx-auto mb-6">
          <Mail className="w-10 h-10 text-[#0f0f0f]" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Check your inbox</h2>
        <p className="text-gray-400 mb-2">
          We sent a magic link to <span className="text-white font-medium">{email}</span>
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Click the link in the email to sign in. It expires in 1 hour.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => { setSent(false); setEmail(''); }}
            className="px-6 py-2.5 bg-[#262626] text-white rounded-lg hover:bg-[#333333] transition-colors text-sm"
          >
            Try a different email
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-[#c3fd50] text-[#0f0f0f] rounded-lg hover:bg-[#d4fe80] transition-colors text-sm"
          >
            Explore while you wait
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto py-8 sm:py-16">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-3">
          Join the <span className="text-[#c3fd50]">Commons</span>
        </h1>
        <p className="text-gray-400 max-w-sm mx-auto leading-relaxed">
          A living archive of what emerges when people converge. 
          Your observations become part of the knowledge graph.
        </p>
      </div>

      {/* What you can do */}
      <div className="mb-10 space-y-3">
        {FEATURES.map(f => (
          <div key={f.letter} className="flex items-start gap-3 bg-[#1a1a1a] border border-[#262626] rounded-lg p-3">
            <span className="font-mono text-lg font-bold flex-shrink-0 mt-0.5" style={{ color: f.color }}>{f.letter}</span>
            <span className="text-sm text-gray-300">{f.text}</span>
          </div>
        ))}
      </div>

      {/* Sign in form */}
      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-1">Sign in with email</h2>
        <p className="text-sm text-gray-500 mb-5">No password needed. We'll send you a magic link.</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
              className="w-full bg-[#0f0f0f] border border-[#333333] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#c3fd50] transition-colors"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800/30 rounded-lg text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full bg-[#c3fd50] text-[#0f0f0f] font-medium hover:bg-[#d4fe80] py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending magic link...' : 'Continue with magic link'}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="text-center mt-8">
        <p className="text-sm text-gray-600">
          Don't want to sign in?{' '}
          <Link to="/" className="text-gray-400 hover:text-white transition-colors">
            Explore as a guest
          </Link>
        </p>
        <p className="text-xs text-gray-700 mt-3">
          ETHBoulder 2026 · commons.id
        </p>
      </div>
    </div>
  )
}
