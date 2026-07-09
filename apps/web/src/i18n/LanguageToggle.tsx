import { Languages } from 'lucide-react'
import { Button } from '@logimap/ui'
import { useI18n } from './I18nProvider'

// 顶栏语言切换按钮：在 中文 / English 之间切换
export function LanguageToggle() {
  const { lang, setLang, t } = useI18n()

  const next = lang === 'zh' ? 'en' : 'zh'

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => setLang(next)}
      title={t('language.switchTo')}
      aria-label={t('language.switchTo')}
    >
      <Languages className="h-4 w-4" />
      <span className="text-xs font-medium">{lang === 'zh' ? '中' : 'EN'}</span>
    </Button>
  )
}

// 设置页用的分段选择器
export function LanguageSelect() {
  const { lang, setLang, t } = useI18n()

  const options: { value: 'zh' | 'en'; label: string }[] = [
    { value: 'zh', label: t('language.zh') },
    { value: 'en', label: t('language.en') }
  ]

  return (
    <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border-default)] p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setLang(opt.value)}
          className={`rounded px-3 py-1.5 text-sm transition-colors ${
            lang === opt.value
              ? 'bg-[var(--color-brand-subtle)] text-[var(--color-brand-default)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
