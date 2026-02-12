import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'
import { supabase } from './lib/supabase'
import { Menu, X, Search as SearchIcon } from 'lucide-react'
import { ConvergenceProvider, useConvergence } from './contexts/ConvergenceContext'
import { ToastProvider } from './contexts/ToastContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ThemeToggle } from './components/ThemeToggle'
import { ToastContainer } from './components/ui/Toast'
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PageLoader } from './components/ui/PageLoader'
import { Footer } from './components/Footer'
// Lazy load all page components for code splitting
const Explore = lazy(() => import('./pages/Explore').then(m => ({ default: m.Explore })))
const ArtifactDetail = lazy(() => import('./pages/ArtifactDetail').then(m => ({ default: m.ArtifactDetail })))
const MyThread = lazy(() => import('./pages/MyThread').then(m => ({ default: m.MyThread })))
const Contribute = lazy(() => import('./pages/Contribute').then(m => ({ default: m.Contribute })))
const Auth = lazy(() => import('./pages/Auth').then(m => ({ default: m.Auth })))
const Dimensions = lazy(() => import('./pages/Dimensions').then(m => ({ default: m.Dimensions })))
const DimensionView = lazy(() => import('./pages/DimensionView').then(m => ({ default: m.DimensionView })))
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })))
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })))
const Coordinate = lazy(() => import('./pages/Coordinate').then(m => ({ default: m.Coordinate })))
const Search = lazy(() => import('./pages/Search').then(m => ({ default: m.Search })))
const ContributionDetail = lazy(() => import('./pages/ContributionDetail').then(m => ({ default: m.ContributionDetail })))
const ParticipantProfile = lazy(() => import('./pages/ParticipantProfile').then(m => ({ default: m.ParticipantProfile })))
const SessionDetail = lazy(() => import('./pages/SessionDetail').then(m => ({ default: m.SessionDetail })))
const Stats = lazy(() => import('./pages/Stats').then(m => ({ default: m.Stats })))
const Onboard = lazy(() => import('./pages/Onboard').then(m => ({ default: m.Onboard })))
const Channels = lazy(() => import('./pages/Channels').then(m => ({ default: m.Channels })))
const ChannelView = lazy(() => import('./pages/ChannelView').then(m => ({ default: m.ChannelView })))
const ThreadView = lazy(() => import('./pages/ThreadView').then(m => ({ default: m.ThreadView })))
const MessageSearch = lazy(() => import('./pages/MessageSearch').then(m => ({ default: m.MessageSearch })))
const ApiDocsPage = lazy(() => import('./pages/ApiDocsPage'))
const WebhooksPage = lazy(() => import('./pages/WebhooksPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const ConvergenceDashboardPage = lazy(() => import('./pages/ConvergenceDashboardPage'))
const FederationPage = lazy(() => import('./pages/FederationPage'))
import type { Session } from '@supabase/supabase-js'
import { Navigate } from 'react-router-dom'

function RequireAuth({ children, session, loading }: { children: React.ReactNode; session: Session | null; loading: boolean }) {
  if (loading) return <PageLoader />
  if (!session) return <Navigate to="/auth" replace />
  return <>{children}</>
}

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

  const publicLinks = [
    { to: '/', label: 'Explore' },
  ]
  const authedLinks = [
    { to: '/contribute', label: 'Contribute' },
    { to: '/coordinate', label: 'Coordinate' },
    { to: '/channels', label: 'Channels' },
    { to: '/me', label: 'My Activity' },
  ]
  const links = session ? [...publicLinks, ...authedLinks] : publicLinks

  return (
    <nav className="bg-[#080c16] border-b border-[#1d2839] px-4 py-3">
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
                    ? 'bg-[#1d2839] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#0a101d]'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <ThemeToggle />
            <Link to="/search" className="text-gray-400 hover:text-white" aria-label="Search">
              <SearchIcon className="w-5 h-5" />
            </Link>
            {session ? (
              <>
                <Link to="/profile" className="text-gray-400 hover:text-white">Profile</Link>
                <button onClick={() => supabase.auth.signOut()} className="text-gray-400 hover:text-white">
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/auth" className="text-[#a6ed2a] hover:text-white">Sign in</Link>
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
            <div className="mt-3 pt-3 border-t border-[#1d2839] space-y-1">
              {links.map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    location.pathname === l.to
                      ? 'bg-[#1d2839] text-white'
                      : 'text-gray-400 hover:text-white hover:bg-[#0a101d]'
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
                    ? 'bg-[#1d2839] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#0a101d]'
                }`}
              >
                Search
              </Link>
              <div className="pt-2 border-t border-[#1d2839]">
                {session ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        location.pathname === '/profile'
                          ? 'bg-[#1d2839] text-white'
                          : 'text-gray-400 hover:text-white hover:bg-[#0a101d]'
                      }`}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => { supabase.auth.signOut(); setMobileMenuOpen(false); }}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-[#a6ed2a] hover:text-white"
                  >
                    Sign in
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-3 px-3 py-2">
                <span className="text-xs text-gray-400">Theme</span>
                <ThemeToggle />
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

function AuthGuardedRoutes() {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); setAuthLoading(false) })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <Routes>
      <Route path="/" element={<Explore />} />
      <Route path="/dimensions" element={<Dimensions />} />
      <Route path="/d/:dimension" element={<DimensionView />} />
      <Route path="/artifact/:id" element={<ArtifactDetail />} />
      <Route path="/me" element={<RequireAuth session={session} loading={authLoading}><MyThread /></RequireAuth>} />
      <Route path="/contribute" element={<RequireAuth session={session} loading={authLoading}><Contribute /></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth session={session} loading={authLoading}><Profile /></RequireAuth>} />
      <Route path="/contribution/:id" element={<ContributionDetail />} />
      <Route path="/graph" element={<Graph />} />
      <Route path="/coordinate" element={<RequireAuth session={session} loading={authLoading}><Coordinate /></RequireAuth>} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/search" element={<Search />} />
      <Route path="/p/:id" element={<ParticipantProfile />} />
      <Route path="/session/:id" element={<SessionDetail />} />
      <Route path="/stats" element={<Stats />} />
      <Route path="/channels" element={<RequireAuth session={session} loading={authLoading}><Channels /></RequireAuth>} />
      <Route path="/channels/search" element={<RequireAuth session={session} loading={authLoading}><MessageSearch /></RequireAuth>} />
      <Route path="/channels/:slug" element={<RequireAuth session={session} loading={authLoading}><ChannelView /></RequireAuth>} />
      <Route path="/channels/:slug/:threadId" element={<RequireAuth session={session} loading={authLoading}><ThreadView /></RequireAuth>} />
      <Route path="/welcome" element={<Onboard />} />
      <Route path="/status" element={<Status />} />
      <Route path="/api-docs" element={<ApiDocsPage />} />
      <Route path="/webhooks" element={<WebhooksPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/convergence" element={<ConvergenceDashboardPage />} />
      <Route path="/federation" element={<FederationPage />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/app">
      <ThemeProvider>
      <ToastProvider>
      <ConvergenceProvider>
        <div className="min-h-screen bg-[#080c16] text-white flex flex-col">
          <Nav />
          <main className="max-w-6xl mx-auto px-4 py-6 flex-1 w-full">
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <AuthGuardedRoutes />
            </Suspense>
          </ErrorBoundary>
        </main>
          <Footer />
      </div>
      </ConvergenceProvider>
      <ToastContainer />
      <KeyboardShortcutsModal />
      </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
