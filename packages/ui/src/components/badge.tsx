import * as React from 'react'
import { cn } from '../lib/utils.js'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'brand' | 'info' | 'draft' | 'review' | 'approved' | 'deprecated'
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    // 根据 variant 确定样式
    const variantStyles = {
      default: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
      secondary: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
      outline: 'bg-transparent border border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300',
      destructive: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
      brand: 'bg-violet-50 text-violet-800 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
      info: 'bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800',
      draft: 'bg-neutral-100 text-neutral-700 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700',
      review: 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
      approved: 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
      deprecated: 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
    }

    // 节点生命周期状态：圆点 + 颜色 + 文字三重编码，色盲亦可辨（前注意加工）
    const statusVariants = ['draft', 'review', 'approved', 'deprecated']
    const hasDot = statusVariants.includes(variant)

    return (
      <div
        ref={ref}
        className={cn(
          // 基础样式
          'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium',
          'transition-colors duration-fast ease-settle',
          // 变体样式
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {hasDot && (
          <span
            aria-hidden="true"
            className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-80"
          />
        )}
        {children}
      </div>
    )
  }
)
Badge.displayName = 'Badge'

export { Badge }
