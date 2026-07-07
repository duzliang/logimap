import * as React from 'react'
import { cn } from '../lib/utils.js'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'brand' | 'info' | 'draft' | 'review' | 'approved' | 'deprecated'
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    // 根据 variant 确定样式
    const variantStyles = {
      default: 'bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-200',
      secondary: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
      outline: 'bg-transparent border border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300',
      destructive: 'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-200',
      brand: 'bg-violet-50 text-violet-800 border border-violet-200 dark:bg-violet-900/20 dark:text-violet-200 dark:border-violet-800',
      info: 'bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-900/20 dark:text-sky-200 dark:border-sky-800',
      draft: 'bg-neutral-100 text-neutral-700 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700',
      review: 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800',
      approved: 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-800',
      deprecated: 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-200 dark:border-rose-800',
    }

    return (
      <div
        ref={ref}
        className={cn(
          // 基础样式
          'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
          'transition-colors duration-150',
          // 变体样式
          variantStyles[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'

export { Badge }
