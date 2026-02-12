import { Link } from 'react-router-dom'
import { PenLine, Sparkles, Globe, Search as SearchIcon, GitBranch, ArrowRight } from 'lucide-react'

export function Onboard() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Welcome to the Commons</h1>
      <p className="text-gray-400 mb-8 leading-relaxed">
        Everything said at ETHBoulder is worth keeping. This tool captures it.
      </p>

      {/* How it works - 3 steps */}
      <div className="space-y-4 mb-10">
        <div className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#a6ed2a]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <PenLine className="w-5 h-5 text-[#a6ed2a]" />
            </div>
            <div>
              <h3 className="font-medium text-white mb-1">1. Write what you noticed</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                After a talk, workshop, or hallway conversation — write down what stuck with you. 
                Session notes, an idea someone sparked, a commitment you made, a question you're sitting with. 
                Don't worry about formatting. Just write naturally.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#a6ed2a]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-[#a6ed2a]" />
            </div>
            <div>
              <h3 className="font-medium text-white mb-1">2. AI does the organizing</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                When you submit, AI reads your contribution and pulls out the key pieces: 
                ideas, proposals, commitments, patterns, questions. It tags them by topic, 
                connects them to what others have contributed, and adds them to the knowledge graph. 
                Takes about 15 seconds.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#a6ed2a]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Globe className="w-5 h-5 text-[#a6ed2a]" />
            </div>
            <div>
              <h3 className="font-medium text-white mb-1">3. The commons grows</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Every contribution feeds a shared knowledge graph that everyone at ETHBoulder can explore. 
                Ideas link to other ideas. People link to what they said. 
                The conversations don't disappear when the event ends — they have permanent addresses.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* What to contribute */}
      <div className="mb-10">
        <h2 className="text-lg font-bold mb-4">What's worth contributing?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-4">
            <p className="text-sm font-medium text-gray-300 mb-1">Session notes</p>
            <p className="text-xs text-gray-500">"The keynote argued that public goods funding needs..."</p>
          </div>
          <div className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-4">
            <p className="text-sm font-medium text-gray-300 mb-1">Ideas</p>
            <p className="text-xs text-gray-500">"What if we combined quadratic funding with..."</p>
          </div>
          <div className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-4">
            <p className="text-sm font-medium text-gray-300 mb-1">Commitments</p>
            <p className="text-xs text-gray-500">"I'm going to build a prototype of X by March..."</p>
          </div>
          <div className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-4">
            <p className="text-sm font-medium text-gray-300 mb-1">Questions</p>
            <p className="text-xs text-gray-500">"How do we measure impact without gaming metrics?"</p>
          </div>
          <div className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-4">
            <p className="text-sm font-medium text-gray-300 mb-1">Connections</p>
            <p className="text-xs text-gray-500">"Met someone from X project — they're working on..."</p>
          </div>
          <div className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-4">
            <p className="text-sm font-medium text-gray-300 mb-1">Reflections</p>
            <p className="text-xs text-gray-500">"The theme emerging across sessions is..."</p>
          </div>
        </div>
      </div>

      {/* Quick tips */}
      <div className="mb-10">
        <h2 className="text-lg font-bold mb-4">Tips</h2>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-[#a6ed2a] mt-0.5">-</span>
            <span><strong className="text-gray-300">Write more than a sentence.</strong> The AI needs enough context to extract meaningful artifacts. A paragraph or two is ideal.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#a6ed2a] mt-0.5">-</span>
            <span><strong className="text-gray-300">Name names.</strong> If someone said something great, mention them. It helps build the people graph.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#a6ed2a] mt-0.5">-</span>
            <span><strong className="text-gray-300">Tag the session</strong> if you're writing about a specific talk or workshop. The dropdown on the contribute page lets you link your notes to the session.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#a6ed2a] mt-0.5">-</span>
            <span><strong className="text-gray-300">Sign in</strong> to get credited. Anonymous contributions work too, but signing in links your contributions to your profile.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#a6ed2a] mt-0.5">-</span>
            <span><strong className="text-gray-300">Contribute often.</strong> Quick notes after every session beat one big brain dump at the end. The graph gets richer with more frequent contributions.</span>
          </li>
        </ul>
      </div>

      {/* Explore options */}
      <div className="mb-10">
        <h2 className="text-lg font-bold mb-4">After you contribute</h2>
        <div className="space-y-3">
          <Link to="/" className="flex items-center gap-3 bg-[#0a101d] border border-[#1d2839] rounded-lg p-4 hover:border-[#a6ed2a] transition-colors">
            <SearchIcon className="w-5 h-5 text-gray-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-300">Explore the knowledge graph</p>
              <p className="text-xs text-gray-500">See what others have contributed and how ideas connect</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-600" />
          </Link>
          <Link to="/graph" className="flex items-center gap-3 bg-[#0a101d] border border-[#1d2839] rounded-lg p-4 hover:border-[#a6ed2a] transition-colors">
            <GitBranch className="w-5 h-5 text-gray-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-300">View the graph visualization</p>
              <p className="text-xs text-gray-500">Interactive map of all artifacts and their relationships</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-600" />
          </Link>
          <Link to="/stats" className="flex items-center gap-3 bg-[#0a101d] border border-[#1d2839] rounded-lg p-4 hover:border-[#a6ed2a] transition-colors">
            <Globe className="w-5 h-5 text-gray-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-300">Real-time event stats</p>
              <p className="text-xs text-gray-500">Contributions, artifacts, participants — live metrics</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-600" />
          </Link>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-6">
        <Link
          to="/contribute"
          className="inline-flex items-center gap-2 px-8 py-3 bg-[#a6ed2a] text-[#080c16] rounded-lg font-medium hover:bg-[#b8f247] transition-colors text-lg"
        >
          <PenLine className="w-5 h-5" />
          Start Contributing
        </Link>
        <p className="text-xs text-gray-600 mt-3">No account required. Sign in for credit.</p>
      </div>
    </div>
  )
}
