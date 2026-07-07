import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@logimap/ui'
import { Search } from 'lucide-react'

export function GlobalSearchInput() {
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = value.trim()
    if (!q) return
    navigate(`/search?q=${encodeURIComponent(q)}`)
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="hidden md:block relative w-56 lg:w-80">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
      <Input
        ref={inputRef}
        placeholder="搜索节点、模块、系统..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-9 pr-12 h-9 bg-[var(--color-bg-base)] border-[var(--color-border-default)] text-sm"
      />
      <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded border border-[var(--color-border-default)] text-[var(--color-text-tertiary)] hidden lg:block">
        ⌘K
      </kbd>
    </form>
  )
}
