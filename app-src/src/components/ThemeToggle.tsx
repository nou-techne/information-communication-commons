import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      className="relative w-12 h-6 rounded-full transition-colors duration-300 flex-shrink-0 theme-toggle-track"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 flex items-center justify-center theme-toggle-thumb ${
          theme === 'light' ? 'left-[26px]' : 'left-0.5'
        }`}
      >
        {theme === 'dark' ? (
          <Moon className="w-3 h-3 text-[#080c16]" />
        ) : (
          <Sun className="w-3 h-3 text-[#080c16]" />
        )}
      </div>
    </button>
  )
}
