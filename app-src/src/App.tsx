import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { Menu, X } from 'lucide-react'
import { Explore } from './pages/Explore'
import { ArtifactDetail } from './pages/ArtifactDetail'
import { MyThread } from './pages/MyThread'
import { Contribute } from './pages/Contribute'
import { Auth } from './pages/Auth'
import { Dimensions } from './pages/Dimensions'
import { DimensionView } from './pages/DimensionView'
import { NotFound } from './pages/NotFound'
import type { Session } from '@supabase/supabase-js'

function Nav() {
  const location = useLocation()
  const [session, setSession] = useState<Session | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  const links = [
    { to: '/', label: 'Explore' },
    { to: '/contribute', label: 'Contribute' },
    { to: '/me', label: 'My Thread' },
  ]

  return (
    <nav className="bg-[#0f0f0f] border-b border-[#262626] px-4 py-3">
      <div className="max-w-6xl mx-auto">
        {/* Desktop nav */}
        <div className="hidden md:flex items-center justify-between relative">
          <Link to="/" className="text-xl font-bold tracking-tight">
            <span className="text-[#c3fd50]">EthBoulder</span><span className="text-gray-500">.commons.id</span>
          </Link>
          <div className="absolute left-1/2 -translate-x-1/2 flex gap-1">
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
        </div>

        {/* Mobile nav */}
        <div className="md:hidden">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-lg font-bold tracking-tight">
              <span className="text-[#c3fd50]">EthBoulder</span><span className="text-gray-500">.commons.id</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-400 hover:text-white p-2"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
          
          {mobileMenuOpen && (
            <div className="mt-3 pt-3 border-t border-[#262626] space-y-1">
              {links.map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    location.pathname === l.to
                      ? 'bg-[#262626] text-white'
                      : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-[#262626]">
                {session ? (
                  <button
                    onClick={() => { supabase.auth.signOut(); setMobileMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white"
                  >
                    Sign out
                  </button>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-[#c3fd50] hover:text-white"
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
