import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { GitBranch, AlertTriangle } from 'lucide-react'
import type { LogicNode } from '@/types/logic-node.types'
import { cn } from '@/lib/utils'

interface LogicNodeData {
  name: string
  summary?: string
  status: LogicNode['status']
  priority: LogicNode['priority']
  branches?: LogicNode['branches']
  edgeCases?: LogicNode['edgeCases']
  updatedAt?: string | null
  className?: string
}

interface LogicNodeProps {
  id: string
  data: LogicNodeData
  selected?: boolean
}

// 状态样式配置（按照 UI-SPEC.md Section 3.6）
const statusStyles = {
  DRAFT: {
    card: 'bg-white border-neutral-200',
    badge: 'bg-neutral-100 text-neutral-600',
    label: '草稿',
    dot: 'bg-neutral-400',
  },
  REVIEW: {
    card: 'bg-white border-amber-200',
    badge: 'bg-amber-50 text-amber-800',
    label: '待审',
    dot: 'bg-amber-500',
  },
  APPROVED: {
    card: 'bg-white border-emerald-200',
    badge: 'bg-emerald-50 text-emerald-800',
    label: '已确认',
    dot: 'bg-emerald-500',
  },
  DEPRECATED: {
    card: 'bg-white border-rose-200 opacity-60',
    badge: 'bg-rose-50 text-rose-800',
    label: '已废弃',
    dot: 'bg-rose-500',
  },
}

export const LogicNodeComponent = memo(({ data, selected }: LogicNodeProps) => {
  const nodeData = data as unknown as LogicNodeData

  const status = nodeData?.status || 'DRAFT'
  const statusStyle = statusStyles[status as keyof typeof statusStyles] || statusStyles.DRAFT

  const branchCount = nodeData?.branches?.length || 0
  const edgeCaseCount = nodeData?.edgeCases?.length || 0
  const hasCriticalEdgeCases = nodeData?.edgeCases?.some((e) => e.severity === 'critical')

  return (
    <div
      className={cn(
        // 基础样式
        "w-[220px] bg-white rounded-xl border shadow-node",
        "cursor-pointer select-none",
        "hover:shadow-node-hover transition-shadow duration-150",
        // 选中状态
        selected && "ring-2 ring-violet-600 shadow-node-selected",
        // 状态样式
        statusStyle.card,
        nodeData?.className
      )}
    >
      {/* 输入 Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-neutral-400 !border-2 !border-white hover:!bg-violet-500 !transition-colors"
      />

      <div className="p-3">
        {/* 标题行 */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <span className="text-sm font-semibold text-neutral-900 leading-tight line-clamp-2 flex-1">
            {nodeData?.name || '未命名节点'}
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

        {/* 摘要 */}
        {nodeData?.summary && (
          <p className="text-xs text-neutral-500 line-clamp-2 mb-2">
            {nodeData.summary}
          </p>
        )}

        {/* 底部信息 */}
        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <span className="flex items-center gap-1">
            <GitBranch className="w-3 h-3" />
            {branchCount} 分支
          </span>
          <span className={cn(
            "flex items-center gap-1",
            hasCriticalEdgeCases && "text-rose-500 font-medium"
          )}>
            <AlertTriangle className="w-3 h-3" />
            {edgeCaseCount} 边界
            {hasCriticalEdgeCases && (
              <span className="text-rose-500">!</span>
            )}
          </span>
        </div>
      </div>

      {/* 输出 Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-neutral-400 !border-2 !border-white hover:!bg-violet-500 !transition-colors"
      />
    </div>
  )
})

LogicNodeComponent.displayName = 'LogicNodeComponent'