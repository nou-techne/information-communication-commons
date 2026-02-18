/**
 * Education Hub — /app/learn
 * 
 * Sprint Q69: Central hub for member education.
 * Browse glossary, follow learning paths, search content.
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useConvergence } from '../contexts/ConvergenceContext'
import { 
  listGlossaryTerms, 
  CORE_GLOSSARY_TERMS,
  suggestNextContent
} from '../lib/education-engine'
import type { GlossaryTerm } from '../types/education'
import { 
  BookOpen, Search, Map, GraduationCap, 
  ArrowRight, Compass, Lightbulb, ExternalLink 
} from 'lucide-react'

// Hardcoded paths for Sprint Q69 (until DB fully populated)
const LEARNING_PATHS = [
  {
    id: 'path-new-member-onboarding',
    title: 'New Member Onboarding',
    desc: 'Everything you need to know to start contributing.',
    minutes: 15,
    steps: 5,
    icon: Compass,
    color: 'text-green-400 bg-green-400/10'
  },
  {
    id: 'path-how-royalties-work',
    title: 'Understanding Royalties',
    desc: 'How venture revenue flows to your capital account.',
    minutes: 10,
    steps: 3,
    icon: GemIcon,
    color: 'text-violet-400 bg-violet-400/10'
  },
  {
    id: 'path-governance-participation',
    title: 'Governance Participation',
    desc: 'How to review proposals and cast your vote.',
    minutes: 20,
    steps: 4,
    icon: VoteIcon,
    color: 'text-copper-400 bg-copper-400/10'
  }
]

// Icon wrappers to avoid undefined usage
function GemIcon(props: any) { return <span {...props}>💎</span> }
function VoteIcon(props: any) { return <span {...props}>🗳️</span> }

export function EducationHub() {
  const navigate = useNavigate()
  const { convergence } = useConvergence()
  const [searchTerm, setSearchTerm] = useState('')
  const [terms, setTerms] = useState<GlossaryTerm[]>([])
  const [suggestions, setSuggestions] = useState<{contentId: string, reason: string}[]>([])

  useEffect(() => {
    loadContent()
  }, [convergence.id])

  async function loadContent() {
    // Load glossary (chain + core seed)
    const chainTerms = await listGlossaryTerms(convergence.id)
    
    // Merge with core seed terms if not in chain yet
    const allTerms = [...chainTerms]
    for (const core of CORE_GLOSSARY_TERMS) {
      if (!allTerms.find(t => t.id === core.id)) {
        allTerms.push(core as GlossaryTerm)
      }
    }
    setTerms(allTerms.sort((a, b) => a.title.localeCompare(b.title)))

    // Mock suggestions based on typical new member activity
    setSuggestions(suggestNextContent(['dashboard-viewed', 'contribution-submitted']))
  }

  const filteredTerms = terms.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.plainDefinition.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-copper-400" />
            Education Hub
          </h1>
          <p className="text-white/50 mt-1">
            Master the mechanics of cooperative economics.
          </p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search terms..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-copper-400/50 w-64"
          />
        </div>
      </div>

      {/* Suggested for You */}
      {suggestions.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {suggestions.map(s => (
            <div key={s.contentId} className="bg-gradient-to-r from-copper-900/40 to-copper-800/20 border border-copper-400/20 rounded-lg p-4 flex items-start gap-4">
              <div className="bg-copper-400/20 p-2 rounded-full mt-1">
                <Lightbulb className="w-4 h-4 text-copper-300" />
              </div>
              <div>
                <p className="text-xs text-copper-300 font-medium mb-1">RECOMMENDED</p>
                <p className="text-sm text-white mb-2">{s.reason}</p>
                <Link to={`/app/learn/${s.contentId}`} className="text-xs text-white/60 hover:text-white flex items-center gap-1">
                  Start learning <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Learning Paths */}
      <div>
        <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Map className="w-5 h-5 text-white/60" />
          Learning Paths
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {LEARNING_PATHS.map(path => {
            const Icon = path.icon
            return (
              <div key={path.id} className="bg-white/[0.02] border border-white/10 rounded-lg p-5 hover:border-white/20 transition-colors group">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${path.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-medium text-white mb-1 group-hover:text-copper-300 transition-colors">
                  {path.title}
                </h3>
                <p className="text-sm text-white/50 mb-4 h-10 line-clamp-2">
                  {path.desc}
                </p>
                <div className="flex items-center justify-between text-xs text-white/40 border-t border-white/5 pt-3">
                  <span>{path.steps} steps</span>
                  <span>{path.minutes} min</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Glossary */}
      <div>
        <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-white/60" />
          Cooperative Glossary
        </h2>
        
        {filteredTerms.length === 0 ? (
          <div className="text-center py-12 text-white/30 border border-white/5 rounded-lg border-dashed">
            No terms found for "{searchTerm}"
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTerms.map(term => (
              <div key={term.id} className="bg-white/[0.02] border border-white/10 rounded-lg p-4 hover:bg-white/[0.04] transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-medium text-copper-300">{term.title}</h3>
                  <span className="text-[10px] uppercase tracking-wider text-white/30 bg-white/5 px-2 py-0.5 rounded">
                    {term.topic}
                  </span>
                </div>
                <p className="text-sm text-white/70 mb-3 leading-relaxed">
                  {term.plainDefinition}
                </p>
                {term.example && (
                  <div className="bg-black/20 rounded p-2 text-xs text-white/50 italic border-l-2 border-white/10">
                    "{term.example}"
                  </div>
                )}
                {term.helpContexts.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {term.helpContexts.slice(0, 2).map(ctx => (
                      <span key={ctx} className="text-[10px] text-white/20 bg-white/5 px-1.5 py-0.5 rounded">
                        Appears in UI
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
