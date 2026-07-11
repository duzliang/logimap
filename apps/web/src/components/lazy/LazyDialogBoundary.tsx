import { Suspense, type ReactNode } from 'react'
import { DialogHeader, DialogTitle, DialogDescription, Skeleton } from '@logimap/ui'

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
        <>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <DialogSkeleton />
        </>
      }
    >
      {children}
    </Suspense>
  )
}
