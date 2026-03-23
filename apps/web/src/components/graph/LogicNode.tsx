import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Badge } from '@/components/ui/badge'
import { FileText, AlertTriangle } from 'lucide-react'
import type { LogicNode } from '@/types/logic-node.types'

interface LogicNodeData {
  name: string
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

export const LogicNodeComponent = memo(({ data, selected }: LogicNodeProps) => {
  const statusConfig: Record<string, { label: string; color: string }> = {
    DRAFT: { label: '草稿', color: 'bg-gray-500' },
    REVIEW: { label: '待评审', color: 'bg-yellow-500' },
    APPROVED: { label: '已确认', color: 'bg-green-500' },
    DEPRECATED: { label: '已废弃', color: 'bg-red-500' }
  }

  const priorityConfig: Record<string, { label: string; color: string }> = {
    HIGH: { label: '高优先级', color: 'text-red-600' },
    NORMAL: { label: '普通', color: 'text-blue-600' },
    LOW: { label: '低优先级', color: 'text-gray-600' }
  }

  const nodeData = data as unknown as LogicNodeData

  const status = statusConfig[nodeData?.status] || { label: nodeData?.status || '未知', color: 'bg-gray-500' }
  const priority = priorityConfig[nodeData?.priority] || { label: '普通', color: 'text-gray-600' }

  const branchCount = nodeData?.branches?.length || 0
  const edgeCaseCount = nodeData?.edgeCases?.length || 0
  const criticalEdgeCases = nodeData?.edgeCases?.filter((e) => e.severity === 'critical').length || 0

  return (
    <div
      className={`
        w-[220px] bg-white rounded-lg border-2 shadow-sm hover:shadow-md transition-all
        ${selected ? 'border-blue-500' : 'border-gray-200'}
        ${nodeData?.className || ''}
      `}
    >
      {/* 输入 Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />

      {/* 节点头部 */}
      <div className="px-3 py-2 border-b bg-gray-50 rounded-t">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 flex-1">
            {nodeData?.name || '未命名节点'}
          </h3>
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0 ${status.color}`}
            title={status.label}
          />
        </div>
      </div>

      {/* 节点内容 */}
      <div className="px-3 py-2 space-y-2">
        {/* 状态和优先级 */}
        <div className="flex items-center gap-1 flex-wrap">
          <Badge variant="secondary" className="text-xs h-5">
            {status.label}
          </Badge>
          <span className={`text-xs ${priority.color}`}>{priority.label}</span>
        </div>

        {/* 分支和边界条件数量 */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            <span>分支：{branchCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle
              className={`w-3 h-3 ${criticalEdgeCases > 0 ? 'text-red-500' : ''}`}
            />
            <span className={criticalEdgeCases > 0 ? 'text-red-500 font-medium' : ''}>
              边界：{edgeCaseCount}
              {criticalEdgeCases > 0 && ` (${criticalEdgeCases})`}
            </span>
          </div>
        </div>

        {/* 最后更新时间 */}
        {nodeData?.updatedAt && (
          <p className="text-xs text-gray-400">
            更新于：{new Date(nodeData.updatedAt).toLocaleDateString('zh-CN')}
          </p>
        )}
      </div>

      {/* 输出 Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />
    </div>
  )
})

LogicNodeComponent.displayName = 'LogicNodeComponent'
