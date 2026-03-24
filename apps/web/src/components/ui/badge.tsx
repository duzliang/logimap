import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'draft' | 'review' | 'approved' | 'deprecated'
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    // 根据 variant 确定样式
    const variantStyles = {
      default: 'bg-violet-100 text-violet-700',
      secondary: 'bg-neutral-100 text-neutral-600',
      outline: 'bg-transparent border border-neutral-200 text-neutral-600',
      destructive: 'bg-rose-100 text-rose-700',
      draft: 'bg-neutral-100 text-neutral-600',
      review: 'bg-amber-50 text-amber-800',
      approved: 'bg-emerald-50 text-emerald-800',
      deprecated: 'bg-rose-50 text-rose-800',
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