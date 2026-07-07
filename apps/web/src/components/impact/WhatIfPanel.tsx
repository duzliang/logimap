import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { whatIfImpact } from '@/api/impact.api'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@logimap/ui'
import { Plus, X, Play } from 'lucide-react'
import { toast } from 'sonner'
import type { ImpactScope, ConnectionType, ImpactDirection } from '@logimap/types'

interface WhatIfPanelProps {
  nodeId: string
  moduleNodes: Array<{ id: string; name: string }>
  onScopeChange?: (scope: ImpactScope | null) => void
}

const directionOptions: { value: ImpactDirection; label: string }[] = [
  { value: 'downstream', label: '下游影响' },
  { value: 'upstream', label: '上游依赖' },
  { value: 'both', label: '双向' }
]

const connectionTypeOptions: { value: ConnectionType; label: string }[] = [
  { value: 'TRIGGERS', label: '触发' },
  { value: 'DEPENDS_ON', label: '依赖' },
  { value: 'BLOCKS', label: '阻断' },
  { value: 'EXTENDS', label: '扩展' }
]

export function WhatIfPanel({ nodeId, moduleNodes, onScopeChange }: WhatIfPanelProps) {
  const [direction, setDirection] = useState<ImpactDirection>('downstream')
  const [addConnections, setAddConnections] = useState<Array<{ sourceId: string; targetId: string; type: ConnectionType }>>([])
  const [scope, setScope] = useState<ImpactScope | null>(null)

  const whatIfMutation = useMutation({
    mutationFn: () =>
      whatIfImpact({
        nodeId,
        direction,
        maxDepth: 3,
        addConnections: addConnections.length > 0 ? addConnections : undefined
      }),
    onSuccess: (data) => {
      setScope(data)
      onScopeChange?.(data)
    },
    onError: (error: Error) => {
      toast.error(error.message || '假设分析失败')
    }
  })

  const addConnection = () => {
    setAddConnections([...addConnections, { sourceId: nodeId, targetId: '', type: 'TRIGGERS' }])
  }

  const updateConnection = (index: number, updates: Partial<typeof addConnections[0]>) => {
    const next = [...addConnections]
    next[index] = { ...next[index], ...updates }
    setAddConnections(next)
  }

  const removeConnection = (index: number) => {
    setAddConnections(addConnections.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">假设变更</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-text-secondary)]">方向</span>
            <div className="flex rounded-lg border border-[var(--color-border-default)] p-1 bg-[var(--color-bg-elevated)]">
              {directionOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDirection(option.value)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    direction === option.value
                      ? 'bg-[var(--color-brand-default)] text-white'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-sunken)]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {addConnections.map((conn, index) => (
              <div key={index} className="flex items-center gap-2">
                <select
                  value={conn.targetId}
                  onChange={(e) => updateConnection(index, { targetId: e.target.value })}
                  className="flex-1 h-9 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-2 text-sm"
                >
                  <option value="">选择目标节点</option>
                  {moduleNodes
                    .filter((n) => n.id !== nodeId)
                    .map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name}
                      </option>
                    ))}
                </select>

                <select
                  value={conn.type}
                  onChange={(e) => updateConnection(index, { type: e.target.value as ConnectionType })}
                  className="w-[100px] h-9 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-2 text-sm"
                >
                  {connectionTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <Button variant="ghost" size="icon" onClick={() => removeConnection(index)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={addConnection}>
            <Plus className="w-4 h-4 mr-2" />
            添加临时连接
          </Button>
        </CardContent>
      </Card>

      <Button
        onClick={() => whatIfMutation.mutate()}
        disabled={whatIfMutation.isPending}
        className="w-full"
      >
        {whatIfMutation.isPending ? (
          '分析中...'
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            预览影响范围
          </>
        )}
      </Button>

      {scope && (
        <Card className="bg-[var(--color-brand-subtle)] border-[var(--color-brand-muted)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">假设分析结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-semibold">{scope.direct.length}</div>
                <div className="text-xs text-[var(--color-text-secondary)]">直接影响</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{scope.indirect.length}</div>
                <div className="text-xs text-[var(--color-text-secondary)]">间接影响</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{scope.thirdLevel.length}</div>
                <div className="text-xs text-[var(--color-text-secondary)]">第三层</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
