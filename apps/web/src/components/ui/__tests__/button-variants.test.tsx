import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Button } from '@logimap/ui'

describe('Button 变体已迁移到语义 token（无裸 neutral 静息态）', () => {
  it('secondary 用 bg-control 而非 bg-neutral-100', () => {
    const { getByRole } = render(<Button variant="secondary">x</Button>)
    const cls = getByRole('button').className
    expect(cls).toContain('bg-control')
    expect(cls).not.toContain('bg-neutral-100')
  })

  it('outline 用 bg-elevated + surface-hover，无 bg-white', () => {
    const { getByRole } = render(<Button variant="outline">x</Button>)
    const cls = getByRole('button').className
    expect(cls).toContain('bg-[var(--color-bg-elevated)]')
    expect(cls).toContain('hover:bg-surface-hover')
    expect(cls).not.toContain('bg-white')
  })

  it('ghost 悬停走 surface-hover', () => {
    const { getByRole } = render(<Button variant="ghost">x</Button>)
    expect(getByRole('button').className).toContain('hover:bg-surface-hover')
  })

  it('link 用 text-brand token', () => {
    const { getByRole } = render(<Button variant="link">x</Button>)
    const cls = getByRole('button').className
    expect(cls).toContain('text-[var(--color-text-brand)]')
    expect(cls).not.toContain('text-violet-600')
  })
})
