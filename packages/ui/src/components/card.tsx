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
      'cursor-pointer hover:border-neutral-300 hover:shadow-panel transition-[border-color,box-shadow,transform] duration-fast ease-settle dark:hover:border-neutral-600',
    selected:
      'border-2 border-violet-600 ring-4 ring-violet-100 dark:border-violet-500 dark:ring-violet-900/30',
  }

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-neutral-200 bg-white',
        'shadow-card',
        'dark:border-neutral-700 dark:bg-neutral-800',
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
      'text-lg font-semibold leading-none tracking-tight text-neutral-900',
      'dark:text-neutral-100',
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
      'text-sm text-neutral-500',
      'dark:text-neutral-400',
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
