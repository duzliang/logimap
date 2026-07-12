import * as React from 'react'
import { cn } from '../lib/utils.js'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium text-neutral-700 leading-none',
        // 关联控件禁用时，标签随之褪为石灰（与「石」禁用态一致，不用 opacity）
        'peer-disabled:cursor-not-allowed peer-disabled:text-neutral-400',
        'dark:text-neutral-300 dark:peer-disabled:text-neutral-600',
        className
      )}
      {...props}
    />
  )
)
Label.displayName = 'Label'

export { Label }
