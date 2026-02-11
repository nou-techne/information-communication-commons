import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'
import { supabase } from './lib/supabase'
import { Menu, X, Search as SearchIcon } from 'lucide-react'
import { ConvergenceProvider, useConvergence } from './contexts/ConvergenceContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Explore } from './pages/Explore'
import { ArtifactDetail } from './pages/ArtifactDetail'
import { MyThread } from './pages/MyThread'
import { Contribute } from './pages/Contribute'
import { Auth } from './pages/Auth'
import { Dimensions } from './pages/Dimensions'
import { DimensionView } from './pages/DimensionView'
import { NotFound } from './pages/NotFound'
import { Profile } from './pages/Profile'
import { Coordinate } from './pages/Coordinate'
import { Search } from './pages/Search'
import { ContributionDetail } from './pages/ContributionDetail'
import { ParticipantProfile } from './pages/ParticipantProfile'
import { SessionDetail } from './pages/SessionDetail'
import type { Session } from '@supabase/supabase-js'

// Sprint 41: Lazy load heavy pages for code splitting
const Graph = lazy(() => import('./pages/Graph').then(m => ({ default: m.Graph })))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Status = lazy(() => import('./pages/Status').then(m => ({ default: m.Status })))

function Nav() {
  const location = useLocation()
  const [session, setSession] = useState<Session | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { convergence } = useConvergence()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  const links = [
    { to: '/', label: 'Explore' },
    { to: '/contribute', label: 'Contribute' },
    { to: '/coordinate', label: 'Coordinate' },
    { to: '/me', label: 'My Thread' },
  ]

  return (
    <nav className="bg-[#0f0f0f] border-b border-[#262626] px-4 py-3">
      <div className="max-w-6xl mx-auto">
        {/* Desktop nav */}
        <div className="hidden md:flex items-center justify-between relative">
          <Link to="/" className="text-xl font-bold tracking-tight">
            <span style={{ color: convergence.theme_primary }}>{convergence.logo_text}</span>
            <span className="text-gray-500">{convergence.logo_accent}</span>
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
          <div className="flex items-center gap-4 text-sm">
            <Link to="/search" className="text-gray-400 hover:text-white" aria-label="Search">
              <SearchIcon className="w-5 h-5" />
            </Link>
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
              <span style={{ color: convergence.theme_primary }}>{convergence.logo_text}</span>
              <span className="text-gray-500">{convergence.logo_accent}</span>
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
              <Link
                to="/search"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                  location.pathname === '/search'
                    ? 'bg-[#262626] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                }`}
              >
                Search
              </Link>
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
      <ConvergenceProvider>
        <div className="min-h-screen bg-[#0f0f0f] text-white">
          <Nav />
          <main className="max-w-6xl mx-auto px-4 py-6">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Explore />} />
              <Route path="/dimensions" element={<Dimensions />} />
              <Route path="/d/:dimension" element={<DimensionView />} />
              <Route path="/artifact/:id" element={<ArtifactDetail />} />
              <Route path="/me" element={<MyThread />} />
              <Route path="/contribute" element={<Contribute />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/contribution/:id" element={<ContributionDetail />} />
              <Route path="/graph" element={<Suspense fallback={<div className="flex items-center justify-center h-96"><div className="text-gray-500">Loading...</div></div>}><Graph /></Suspense>} />
              <Route path="/coordinate" element={<Coordinate />} />
              <Route path="/dashboard" element={<Suspense fallback={<div className="flex items-center justify-center h-96"><div className="text-gray-500">Loading...</div></div>}><Dashboard /></Suspense>} />
              <Route path="/search" element={<Search />} />
              <Route path="/p/:id" element={<ParticipantProfile />} />
              <Route path="/session/:id" element={<SessionDetail />} />
              <Route path="/status" element={<Suspense fallback={<div className="flex items-center justify-center h-96"><div className="text-gray-500">Loading...</div></div>}><Status /></Suspense>} />
              <Route path="/auth" element={<Auth />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
      </ConvergenceProvider>
    </BrowserRouter>
  )
}
