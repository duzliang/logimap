import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../lib/utils.js'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  /** 加载中：显示旋针、置为 disabled + aria-busy，但保留变体本色（忙 ≠ 石） */
  loading?: boolean
}

// 禁用态「石」：语义色全部褪去；明暗由 token 统一切换
const disabledStyles = {
  default:
    'disabled:bg-control disabled:text-[var(--color-text-tertiary)]',
  secondary:
    'disabled:bg-control disabled:text-[var(--color-text-tertiary)]',
  outline:
    'disabled:bg-elevated disabled:text-[var(--color-text-tertiary)] disabled:border-[var(--color-border-default)]',
  ghost:
    'disabled:bg-transparent disabled:text-[var(--color-text-tertiary)]',
  destructive:
    'disabled:bg-control disabled:text-[var(--color-text-tertiary)]',
  link:
    'disabled:text-[var(--color-text-tertiary)] disabled:no-underline',
} as const

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'default', size = 'default', loading = false, disabled, children, ...props },
    ref
  ) => {
    return (
      <button
        className={cn(
          // 基础样式
          'inline-flex items-center justify-center gap-2 whitespace-nowrap',
          'rounded-lg text-sm font-medium',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2',
          // 统一状态层：hover 走「疾·落定」，按下如收笔轻按（scale 0.98）
          'transition-[color,background-color,border-color,box-shadow,transform] duration-fast ease-settle',
          'enabled:active:scale-[0.98] motion-reduce:active:scale-100',
          // 变体样式
          {
            // 主按钮：品牌
            'bg-[var(--color-brand-default)] text-[var(--color-text-inverse)] hover:bg-[var(--color-brand-hover)] active:bg-[var(--color-brand-active)]':
              variant === 'default',
            // 次要按钮：中性控件面
            'bg-control text-[var(--color-control-text)] hover:bg-control-hover active:bg-control-active':
              variant === 'secondary',
            // 描边按钮
            'bg-elevated text-[var(--color-control-text)] border border-[var(--color-border-default)] hover:bg-surface-hover hover:border-[var(--color-border-strong)]':
              variant === 'outline',
            // 幽灵按钮
            'text-[var(--color-text-secondary)] bg-transparent hover:bg-surface-hover hover:text-[var(--color-text-primary)]':
              variant === 'ghost',
            // 危险按钮：rose 语义（明暗同值），白字走 inverse
            'bg-rose-500 text-[var(--color-text-inverse)] hover:bg-rose-600 active:bg-rose-700 focus-visible:ring-rose-500':
              variant === 'destructive',
            // 链接按钮
            'text-[var(--color-text-brand)] underline-offset-4 hover:underline':
              variant === 'link',
          },
          // 禁用态：不可点必须一眼可辨——hover 由 enabled: 前缀隔离，光标给出「不可」反馈
          loading
            ? 'cursor-wait disabled:opacity-90'
            : cn('disabled:cursor-not-allowed disabled:shadow-none', disabledStyles[variant]),
          // 尺寸样式
          {
            'h-9 px-4': size === 'default',
            'h-8 px-3 text-xs': size === 'sm',
            'h-10 px-6': size === 'lg',
            'h-9 w-9 p-0': size === 'icon',
          },
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <Loader2 aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }
