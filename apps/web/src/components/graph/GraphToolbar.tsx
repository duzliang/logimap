import { Button } from '@logimap/ui'
import { Plus, Layout, Maximize, Download, List } from 'lucide-react'

interface GraphToolbarProps {
  onCreateNode?: () => void
  onAutoLayout?: () => void
  onFitView?: () => void
  onExportImage?: () => void
  onToggleListView?: () => void
}

export function GraphToolbar({
  onCreateNode,
  onAutoLayout,
  onFitView,
  onExportImage,
  onToggleListView
}: GraphToolbarProps) {
  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
      <div className="flex items-center gap-2 bg-[var(--color-bg-elevated)] rounded-lg shadow-sm border border-[var(--color-border-default)] p-2">
        <Button variant="ghost" size="sm" onClick={onCreateNode}>
          <Plus className="w-4 h-4 mr-2" />
          新建节点
        </Button>
        <div className="w-px h-6 bg-[var(--color-border-default)] mx-2" />
        <Button variant="ghost" size="sm" onClick={onAutoLayout}>
          <Layout className="w-4 h-4 mr-2" />
          自动布局
        </Button>
        <Button variant="ghost" size="sm" onClick={onFitView}>
          <Maximize className="w-4 h-4 mr-2" />
          适应屏幕
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-[var(--color-bg-elevated)] rounded-lg shadow-sm border border-[var(--color-border-default)] p-2">
        <Button variant="ghost" size="sm" onClick={onExportImage}>
          <Download className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-[var(--color-border-default)] mx-2" />
        <Button variant="ghost" size="sm" onClick={onToggleListView}>
          <List className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
