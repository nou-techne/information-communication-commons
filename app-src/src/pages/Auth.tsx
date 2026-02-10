import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export function Auth() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: 'https://commons.id/app/',
      },
    })
    setLoading(false)
    if (!error) setSent(true)
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h2 className="text-xl font-bold mb-4">Check your email</h2>
        <p className="text-gray-400">We sent a magic link to <strong>{email}</strong></p>
        <button onClick={() => navigate('/')} className="mt-4 text-[#5b9de4] hover:text-white">
          Back to Garden
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <h2 className="text-xl font-bold mb-6 text-center">Sign in to Commons</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="w-full bg-[#111d33] border border-[#1a2a44] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#5b9de4]"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#3d7cc9] hover:bg-[#5b9de4] text-white py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Magic Link'}
        </button>
      </form>
    </div>
  )
}
