import { describe, it, expect } from 'vitest'
import { diffNodes } from './node-diff.js'

describe('node-diff', () => {
  it('returns unchanged for identical nodes', () => {
    const node = {
      name: 'test',
      summary: 'summary',
      status: 'DRAFT',
      priority: 'NORMAL',
      trigger: null,
      dependsOn: null,
      mainFlow: null,
      branches: [],
      edgeCases: [],
      codeRef: null,
      tags: [],
      notes: null,
      positionX: 0,
      positionY: 0
    }

    const diffs = diffNodes(node, node)
    expect(diffs.every((d) => d.kind === 'unchanged')).toBe(true)
  })

  it('detects changed scalar fields', () => {
    const base = { name: 'old', summary: null, status: 'DRAFT', priority: 'NORMAL', trigger: null, dependsOn: null, mainFlow: null, branches: [], edgeCases: [], codeRef: null, tags: [], notes: null, positionX: 0, positionY: 0 }
    const target = { ...base, name: 'new', status: 'REVIEW' }

    const diffs = diffNodes(base, target)
    const nameDiff = diffs.find((d) => d.field === 'name')
    const statusDiff = diffs.find((d) => d.field === 'status')

    expect(nameDiff?.kind).toBe('changed')
    expect(nameDiff?.oldValue).toBe('old')
    expect(nameDiff?.newValue).toBe('new')

    expect(statusDiff?.kind).toBe('changed')
    expect(statusDiff?.oldValue).toBe('DRAFT')
    expect(statusDiff?.newValue).toBe('REVIEW')
  })

  it('detects added and removed array fields', () => {
    const base = { name: 'n', summary: null, status: 'DRAFT', priority: 'NORMAL', trigger: null, dependsOn: null, mainFlow: null, branches: [], edgeCases: [], codeRef: null, tags: [], notes: null, positionX: 0, positionY: 0 }
    const target = {
      ...base,
      branches: [{ condition: 'c', action: 'a' }],
      tags: ['tag1']
    }

    const diffs = diffNodes(base, target)
    expect(diffs.find((d) => d.field === 'branches')?.kind).toBe('added')
    expect(diffs.find((d) => d.field === 'tags')?.kind).toBe('added')

    const reversed = diffNodes(target, base)
    expect(reversed.find((d) => d.field === 'branches')?.kind).toBe('removed')
    expect(reversed.find((d) => d.field === 'tags')?.kind).toBe('removed')
  })

  it('treats null and empty arrays as equal', () => {
    const base = { name: 'n', summary: null, status: 'DRAFT', priority: 'NORMAL', trigger: null, dependsOn: null, mainFlow: null, branches: null, edgeCases: [], codeRef: null, tags: [], notes: null, positionX: 0, positionY: 0 }
    const target = { ...base, branches: [], edgeCases: null }

    const diffs = diffNodes(base, target)
    expect(diffs.find((d) => d.field === 'branches')?.kind).toBe('unchanged')
    expect(diffs.find((d) => d.field === 'edgeCases')?.kind).toBe('unchanged')
  })
})
