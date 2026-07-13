import * as React from 'react'
import { cn } from '../lib/utils.js'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          // 基础样式
          'flex min-h-[80px] w-full rounded-lg',
          'border border-[var(--color-border-default)]',
          'bg-input',
          'px-3 py-2 text-sm text-[var(--color-text-primary)]',
          'placeholder:text-[var(--color-text-tertiary)]',
          // 焦点样式：与 Input 一致
          'focus:outline-none',
          'focus:ring-2 focus:ring-[var(--color-border-focus)] focus:ring-offset-0',
          'focus:border-[var(--color-border-focus)] focus:bg-input-focus',
          // 错误态「行内消解」
          'aria-[invalid=true]:border-[var(--color-border-error)]',
          'aria-[invalid=true]:focus:border-[var(--color-border-error)] aria-[invalid=true]:focus:ring-rose-500',
          // 禁用态「石」
          'disabled:cursor-not-allowed',
          'disabled:bg-control disabled:text-[var(--color-text-tertiary)] disabled:border-[var(--color-border-default)] disabled:placeholder:text-[var(--color-text-disabled)]',
          // 过渡动画
          'transition-[background-color,border-color,box-shadow] duration-fast ease-settle',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
