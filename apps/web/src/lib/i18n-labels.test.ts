import { describe, it, expect } from 'vitest'
import { translate } from '@/i18n/I18nProvider'
import { nodeStatusLabel, priorityLabel, priorityLongLabel, roleLabel } from './i18n-labels'

const zh = (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) =>
  translate('zh', key, vars)
const en = (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) =>
  translate('en', key, vars)

describe('i18n-labels', () => {
  it('localizes node status', () => {
    expect(nodeStatusLabel(zh, 'DRAFT')).toBe('草稿')
    expect(nodeStatusLabel(en, 'APPROVED')).toBe('Approved')
  })

  it('falls back to raw value for unknown status', () => {
    expect(nodeStatusLabel(zh, 'UNKNOWN')).toBe('UNKNOWN')
  })

  it('localizes priority short and long labels', () => {
    expect(priorityLabel(zh, 'HIGH')).toBe('高')
    expect(priorityLongLabel(zh, 'HIGH')).toBe('高优先级')
    expect(priorityLabel(en, 'NORMAL')).toBe('Medium')
    expect(priorityLongLabel(en, 'LOW')).toBe('Low priority')
  })

  it('localizes team roles', () => {
    expect(roleLabel(zh, 'OWNER')).toBe('所有者')
    expect(roleLabel(en, 'VIEWER')).toBe('Viewer')
  })
})
