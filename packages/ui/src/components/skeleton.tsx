import * as React from 'react'
import { cn } from '../lib/utils.js'

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>

/**
 * Skeleton —— 呼吸骨架。
 * 用内凹 muted 底 + 呼吸动画（非扫光 shimmer），形状忠实于最终内容轮廓，减少布局跳动。
 * reduced-motion 下呼吸自动停息（animate-breathe 引用的时长 token 已归零，静态占位）。
 */
const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn(
          'rounded-md bg-[var(--color-bg-sunken)]',
          'motion-safe:animate-breathe',
          className
        )}
        {...props}
      />
    )
  }
)
Skeleton.displayName = 'Skeleton'

export { Skeleton }
