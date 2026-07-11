import { lazy, Suspense } from 'react'
import { Button } from '@logimap/ui'
import { Download } from 'lucide-react'
import type { GraphExportFormat } from './GraphExportMenu'

const GraphExportMenu = lazy(() =>
  import('./GraphExportMenu').then((m) => ({ default: m.GraphExportMenu }))
)

function ExportFallback() {
  return (
    <Button variant="ghost" size="sm" disabled aria-label="导出">
      <Download className="w-4 h-4" />
    </Button>
  )
}

interface LazyGraphExportMenuProps {
  onExport: (format: GraphExportFormat) => void
}

export function LazyGraphExportMenu({ onExport }: LazyGraphExportMenuProps) {
  return (
    <Suspense fallback={<ExportFallback />}>
      <GraphExportMenu onExport={onExport} />
    </Suspense>
  )
}

export type { GraphExportFormat } from './GraphExportMenu'
