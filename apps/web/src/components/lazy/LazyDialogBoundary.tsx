import { Suspense, type ReactNode } from 'react'
import { Skeleton } from '@logimap/ui'

interface LazyDialogBoundaryProps {
  children: ReactNode
  title: string
  description?: string
}

function DialogSkeleton() {
  return (
    <div className="space-y-4 py-2">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <div className="space-y-2">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}

export function LazyDialogBoundary({ children, title, description }: LazyDialogBoundaryProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2>
            {description && <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>}
          </div>
          <DialogSkeleton />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}
