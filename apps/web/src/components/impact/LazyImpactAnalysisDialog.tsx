import { lazy } from 'react'
import type { ComponentProps } from 'react'
import { LazyDialogBoundary } from '@/components/lazy/LazyDialogBoundary'

const ImpactAnalysisDialog = lazy(() =>
  import('../impact/ImpactAnalysisDialog').then((m) => ({ default: m.ImpactAnalysisDialog }))
)

export function LazyImpactAnalysisDialog(props: ComponentProps<typeof ImpactAnalysisDialog>) {
  return (
    <LazyDialogBoundary title="影响分析" description="查看节点影响范围与假设分析">
      <ImpactAnalysisDialog {...props} />
    </LazyDialogBoundary>
  )
}
