import { describe, it, expect } from 'vitest'
import { cn } from '@logimap/ui'

describe('cn utility', () => {
  it('merges class names and filters falsy values', () => {
    expect(cn('base', 'active', false && 'hidden', null, undefined)).toBe('base active')
  })

  it('handles single class name', () => {
    expect(cn('only')).toBe('only')
  })

  it('returns empty string for all falsy values', () => {
    expect(cn(false, null, undefined, '')).toBe('')
  })
})
