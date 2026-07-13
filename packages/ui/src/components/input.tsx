import * as React from 'react'
import { cn } from '../lib/utils.js'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // 基础样式
          'flex h-9 w-full rounded-lg',
          'border border-[var(--color-border-default)]',
          'bg-input',                                // 内凹背景
          'px-3 py-2 text-sm text-[var(--color-text-primary)]',
          'placeholder:text-[var(--color-text-tertiary)]',
          // 焦点样式：聚焦即研墨 —— 由内凹底切到 surface 白底 + 主色描边 + 光环
          'focus:outline-none',
          'focus:ring-2 focus:ring-[var(--color-border-focus)] focus:ring-offset-0',
          'focus:border-[var(--color-border-focus)] focus:bg-input-focus',
          // 错误态「行内消解」：aria-invalid 驱动，朱砂描边 + 朱砂光环
          'aria-[invalid=true]:border-[var(--color-border-error)]',
          'aria-[invalid=true]:focus:border-[var(--color-border-error)] aria-[invalid=true]:focus:ring-rose-500',
          // 禁用态「石」：语义/焦点色全部褪为石灰
          'disabled:cursor-not-allowed',
          'disabled:bg-control disabled:text-[var(--color-text-tertiary)] disabled:border-[var(--color-border-default)] disabled:placeholder:text-[var(--color-text-disabled)]',
          // 过渡动画：统一走「疾·落定」
          'transition-[background-color,border-color,box-shadow] duration-fast ease-settle',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
