import '@testing-library/jest-dom'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VersionDiffView } from './VersionDiffView'
import type { NodeDiff } from '@/api/logicNodes.api'

describe('VersionDiffView', () => {
  it('renders diff fields with old and new values', () => {
    const diffs: NodeDiff[] = [
      { field: 'name', oldValue: 'Old', newValue: 'New', kind: 'changed' },
      { field: 'summary', oldValue: null, newValue: 'Added summary', kind: 'added' }
    ]

    render(<VersionDiffView diffs={diffs} />)

    expect(screen.getByText('name')).toBeInTheDocument()
    expect(screen.getByText('Old')).toBeInTheDocument()
    expect(screen.getByText('New')).toBeInTheDocument()
    expect(screen.getByText('summary')).toBeInTheDocument()
    expect(screen.getByText('Added summary')).toBeInTheDocument()
  })

  it('filters out unchanged diffs', () => {
    const diffs: NodeDiff[] = [
      { field: 'name', oldValue: 'Same', newValue: 'Same', kind: 'unchanged' },
      { field: 'status', oldValue: 'DRAFT', newValue: 'REVIEW', kind: 'changed' }
    ]

    render(<VersionDiffView diffs={diffs} />)

    expect(screen.queryByText('name')).not.toBeInTheDocument()
    expect(screen.getByText('status')).toBeInTheDocument()
  })

  it('shows empty state when all diffs are unchanged', () => {
    const diffs: NodeDiff[] = [
      { field: 'name', oldValue: 'Same', newValue: 'Same', kind: 'unchanged' }
    ]

    render(<VersionDiffView diffs={diffs} />)

    expect(screen.getByText('与当前版本没有差异')).toBeInTheDocument()
  })
})
