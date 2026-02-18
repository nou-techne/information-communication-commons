/**
 * Member Onboarding Wizard
 * 
 * Sprint Q68: Step-by-step guided flow for new members.
 * Shows *their* data as they progress. Interactive, not just informational.
 * 
 * "This is your capital account. It's empty now. Here's how it grows."
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConvergence } from '../contexts/ConvergenceContext'
import { supabase } from '../lib/supabase'
import { ContextualHelp } from '../components/ContextualHelp'
import {
  ArrowRight, ArrowLeft, Check, Wallet, Users,
  FileText, Vote, Gem, BookOpen, Rocket
} from 'lucide-react'

interface Step {
  id: string
  title: string
  icon: typeof Wallet
  content: React.ReactNode
}

export function OnboardingWizard() {
  const navigate = useNavigate()
  const { convergence } = useConvergence()
  const [currentStep, setCurrentStep] = useState(0)
  const [userName, setUserName] = useState('')
  const [capitalBalance, setCapitalBalance] = useState(0)

  useEffect(() => {
    loadUserData()
  }, [])

  async function loadUserData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data: participant } = await supabase
        .from('participants')
        .select('name')
        .eq('auth_user_id', session.user.id)
        .single()
      if (participant) setUserName(participant.name)
    }
  }

  const steps: Step[] = [
    {
      id: 'welcome',
      title: 'Welcome to Techne',
      icon: Users,
      content: (
        <div className="space-y-4">
          <p className="text-white/80 leading-relaxed">
            {userName ? `Welcome, ${userName}!` : 'Welcome!'} Techne is a <strong className="text-copper-300">Limited Cooperative Association</strong> — 
            a venture studio where members co-create tools and share in the value they generate.
          </p>
          <div className="bg-copper-500/10 border border-copper-400/20 rounded-lg p-4">
            <p className="text-sm text-white/70">
              <strong className="text-copper-300">What makes us different:</strong> In a traditional company, 
              shareholders who invest money get the profits. In a cooperative, <em>members who contribute work</em> share 
              in the surplus. Your effort builds your ownership stake.
            </p>
          </div>
          <p className="text-sm text-white/50">
            This walkthrough takes about 5 minutes and will show you how everything works — using <em>your</em> actual data.
          </p>
        </div>
      ),
    },
    {
      id: 'capital-account',
      title: 'Your Capital Account',
      icon: Wallet,
      content: (
        <div className="space-y-4">
          <p className="text-white/80 leading-relaxed">
            Every member has a <ContextualHelp context="dashboard-capital-balance"><strong className="text-copper-300">capital account</strong></ContextualHelp>. 
            Think of it as your running tab of ownership in the cooperative.
          </p>
          <div className="bg-gradient-to-br from-copper-500/20 to-copper-600/10 border border-copper-400/30 rounded-lg p-6 text-center">
            <p className="text-xs text-white/50 mb-1">Your Capital Account Balance</p>
            <p className="text-4xl font-semibold text-white">
              ${capitalBalance.toFixed(2)}
            </p>
            <p className="text-xs text-white/40 mt-2">
              {capitalBalance === 0 
                ? "It's empty now — and that's completely normal for new members."
                : "This reflects your credited contributions so far."}
            </p>
          </div>
          <p className="text-sm text-white/60">
            Your balance grows when your contributions are approved and credited. It's computed directly from 
            the cooperative's merkle chain — a tamper-evident ledger of every economic event.
          </p>
        </div>
      ),
    },
    {
      id: 'contributions',
      title: 'How Contributions Work',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p className="text-white/80 leading-relaxed">
            Everything starts with <strong className="text-copper-300">contributions</strong> — the work you do for the cooperative.
          </p>
          <div className="space-y-2">
            {[
              { step: '1. Describe', desc: 'Write what you did in plain language. The system extracts structured data automatically.' },
              { step: '2. Submit', desc: 'Your contribution enters the review pipeline.' },
              { step: '3. Validate', desc: 'A coordinator verifies the work is authentic and in scope.' },
              { step: '4. Value', desc: 'Economic value is assigned based on effort, impact, and category.' },
              { step: '5. Approve', desc: 'Your capital account is credited. This is now your ownership.' },
            ].map(({ step, desc }) => (
              <div key={step} className="flex gap-3 bg-white/[0.02] border border-white/10 rounded-lg p-3">
                <span className="text-copper-400 font-medium text-sm whitespace-nowrap">{step}</span>
                <span className="text-sm text-white/60">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'governance',
      title: 'Your Voice Matters',
      icon: Vote,
      content: (
        <div className="space-y-4">
          <p className="text-white/80 leading-relaxed">
            Techne is <strong className="text-copper-300">democratically governed</strong>. 
            Every cooperative member gets one vote — regardless of how much they've contributed or invested.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/[0.02] border border-white/10 rounded-lg p-3">
              <p className="text-sm font-medium text-white mb-1">Period Close</p>
              <p className="text-xs text-white/50">Members vote to approve how surplus is allocated each period.</p>
            </div>
            <div className="bg-white/[0.02] border border-white/10 rounded-lg p-3">
              <p className="text-sm font-medium text-white mb-1">Royalty Agreements</p>
              <p className="text-xs text-white/50">New venture royalty agreements need governance approval.</p>
            </div>
          </div>
          <p className="text-sm text-white/60">
            Quorum is 50% of cooperative members. Decisions pass by simple majority. Your vote counts equally.
          </p>
        </div>
      ),
    },
    {
      id: 'ventures',
      title: 'Venture Royalties',
      icon: Gem,
      content: (
        <div className="space-y-4">
          <p className="text-white/80 leading-relaxed">
            Techne is a <strong className="text-copper-300">venture studio</strong>. 
            When members co-create tools and technologies that generate revenue, they earn royalties.
          </p>
          <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4">
            <p className="text-sm text-white/70 mb-2">Two income streams, one capital account:</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-copper-400 mt-1.5" />
                <div>
                  <p className="text-sm text-white">Patronage</p>
                  <p className="text-xs text-white/40">Credits for cooperative contributions (labor, coordination, stewardship)</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-violet-400 mt-1.5" />
                <div>
                  <p className="text-sm text-white">Royalties</p>
                  <p className="text-xs text-white/40">Revenue share from co-created ventures (tools, products, services)</p>
                </div>
              </div>
            </div>
          </div>
          <p className="text-sm text-white/60">
            Royalty shares may vest over time. Your agreement defines your percentage, vesting schedule, and distribution frequency.
          </p>
        </div>
      ),
    },
    {
      id: 'next-steps',
      title: 'You\'re Ready',
      icon: Rocket,
      content: (
        <div className="space-y-4">
          <p className="text-white/80 leading-relaxed">
            That's the foundation. Here's how to get started:
          </p>
          <div className="space-y-2">
            {[
              { action: 'Submit your first contribution', path: '/app/contribute', icon: '📝' },
              { action: 'Explore the venture portfolio', path: '/app/ventures', icon: '🚀' },
              { action: 'Browse the glossary', path: '/app/learn', icon: '📖' },
              { action: 'View your dashboard', path: '/app/dashboard', icon: '📊' },
            ].map(({ action, path, icon }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="w-full flex items-center gap-3 bg-white/[0.02] border border-white/10 rounded-lg p-3 hover:border-copper-400/30 transition-colors text-left"
              >
                <span className="text-lg">{icon}</span>
                <span className="text-sm text-white">{action}</span>
                <ArrowRight className="w-4 h-4 text-white/30 ml-auto" />
              </button>
            ))}
          </div>
          <div className="bg-copper-500/10 border border-copper-400/20 rounded-lg p-3 mt-4">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-copper-400" />
              <span className="text-sm text-copper-300">Keep learning</span>
            </div>
            <p className="text-xs text-white/50">
              Look for the <span className="text-copper-400">?</span> icon throughout the app. 
              Every feature has contextual help that explains what it means and why it matters.
            </p>
          </div>
        </div>
      ),
    },
  ]

  const step = steps[currentStep]
  const StepIcon = step.icon
  const isLast = currentStep === steps.length - 1

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Progress */}
      <div className="flex items-center gap-1 mb-8">
        {steps.map((s, i) => (
          <div
            key={s.id}
            className={`flex-1 h-1 rounded-full transition-colors ${
              i <= currentStep ? 'bg-copper-400' : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      {/* Step Content */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-copper-400/20 p-2 rounded-lg">
            <StepIcon className="w-5 h-5 text-copper-300" />
          </div>
          <div>
            <p className="text-xs text-white/40">Step {currentStep + 1} of {steps.length}</p>
            <h2 className="text-xl font-semibold text-white">{step.title}</h2>
          </div>
        </div>
        {step.content}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white disabled:opacity-30"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        
        {isLast ? (
          <button
            onClick={() => navigate('/app/dashboard')}
            className="flex items-center gap-2 bg-copper-500 hover:bg-copper-400 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            <Check className="w-4 h-4" /> Go to Dashboard
          </button>
        ) : (
          <button
            onClick={() => setCurrentStep(currentStep + 1)}
            className="flex items-center gap-2 bg-copper-500 hover:bg-copper-400 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
