import { lazy } from 'react'
import type { ComponentProps } from 'react'
import { LazyDialogBoundary } from '@/components/lazy/LazyDialogBoundary'

const VersionHistoryDialog = lazy(() =>
  import('../versions/VersionHistoryDialog').then((m) => ({ default: m.VersionHistoryDialog }))
)

export function LazyVersionHistoryDialog(props: ComponentProps<typeof VersionHistoryDialog>) {
  return (
    <LazyDialogBoundary title="版本历史" description="查看并恢复节点历史版本">
      <VersionHistoryDialog {...props} />
    </LazyDialogBoundary>
  )
}
