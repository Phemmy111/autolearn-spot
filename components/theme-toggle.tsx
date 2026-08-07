'use client'

import { useTheme } from './theme-provider'
import { Sun, Moon, Monitor } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme, actualTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const getIcon = () => {
    if (theme === 'light') return <Sun className="h-5 w-5" />
    if (theme === 'dark') return <Moon className="h-5 w-5" />
    return <Monitor className="h-5 w-5" />
  }

  const getLabel = () => {
    if (theme === 'light') return 'Light'
    if (theme === 'dark') return 'Dark'
    return 'System'
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--card)] hover:bg-[var(--surface-hover)] transition-all duration-250 ease-in-out"
      title={`Current: ${getLabel()} mode. Click to cycle through themes.`}
      aria-label={`Toggle theme. Current: ${getLabel()}`}
    >
      <span className="text-[var(--primary)] transition-colors duration-250">
        {getIcon()}
      </span>
      <span className="hidden sm:inline font-mono text-xs text-[var(--text-muted)]">
        {getLabel()}
      </span>
    </button>
  )
}
