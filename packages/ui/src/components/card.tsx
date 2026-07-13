import * as React from 'react'
import { cn } from '../lib/utils.js'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'selected'
}

const Card = React.forwardRef<
  HTMLDivElement,
  CardProps
>(({ className, variant = 'default', ...props }, ref) => {
  const variantStyles = {
    default: '',
    interactive:
      'cursor-pointer hover:border-[var(--color-border-strong)] hover:shadow-panel transition-[border-color,box-shadow,transform] duration-fast ease-settle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2',
    // 选中态：用 border（非 border-2）避免 1px 宽度差跳动，靠 ring 强调
    selected:
      'border-[var(--color-brand-default)] ring-4 ring-[var(--color-brand-muted)]',
  }

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)]',
        'shadow-card',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
})
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-5', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight text-[var(--color-text-primary)]',
      className
    )}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      'text-sm text-[var(--color-text-secondary)]',
      className
    )}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-5 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-5 pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
