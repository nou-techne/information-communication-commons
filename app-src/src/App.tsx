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
import { ConvergenceSwitcher } from './components/ConvergenceSwitcher'
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
const ApiKeysPage = lazy(() => import('./pages/ApiKeysPage').then(m => ({ default: m.ApiKeysPage })))
const CommitmentDashboard = lazy(() => import('./pages/CommitmentDashboard').then(m => ({ default: m.CommitmentDashboard })))
const AgentLeaderboard = lazy(() => import('./pages/AgentLeaderboard').then(m => ({ default: m.AgentLeaderboard })))
const WebhooksPage = lazy(() => import('./pages/WebhooksPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const ConvergenceDashboardPage = lazy(() => import('./pages/ConvergenceDashboardPage'))
const FederationPage = lazy(() => import('./pages/FederationPage'))
const ChainExplorer = lazy(() => import('./pages/ChainExplorer').then(m => ({ default: m.ChainExplorer })))
const MemberProfile = lazy(() => import('./pages/MemberProfile').then(m => ({ default: m.MemberProfile })))
const AuditTrail = lazy(() => import('./pages/AuditTrail').then(m => ({ default: m.AuditTrail })))
const CoordinatorQueue = lazy(() => import('./pages/CoordinatorQueue').then(m => ({ default: m.CoordinatorQueue })))
const EducationHub = lazy(() => import('./pages/EducationHub').then(m => ({ default: m.EducationHub })))
const VenturePortfolio = lazy(() => import('./pages/VenturePortfolio').then(m => ({ default: m.default || m.VenturePortfolio })))
const PublicPortfolio = lazy(() => import('./pages/PublicPortfolio').then(m => ({ default: m.PublicPortfolio })))
const OnboardingWizard = lazy(() => import('./pages/OnboardingWizard').then(m => ({ default: m.default || m.OnboardingWizard })))
const SprintProgress = lazy(() => import('./pages/SprintProgress').then(m => ({ default: m.SprintProgress })))
const TechneLanding = lazy(() => import('./pages/TechneLanding').then(m => ({ default: m.TechneLanding })))
const MemberDirectory = lazy(() => import('./pages/MemberDirectory').then(m => ({ default: m.MemberDirectory })))
const ContributionSubmit = lazy(() => import('./pages/ContributionSubmit').then(m => ({ default: m.ContributionSubmit })))
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
const Live = lazy(() => import('./pages/Live'))

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
    { to: '/channels', label: 'Channels' },
    { to: '/coordinate', label: 'Coordinate' },
    { to: '/me', label: 'My Activity' },
  ]
  // Techne cooperative nav items
  const isTechne = convergence.id === '00000000-0000-0000-0000-000000000200'
  const techneLinks = isTechne ? [
    { to: '/ventures', label: 'Ventures' },
    { to: '/learn', label: 'Learn' },
    ...(session ? [
      { to: '/queue', label: 'Queue' },
      { to: '/audit', label: 'Audit' },
    ] : []),
  ] : []
  const links = session ? [...publicLinks, ...authedLinks, ...techneLinks] : [...publicLinks, ...techneLinks]

  return (
    <nav style={{ background: convergence.theme_bg, borderBottom: `1px solid ${convergence.theme_border}` }} className="px-4 py-3" aria-label="Main navigation">
      <div className="max-w-6xl mx-auto">
        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/" className="text-xl font-bold tracking-tight shrink-0">
            <span style={{ color: convergence.theme_primary }}>{convergence.logo_text}</span>
            <span className="text-gray-500">{convergence.logo_accent}</span>
          </Link>
          <div className="flex-1 flex justify-center">
            <div className="flex gap-0.5 flex-wrap justify-center">
              {links.map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  style={
                    (location.pathname === l.to || (l.to === '/dimensions' && location.pathname.startsWith('/d/')))
                      ? { background: convergence.theme_surface }
                      : undefined
                  }
                  className={`px-2.5 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                    (location.pathname === l.to || (l.to === '/dimensions' && location.pathname.startsWith('/d/')))
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm shrink-0">
            <Link
              to="/live"
              className="px-2.5 py-1.5 rounded-lg text-sm font-medium bg-[#16a34a]/15 text-[#4ade80] border border-[#16a34a]/30 hover:bg-[#16a34a]/25 transition-colors whitespace-nowrap"
            >
              Live
            </Link>
            <ConvergenceSwitcher />
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
              <Link to="/auth" style={{ color: convergence.theme_primary }} className="hover:text-white">Sign in</Link>
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
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
          
          {mobileMenuOpen && (
            <div className="mt-3 pt-3 space-y-1" style={{ borderTop: `1px solid ${convergence.theme_border}` }}>
              {links.map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMobileMenuOpen(false)}
                  style={location.pathname === l.to ? { background: convergence.theme_surface } : undefined}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    location.pathname === l.to
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              <Link
                to="/live"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-[#4ade80] bg-[#16a34a]/15 border border-[#16a34a]/30"
              >
                View Live
              </Link>
              <Link
                to="/search"
                onClick={() => setMobileMenuOpen(false)}
                style={location.pathname === '/search' ? { background: convergence.theme_surface } : undefined}
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                  location.pathname === '/search'
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Search
              </Link>
              <div className="pt-2" style={{ borderTop: `1px solid ${convergence.theme_border}` }}>
                {session ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      style={location.pathname === '/profile' ? { background: convergence.theme_surface } : undefined}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        location.pathname === '/profile'
                          ? 'text-white'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
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
                    style={{ color: convergence.theme_primary }}
                    className="block px-3 py-2 text-sm hover:text-white"
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
      <Route path="/live" element={<Live />} />
      <Route path="/dashboard" element={<Navigate to="/live" replace />} />
      <Route path="/search" element={<Search />} />
      <Route path="/p/:id" element={<ParticipantProfile />} />
      <Route path="/session/:id" element={<SessionDetail />} />
      <Route path="/stats" element={<Stats />} />
      <Route path="/channels" element={<RequireAuth session={session} loading={authLoading}><Channels /></RequireAuth>} />
      <Route path="/channels/search" element={<RequireAuth session={session} loading={authLoading}><MessageSearch /></RequireAuth>} />
      <Route path="/channels/:slug" element={<RequireAuth session={session} loading={authLoading}><ChannelView /></RequireAuth>} />
      <Route path="/channels/:slug/:threadId" element={<RequireAuth session={session} loading={authLoading}><ThreadView /></RequireAuth>} />
      <Route path="/welcome" element={<Onboard />} />
      <Route path="/status" element={<Navigate to="/live" replace />} />
      <Route path="/api-docs" element={<ApiDocsPage />} />
      <Route path="/api-keys" element={<RequireAuth session={session} loading={authLoading}><ApiKeysPage /></RequireAuth>} />
      <Route path="/commitments" element={<RequireAuth session={session} loading={authLoading}><CommitmentDashboard /></RequireAuth>} />
      <Route path="/agents" element={<AgentLeaderboard />} />
      <Route path="/webhooks" element={<WebhooksPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/convergence" element={<ConvergenceDashboardPage />} />
      <Route path="/federation" element={<FederationPage />} />
      <Route path="/chain" element={<ChainExplorer />} />
      <Route path="/member/:memberId" element={<MemberProfile />} />
      <Route path="/audit" element={<RequireAuth session={session} loading={authLoading}><AuditTrail /></RequireAuth>} />
      <Route path="/queue" element={<RequireAuth session={session} loading={authLoading}><CoordinatorQueue /></RequireAuth>} />
      <Route path="/learn" element={<EducationHub />} />
      <Route path="/ventures" element={<VenturePortfolio />} />
      <Route path="/portfolio" element={<PublicPortfolio />} />
      <Route path="/onboarding" element={<RequireAuth session={session} loading={authLoading}><OnboardingWizard /></RequireAuth>} />
      <Route path="/progress" element={<SprintProgress />} />
      <Route path="/techne" element={<TechneLanding />} />
      <Route path="/members" element={<MemberDirectory />} />
      <Route path="/submit" element={<ContributionSubmit />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function CountdownBanner() {
  const { convergence } = useConvergence()
  const [remaining, setRemaining] = useState<{ d: number; h: number; m: number; s: number } | null>(null)

  useEffect(() => {
    if (!convergence.opens_at) return
    const target = new Date(convergence.opens_at).getTime()
    function tick() {
      const diff = target - Date.now()
      if (diff <= 0) { setRemaining(null); return }
      setRemaining({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const i = setInterval(tick, 1000)
    return () => clearInterval(i)
  }, [convergence.opens_at])

  if (!remaining) return null

  return (
    <div className="countdown-banner border-b border-white/10" style={{ background: `linear-gradient(90deg, ${convergence.theme_surface}, ${convergence.theme_bg}, ${convergence.theme_surface})` }}>
      <div className="max-w-6xl mx-auto px-4 py-4 text-center">
        <div className="text-xs uppercase tracking-widest text-blue-400 mb-2 flex items-center justify-center gap-2">
          <span>Convergence Chain Opens In</span>
          <span className="relative group">
            <svg className="w-3.5 h-3.5 text-blue-500 cursor-help" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-[#0a101d] border border-[#1d2839] rounded-lg text-left text-xs text-gray-300 leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 shadow-xl">
              <span className="font-semibold text-white block mb-1">What is the Convergence Chain?</span>
              Every contribution to the knowledge graph is appended to an immutable hash chain — each entry linked to the last by a cryptographic hash. This creates a verifiable, tamper-evident record of how collective knowledge emerged over time. The chain starts when the convergence opens.
            </span>
          </span>
        </div>
        <div className="flex items-center justify-center gap-3 sm:gap-5">
          {remaining.d > 0 && (
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-white">{remaining.d}</span>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Days</span>
            </div>
          )}
          {remaining.d > 0 && <span className="text-2xl text-gray-600 font-thin">:</span>}
          <div className="flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-mono font-bold text-white">{String(remaining.h).padStart(2, '0')}</span>
            <span className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Hours</span>
          </div>
          <span className="text-2xl text-gray-600 font-thin">:</span>
          <div className="flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-mono font-bold text-white">{String(remaining.m).padStart(2, '0')}</span>
            <span className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Min</span>
          </div>
          <span className="text-2xl text-gray-600 font-thin">:</span>
          <div className="flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-mono font-bold text-blue-400">{String(remaining.s).padStart(2, '0')}</span>
            <span className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Sec</span>
          </div>
        </div>
        <div className="text-xs text-gray-600 mt-2">
          {convergence.opens_at && new Date(convergence.opens_at).toLocaleString(undefined, { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/app">
      <ThemeProvider>
      <ToastProvider>
      <ConvergenceProvider>
        <div className="min-h-screen text-white flex flex-col" style={{ background: convergence.theme_bg }}>
          <a href="#main-content" className="skip-link">Skip to main content</a>
          <CountdownBanner />
          <Nav />
          <main id="main-content" className="max-w-6xl mx-auto px-4 py-6 flex-1 w-full">
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <AuthGuardedRoutes />
            </Suspense>
          </ErrorBoundary>
        </main>
          <div aria-live="polite" className="sr-only" id="status-announcements"></div>
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
