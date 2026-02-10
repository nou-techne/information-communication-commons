import { Link } from 'react-router-dom'

const MESSAGES = [
  "This artifact hasn't been extracted from the collective consciousness yet.",
  "You've wandered beyond the knowledge graph. Even the AI doesn't know what's here.",
  "404: The commons giveth, and the commons taketh away.",
  "Somewhere between the convergence tents, you took a wrong turn.",
  "This page was last seen vibing at ETHBoulder. It hasn't come back.",
  "The e/H-LAM/T dimensions don't include 'lost.' We checked.",
  "You've discovered the one place the knowledge graph can't reach.",
  "This page committed to existing but never followed through.",
]

export function NotFound() {
  const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]

  return (
    <div className="text-center py-24 max-w-lg mx-auto">
      <div className="text-8xl font-mono font-bold text-[#c3fd50] mb-4">404</div>
      <p className="text-lg text-gray-300 mb-2">{msg}</p>
      <p className="text-sm text-gray-500 mb-10">
        The page you're looking for doesn't exist, was never extracted, or has returned to the void.
      </p>
      <div className="flex gap-3 justify-center">
        <Link
          to="/"
          className="px-6 py-2.5 bg-[#c3fd50] text-[#0f0f0f] rounded-lg hover:bg-[#d4fe80] transition-colors text-sm font-medium"
        >
          Back to Explore
        </Link>
        <Link
          to="/contribute"
          className="px-6 py-2.5 bg-[#262626] text-white rounded-lg hover:bg-[#333333] transition-colors text-sm"
        >
          Contribute something real
        </Link>
      </div>
    </div>
  )
}
