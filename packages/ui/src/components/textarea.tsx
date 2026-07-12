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
          'border border-neutral-200',
          'bg-neutral-50',
          'px-3 py-2 text-sm text-neutral-900',
          'placeholder:text-neutral-400',
          // 焦点样式：聚焦即研墨 —— 与 Input 一致，切到 surface 白底 + 主色描边 + 光环
          'focus:outline-none',
          'focus:ring-2 focus:ring-violet-600 focus:ring-offset-0',
          'focus:border-violet-600 focus:bg-white',
          // 错误态「行内消解」：aria-invalid 驱动，朱砂描边 + 朱砂光环
          'aria-[invalid=true]:border-rose-500',
          'aria-[invalid=true]:focus:border-rose-500 aria-[invalid=true]:focus:ring-rose-500',
          // 禁用态「石」：与 Input 一致，语义/焦点色褪为石灰
          'disabled:cursor-not-allowed',
          'disabled:bg-neutral-100 disabled:text-neutral-400 disabled:border-neutral-200 disabled:placeholder:text-neutral-300',
          // 过渡动画：统一走「疾·落定」
          'transition-[background-color,border-color,box-shadow] duration-fast ease-settle',
          // 暗色模式
          'dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-100',
          'dark:placeholder:text-neutral-500',
          'dark:focus:ring-violet-400 dark:focus:border-violet-400 dark:focus:bg-neutral-800',
          'dark:aria-[invalid=true]:border-rose-500 dark:aria-[invalid=true]:focus:border-rose-500 dark:aria-[invalid=true]:focus:ring-rose-500',
          'dark:disabled:bg-neutral-800/60 dark:disabled:text-neutral-600 dark:disabled:border-neutral-800 dark:disabled:placeholder:text-neutral-600',
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
