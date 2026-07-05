import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'logimap-theme'

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') return getSystemTheme()
  return theme
}

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = STORAGE_KEY
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme
  })
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    resolveTheme(theme)
  )

  useEffect(() => {
    const root = document.documentElement
    const resolved = resolveTheme(theme)
    setResolvedTheme(resolved)

    root.classList.remove('light', 'dark')
    root.classList.add(resolved)
  }, [theme])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        const resolved = getSystemTheme()
        setResolvedTheme(resolved)
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(resolved)
      }
    }

    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [theme])

  const setTheme = (next: Theme) => {
    localStorage.setItem(storageKey, next)
    setThemeState(next)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
