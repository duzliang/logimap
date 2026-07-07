import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@logimap/ui'
import { ImpactAnalysisPanel } from './ImpactAnalysisPanel'
import { WhatIfPanel } from './WhatIfPanel'
import type { ImpactScope } from '@logimap/types'

interface ImpactAnalysisDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nodeId: string
  moduleId: string
  nodeName: string
  moduleNodes: Array<{ id: string; name: string }>
  onScopeChange?: (scope: ImpactScope | null) => void
}

type Tab = 'impact' | 'whatif'

export function ImpactAnalysisDialog({
  open,
  onOpenChange,
  nodeId,
  moduleId,
  nodeName,
  moduleNodes,
  onScopeChange
}: ImpactAnalysisDialogProps) {
  const [tab, setTab] = useState<Tab>('impact')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>影响分析：{nodeName}</DialogTitle>
        </DialogHeader>

        <div className="flex rounded-lg border border-[var(--color-border-default)] p-1 bg-[var(--color-bg-elevated)] mt-4">
          <button
            type="button"
            onClick={() => setTab('impact')}
            className={`flex-1 px-2 py-1.5 text-sm rounded-md transition-colors ${
              tab === 'impact'
                ? 'bg-[var(--color-brand-default)] text-white'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-sunken)]'
            }`}
          >
            影响范围
          </button>
          <button
            type="button"
            onClick={() => setTab('whatif')}
            className={`flex-1 px-2 py-1.5 text-sm rounded-md transition-colors ${
              tab === 'whatif'
                ? 'bg-[var(--color-brand-default)] text-white'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-sunken)]'
            }`}
          >
            假设分析
          </button>
        </div>

        <div className="mt-4">
          {tab === 'impact' ? (
            <ImpactAnalysisPanel nodeId={nodeId} moduleId={moduleId} nodeName={nodeName} />
          ) : (
            <WhatIfPanel nodeId={nodeId} moduleNodes={moduleNodes} onScopeChange={onScopeChange} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
