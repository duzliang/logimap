import { memo } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { GitBranch, AlertTriangle } from 'lucide-react'
import type { LogicNodeData } from '@logimap/types'
import { cn } from '@logimap/ui'

type LogicNodeType = Node<LogicNodeData, 'logicNode'>

function NodeHandle({ type }: { type: 'source' | 'target' }) {
  return (
    <Handle
      type={type}
      position={type === 'source' ? Position.Bottom : Position.Top}
      className="!w-3 !h-3 !bg-[var(--color-text-tertiary)] !border-2 !border-[var(--color-bg-elevated)] hover:!bg-[var(--color-brand-default)] !transition-colors"
    />
  )
}

const statusStyles = {
  DRAFT: {
    card: 'bg-[var(--color-bg-elevated)] border-[var(--color-border-default)]',
    badge: 'bg-[var(--color-bg-sunken)] text-[var(--color-text-secondary)]',
    label: '草稿',
  },
  REVIEW: {
    card: 'bg-[var(--color-bg-elevated)] border-[var(--color-warning-border)]',
    badge: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]',
    label: '待审',
  },
  APPROVED: {
    card: 'bg-[var(--color-bg-elevated)] border-[var(--color-success-border)]',
    badge: 'bg-[var(--color-success-bg)] text-[var(--color-success-text)] yan-seal',
    label: '已确认',
  },
  DEPRECATED: {
    card: 'bg-[var(--color-bg-elevated)] border-[var(--color-error-border)] opacity-60',
    badge: 'bg-[var(--color-error-bg)] text-[var(--color-error-text)]',
    label: '已废弃',
  },
}

export const LogicNodeComponent = memo(({ data, selected }: NodeProps<LogicNodeType>) => {
  const status = data.status || 'DRAFT'
  const statusStyle = statusStyles[status] || statusStyles.DRAFT
  const highlighted = data.highlighted === true
  const dimmed = data.dimmed === true
  // 墨滴涟漪：影响分析结果按 BFS 图距（hop）逐层点亮，每跳延迟 120ms
  const impactHop = typeof data.impactHop === 'number' ? data.impactHop : undefined
  const rippling = highlighted && impactHop !== undefined

  const branchCount = data.branches?.length || 0
  const edgeCaseCount = data.edgeCases?.length || 0
  const hasCriticalEdgeCases = data.edgeCases?.some((e) => e.severity === 'critical')

  return (
    <div
      className={cn(
        // logimap-node：过渡节奏由 graph.css 统一（fog 走缓/落定，hover 走疾）
        "logimap-node w-[220px] bg-[var(--color-bg-elevated)] rounded-xl border shadow-node",
        "cursor-pointer select-none hover:shadow-node-hover",
        selected && "ring-2 ring-[var(--color-node-selected-ring)] shadow-node-selected",
        highlighted && "ring-2 ring-[var(--color-brand-default)] shadow-node-selected",
        dimmed && "is-dimmed",
        rippling && "is-rippling",
        statusStyle.card
      )}
      style={rippling ? { animationDelay: `${impactHop! * 120}ms` } : undefined}
    >
      <NodeHandle type="target" />

      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <span className="text-sm font-semibold text-[var(--color-text-primary)] leading-tight line-clamp-2 flex-1">
            {data.name || '未命名节点'}
          </span>
          <span
            className={cn(
              "flex-shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-md",
              statusStyle.badge,
            )}
          >
            {statusStyle.label}
          </span>
        </div>

        {data.summary && (
          <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 mb-2">
            {data.summary}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-[var(--color-text-tertiary)]">
          <span className="flex items-center gap-1">
            <GitBranch className="w-3 h-3" />
            {branchCount} 分支
          </span>
          <span className={cn(
            "flex items-center gap-1",
            hasCriticalEdgeCases && "text-[var(--color-error-icon)] font-medium"
          )}>
            <AlertTriangle className="w-3 h-3" />
            {edgeCaseCount} 边界
            {hasCriticalEdgeCases && (
              <span className="text-[var(--color-error-icon)]">!</span>
            )}
          </span>
        </div>
      </div>

      <NodeHandle type="source" />
    </div>
  )
})

LogicNodeComponent.displayName = 'LogicNodeComponent'