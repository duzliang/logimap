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

// 禁用态「石」：语义色全部褪去，形（石灰）/静（无响应）/指（cursor）三重信号
const disabledStyles = {
  default:
    'disabled:bg-neutral-100 disabled:text-neutral-400 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-600',
  secondary:
    'disabled:bg-neutral-100 disabled:text-neutral-400 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-600',
  outline:
    'disabled:bg-neutral-50 disabled:text-neutral-400 disabled:border-neutral-200 dark:disabled:bg-neutral-900 dark:disabled:text-neutral-600 dark:disabled:border-neutral-800',
  ghost:
    'disabled:bg-transparent disabled:text-neutral-400 dark:disabled:text-neutral-600',
  destructive:
    'disabled:bg-neutral-100 disabled:text-neutral-400 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-600',
  link:
    'disabled:text-neutral-400 disabled:no-underline dark:disabled:text-neutral-600',
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
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2',
          // 统一状态层：hover 走「疾·落定」，按下如收笔轻按（scale 0.98）
          'transition-[color,background-color,border-color,box-shadow,transform] duration-fast ease-settle',
          'enabled:active:scale-[0.98] motion-reduce:active:scale-100',
          // 变体样式
          {
            // 主按钮：品牌紫
            'bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800':
              variant === 'default',
            // 次要按钮：浅灰背景
            'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:bg-neutral-300':
              variant === 'secondary',
            // 描边按钮
            'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300':
              variant === 'outline',
            // 幽灵按钮
            'text-neutral-600 bg-transparent hover:bg-neutral-100 hover:text-neutral-900':
              variant === 'ghost',
            // 危险按钮
            'bg-rose-500 text-white hover:bg-rose-600 active:bg-rose-700 focus-visible:ring-rose-500':
              variant === 'destructive',
            // 链接按钮
            'text-violet-600 underline-offset-4 hover:underline':
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
