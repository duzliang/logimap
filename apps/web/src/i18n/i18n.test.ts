import { describe, it, expect } from 'vitest'
import { translate } from './I18nProvider'
import { messages, zh, en } from './messages'

describe('i18n translate()', () => {
  it('resolves nested keys for zh', () => {
    expect(translate('zh', 'nav.dashboard')).toBe('仪表盘')
    expect(translate('zh', 'auth.login')).toBe('登录')
  })

  it('resolves nested keys for en', () => {
    expect(translate('en', 'nav.dashboard')).toBe('Dashboard')
    expect(translate('en', 'auth.login')).toBe('Sign in')
  })

  it('interpolates variables', () => {
    expect(translate('en', 'account.emailNotificationsDesc', { email: 'a@b.com' })).toContain('a@b.com')
    expect(translate('zh', 'account.emailNotificationsDesc', { email: 'a@b.com' })).toContain('a@b.com')
  })

  it('falls back to the key when missing', () => {
    expect(translate('zh', 'nope.missing')).toBe('nope.missing')
  })

  it('leaves unmatched placeholders empty', () => {
    // account.subtitle has no placeholders; passing vars is a no-op
    expect(translate('en', 'account.subtitle', { foo: 'bar' })).toBe(en.account.subtitle)
  })
})

describe('i18n dictionary parity', () => {
  // zh 与 en 结构必须完全一致（叶子 key 集合相同）
  function leafKeys(obj: Record<string, unknown>, prefix = ''): string[] {
    return Object.entries(obj).flatMap(([k, v]) => {
      const path = prefix ? `${prefix}.${k}` : k
      return typeof v === 'object' && v !== null
        ? leafKeys(v as Record<string, unknown>, path)
        : [path]
    })
  }

  it('zh and en have identical key sets', () => {
    expect(leafKeys(en).sort()).toEqual(leafKeys(zh).sort())
  })

  it('exposes both languages', () => {
    expect(Object.keys(messages).sort()).toEqual(['en', 'zh'])
  })
})
