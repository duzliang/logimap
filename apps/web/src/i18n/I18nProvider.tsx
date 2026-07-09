import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { messages, type Lang, type Messages } from './messages'

// 递归推导所有叶子节点的点路径，作为 t() 的 key 类型，编译期捕获拼写错误。
type DotPaths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${DotPaths<T[K]>}`
}[keyof T & string]

export type TranslationKey = DotPaths<Messages>

type Vars = Record<string, string | number>

interface I18nContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey, vars?: Vars) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

const STORAGE_KEY = 'logimap-lang'

function getInitialLang(defaultLang: Lang): Lang {
  if (typeof window === 'undefined') return defaultLang
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'zh' || stored === 'en') return stored
  // 回退到浏览器语言
  const nav = window.navigator.language?.toLowerCase() ?? ''
  return nav.startsWith('zh') ? 'zh' : nav.startsWith('en') ? 'en' : defaultLang
}

function resolve(dict: Messages, key: string): string {
  const value = key.split('.').reduce<unknown>((obj, part) => {
    if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[part]
    return undefined
  }, dict)
  return typeof value === 'string' ? value : key
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, name) => {
    const v = vars[name]
    return v === undefined || v === null ? '' : String(v)
  })
}

export function translate(lang: Lang, key: string, vars?: Vars): string {
  return interpolate(resolve(messages[lang], key), vars)
}

interface I18nProviderProps {
  children: ReactNode
  defaultLang?: Lang
}

export function I18nProvider({ children, defaultLang = 'zh' }: I18nProviderProps) {
  const [lang, setLangState] = useState<Lang>(() => getInitialLang(defaultLang))

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
  }, [lang])

  const setLang = (next: Lang) => {
    localStorage.setItem(STORAGE_KEY, next)
    setLangState(next)
  }

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => translate(lang, key, vars)
    }),
    [lang]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider')
  return ctx
}

// 便捷 hook：直接拿到 t 函数
export function useTranslation() {
  return useI18n()
}
