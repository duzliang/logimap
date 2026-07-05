import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from './ThemeProvider.js'
import { Button } from '../components/button.js'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const cycle = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const label = theme === 'system' ? '跟随系统' : theme === 'dark' ? '暗色模式' : '浅色模式'

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={cycle}
      title={label}
      aria-label={label}
    >
      {resolvedTheme === 'dark' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
      <span className="sr-only">{label}</span>
    </Button>
  )
}

export function ThemeSelect() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border-default)] p-1">
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`rounded p-1.5 ${theme === 'light' ? 'bg-[var(--color-brand-subtle)] text-[var(--color-brand-default)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
        aria-label="浅色模式"
        title="浅色模式"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`rounded p-1.5 ${theme === 'dark' ? 'bg-[var(--color-brand-subtle)] text-[var(--color-brand-default)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
        aria-label="暗色模式"
        title="暗色模式"
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme('system')}
        className={`rounded p-1.5 ${theme === 'system' ? 'bg-[var(--color-brand-subtle)] text-[var(--color-brand-default)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
        aria-label="跟随系统"
        title="跟随系统"
      >
        <Monitor className="h-4 w-4" />
      </button>
    </div>
  )
}
