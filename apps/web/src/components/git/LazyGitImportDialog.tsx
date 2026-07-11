import { lazy } from 'react'
import type { ComponentProps } from 'react'
import { LazyDialogBoundary } from '@/components/lazy/LazyDialogBoundary'

const GitImportDialog = lazy(() =>
  import('../git/GitImportDialog').then((m) => ({ default: m.GitImportDialog }))
)

export function LazyGitImportDialog(props: ComponentProps<typeof GitImportDialog>) {
  return (
    <LazyDialogBoundary title="Git 仓库导入" description="分析目录结构并建议系统/模块">
      <GitImportDialog {...props} />
    </LazyDialogBoundary>
  )
}
