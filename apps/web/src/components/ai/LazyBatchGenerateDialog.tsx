import { lazy } from 'react'
import type { ComponentProps } from 'react'
import { LazyDialogBoundary } from '@/components/lazy/LazyDialogBoundary'

const BatchGenerateDialog = lazy(() =>
  import('../ai/BatchGenerateDialog').then((m) => ({ default: m.BatchGenerateDialog }))
)

export function LazyBatchGenerateDialog(props: ComponentProps<typeof BatchGenerateDialog>) {
  return (
    <LazyDialogBoundary title="AI 批量生成" description="根据需求批量建议模块/节点结构">
      <BatchGenerateDialog {...props} />
    </LazyDialogBoundary>
  )
}
