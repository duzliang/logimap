import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          // 基础样式
          'inline-flex items-center justify-center gap-2 whitespace-nowrap',
          'rounded-lg text-sm font-medium',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'transition-colors duration-150',
          // 变体样式
          {
            // 主按钮：品牌紫
            'bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800':
              variant === 'default',
            // 次要按钮：浅灰背景
            'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:bg-neutral-300':
              variant === 'secondary',
            // 描边按钮
            'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300':
              variant === 'outline',
            // 幽灵按钮
            'text-neutral-600 bg-transparent hover:bg-neutral-100 hover:text-neutral-900':
              variant === 'ghost',
            // 危险按钮
            'bg-rose-500 text-white hover:bg-rose-600 active:bg-rose-700 focus-visible:ring-rose-500':
              variant === 'destructive',
            // 链接按钮
            'text-violet-600 underline-offset-4 hover:underline':
              variant === 'link',
          },
          // 尺寸样式
          {
            'h-9 px-4': size === 'default',
            'h-8 px-3 text-xs': size === 'sm',
            'h-10 px-6': size === 'lg',
            'h-9 w-9 p-0': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }