import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { Explore } from './pages/Explore'
import { ArtifactDetail } from './pages/ArtifactDetail'
import { MyThread } from './pages/MyThread'
import { Contribute } from './pages/Contribute'
import { Auth } from './pages/Auth'
import { Dimensions } from './pages/Dimensions'
import { DimensionView } from './pages/DimensionView'
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
    { to: '/', label: 'Explore' },
    { to: '/dimensions', label: 'Dimensions' },
    { to: '/contribute', label: 'Contribute' },
    { to: '/me', label: 'My Thread' },
  ]

  return (
    <nav className="bg-[#0f0f0f] border-b border-[#262626] px-4 py-3 flex items-center justify-between">
      <Link to="/" className="text-xl font-bold text-white tracking-tight">
        <span className="text-[#c3fd50]">.id</span> Commons
        <span className="text-[#c3fd50] text-xs font-normal ml-2">· ETHBoulder 2026</span>
      </Link>
      <div className="flex gap-1">
        {links.map(l => (
          <Link
            key={l.to}
            to={l.to}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              (location.pathname === l.to || (l.to === '/dimensions' && location.pathname.startsWith('/d/')))
                ? 'bg-[#262626] text-white'
                : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
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
          <Link to="/auth" className="text-[#c3fd50] hover:text-white">Sign in</Link>
        )}
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/app">
      <div className="min-h-screen bg-[#0f0f0f] text-white">
        <Nav />
        <main className="max-w-6xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Explore />} />
            <Route path="/dimensions" element={<Dimensions />} />
            <Route path="/d/:dimension" element={<DimensionView />} />
            <Route path="/artifact/:id" element={<ArtifactDetail />} />
            <Route path="/me" element={<MyThread />} />
            <Route path="/contribute" element={<Contribute />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
