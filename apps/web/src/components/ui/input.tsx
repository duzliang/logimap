import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // 基础样式
          'flex h-9 w-full rounded-lg',
          'border border-neutral-200',
          'bg-neutral-50',                           // 内凹背景
          'px-3 py-2 text-sm text-neutral-900',
          'placeholder:text-neutral-400',
          // 焦点样式
          'focus:outline-none',
          'focus:ring-2 focus:ring-violet-600 focus:ring-offset-0',
          'focus:border-violet-600',
          // 禁用样式
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // 过渡动画
          'transition-shadow duration-150',
          // 暗色模式
          'dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-100',
          'dark:placeholder:text-neutral-500',
          'dark:focus:ring-violet-400 dark:focus:border-violet-400',
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