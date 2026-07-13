import * as React from 'react'
import { cn } from '../lib/utils.js'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium text-[var(--color-text-secondary)] leading-none',
        // 关联控件禁用时，标签随之褪为石灰（与「石」禁用态一致，不用 opacity）
        'peer-disabled:cursor-not-allowed peer-disabled:text-[var(--color-text-tertiary)]',
        className
      )}
      {...props}
    />
  )
)
Label.displayName = 'Label'

export { Label }
