import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'
import { Mail } from 'lucide-react'

const FEATURES = [
  { letter: 'e/', name: 'Ecology', color: '#4a8c6f', text: 'Ground ideas in place and ecology' },
  { letter: 'H/', name: 'Human', color: '#c4956a', text: 'Connect with people who share your questions' },
  { letter: 'A/', name: 'Artifacts', color: '#8bbfff', text: 'Build artifacts that outlast the event' },
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
        <div className="w-20 h-20 rounded-full bg-[#a6ed2a] flex items-center justify-center mx-auto mb-6">
          <Mail className="w-10 h-10 text-[#080c16]" />
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
            className="px-6 py-2.5 bg-[#1d2839] text-white rounded-lg hover:bg-[#283347] transition-colors text-sm"
          >
            Try a different email
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-[#a6ed2a] text-[#080c16] rounded-lg hover:bg-[#b8f247] transition-colors text-sm"
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
          Join the <span className="text-[#a6ed2a]">Commons</span>
        </h1>
        <p className="text-gray-400 max-w-sm mx-auto leading-relaxed">
          A living archive of what emerges when people converge. 
          Your observations become part of the knowledge graph.
        </p>
      </div>

      {/* What you can do */}
      <div className="mb-10 space-y-3">
        {FEATURES.map(f => (
          <div key={f.letter} className="flex items-start gap-3 bg-[#0a101d] border border-[#1d2839] rounded-lg p-3">
            <div className="flex-shrink-0 mt-0.5 min-w-[90px]">
              <span className="font-mono text-lg font-bold" style={{ color: f.color }}>{f.letter}</span>
              <span className="text-xs font-medium text-gray-400">{f.name}</span>
            </div>
            <span className="text-sm text-gray-300">{f.text}</span>
          </div>
        ))}
      </div>

      {/* Sign in form */}
      <div className="bg-[#0a101d] border border-[#1d2839] rounded-xl p-6">
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
              className="w-full bg-[#080c16] border border-[#283347] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#a6ed2a] transition-colors"
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
            className="w-full bg-[#a6ed2a] text-[#080c16] font-medium hover:bg-[#b8f247] py-3 rounded-lg transition-colors disabled:opacity-50"
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
