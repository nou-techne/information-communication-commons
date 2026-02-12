import { Link } from 'react-router-dom'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[#1d2839] bg-[#060a14] mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <span>Sponsored by</span>
            <a
              href="https://regenhub.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              RegenHub, LCA
            </a>
            <span>/</span>
            <a
              href="https://techne.institute"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Techne
            </a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/terms.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300 transition-colors"
            >
              Terms
            </a>
            <a
              href="/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300 transition-colors"
            >
              Privacy
            </a>
            <a
              href="https://github.com/nou-techne/information-communication-commons/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300 transition-colors"
            >
              License
            </a>
          </div>

          <div className="text-gray-600">
            &copy; {year} commons.id
          </div>
        </div>
      </div>
    </footer>
  )
}
