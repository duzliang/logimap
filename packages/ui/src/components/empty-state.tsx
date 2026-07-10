import * as React from 'react'
import { cn } from '../lib/utils.js'

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 卷轴题跋式引导语，用衬线呈现 —— 全产品唯一的衬线落点 */
  message: string
  /** 至多一枚 24px 线性图标（可选） */
  icon?: React.ReactNode
  /** 单一主操作（Hick 定律：空状态只给一条路） */
  action?: React.ReactNode
}

/**
 * EmptyState —— 留白即款待。
 * 中央窄栏、慷慨上下留白、衬线引导语、至多一个主操作。
 * 入场走「常·落定」（settle-in）。
 */
const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, message, icon, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'mx-auto flex max-w-[320px] flex-col items-center justify-center',
          'px-6 py-24 text-center',
          'motion-safe:animate-settle-in',
          className
        )}
        {...props}
      >
        {icon && (
          <div className="mb-5 text-[var(--color-text-tertiary)] [&_svg]:h-6 [&_svg]:w-6">
            {icon}
          </div>
        )}
        <p className="font-serif text-base leading-relaxed tracking-wide text-[var(--color-text-secondary)]">
          {message}
        </p>
        {action && <div className="mt-6">{action}</div>}
      </div>
    )
  }
)
EmptyState.displayName = 'EmptyState'

export { EmptyState }
