import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { Garden } from './pages/Garden'
import { ArtifactDetail } from './pages/ArtifactDetail'
import { MyThread } from './pages/MyThread'
import { Contribute } from './pages/Contribute'
import { Pulse } from './pages/Pulse'
import { Auth } from './pages/Auth'
import type { Session } from '@supabase/supabase-js'

function Nav() {
  const location = useLocation()
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  const links = [
    { to: '/', label: 'Garden', icon: '' },
    { to: '/pulse', label: 'Pulse', icon: '' },
    { to: '/contribute', label: 'Contribute', icon: '' },
    { to: '/me', label: 'My Thread', icon: '' },
  ]

  return (
    <nav className="bg-[#0a1628] border-b border-[#1a2a44] px-4 py-3 flex items-center justify-between">
      <Link to="/" className="text-xl font-bold text-white tracking-tight">
        <span className="text-[#5b9de4]">.id</span> Commons
      </Link>
      <div className="flex gap-1">
        {links.map(l => (
          <Link
            key={l.to}
            to={l.to}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              location.pathname === l.to
                ? 'bg-[#1a2a44] text-white'
                : 'text-gray-400 hover:text-white hover:bg-[#111d33]'
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div className="text-sm">
        {session ? (
          <button onClick={() => supabase.auth.signOut()} className="text-gray-400 hover:text-white">
            Sign out
          </button>
        ) : (
          <Link to="/auth" className="text-[#5b9de4] hover:text-white">Sign in</Link>
        )}
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/app">
      <div className="min-h-screen bg-[#0a1628] text-white">
        <Nav />
        <main className="max-w-6xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Garden />} />
            <Route path="/artifact/:id" element={<ArtifactDetail />} />
            <Route path="/me" element={<MyThread />} />
            <Route path="/contribute" element={<Contribute />} />
            <Route path="/pulse" element={<Pulse />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
