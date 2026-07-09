import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Button, Badge } from '@logimap/ui'
import { Edit, FileText, AlertTriangle, Radar } from 'lucide-react'
import { NodeApprovalActions } from '@/components/approval/NodeApprovalActions'
import type { TeamRole, LogicNodeStatus, NodePriority } from '@logimap/types'

interface NodeDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nodeData: {
    id: string
    name: string
    trigger?: string
    dependsOn?: string
    mainFlow?: string
    branches?: Array<{ condition: string; action: string }>
    edgeCases?: Array<{ scenario: string; handling: string; severity: string }>
    status: LogicNodeStatus
    priority: NodePriority
    moduleId: string
  } | null
  userRole: TeamRole
  onEdit: () => void
  onStatusChange?: () => void
  onImpactAnalysis?: () => void
}

const statusConfig: Record<LogicNodeStatus, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: 'bg-[var(--color-text-secondary)]' },
  REVIEW: { label: '待评审', color: 'bg-[var(--color-warning-icon)]' },
  APPROVED: { label: '已确认', color: 'bg-[var(--color-success-icon)]' },
  DEPRECATED: { label: '已废弃', color: 'bg-[var(--color-error-icon)]' }
}

const priorityConfig: Record<NodePriority, { label: string; color: string }> = {
  HIGH: { label: '高优先级', color: 'text-[var(--color-error-text)]' },
  NORMAL: { label: '普通', color: 'text-[var(--color-text-brand)]' },
  LOW: { label: '低优先级', color: 'text-[var(--color-text-secondary)]' }
}

export function NodeDetailDialog({ open, onOpenChange, nodeData, userRole, onEdit, onStatusChange, onImpactAnalysis }: NodeDetailDialogProps) {
  if (!nodeData) return null

  const status = statusConfig[nodeData.status] || { label: nodeData.status, color: 'bg-[var(--color-text-secondary)]' }
  const priority = priorityConfig[nodeData.priority] || { label: '普通', color: 'text-[var(--color-text-secondary)]' }
  const branchCount = nodeData.branches?.length || 0
  const edgeCaseCount = nodeData.edgeCases?.length || 0
  const criticalEdgeCases = nodeData.edgeCases?.filter((e) => e.severity === 'critical').length || 0
  const canEdit = nodeData.status !== 'APPROVED'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {nodeData.name}
            <div className={`w-3 h-3 rounded-full ${status.color}`} title={status.label} />
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{status.label}</Badge>
              <span className={`text-sm ${priority.color}`}>{priority.label}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* 触发条件 */}
          {nodeData.trigger && (
            <div className="space-y-1">
              <h4 className="font-medium text-sm text-[var(--color-text-primary)]">触发条件</h4>
              <p className="text-sm text-[var(--color-text-secondary)] bg-[var(--color-bg-base)] p-3 rounded-md">{nodeData.trigger}</p>
            </div>
          )}

          {/* 前置依赖 */}
          {nodeData.dependsOn && (
            <div className="space-y-1">
              <h4 className="font-medium text-sm text-[var(--color-text-primary)]">前置依赖</h4>
              <p className="text-sm text-[var(--color-text-secondary)] bg-[var(--color-bg-base)] p-3 rounded-md">{nodeData.dependsOn}</p>
            </div>
          )}

          {/* 主流程 */}
          {nodeData.mainFlow && (
            <div className="space-y-1">
              <h4 className="font-medium text-sm text-[var(--color-text-primary)]">主流程</h4>
              <p className="text-sm text-[var(--color-text-secondary)] bg-[var(--color-bg-base)] p-3 rounded-md whitespace-pre-wrap">{nodeData.mainFlow}</p>
            </div>
          )}

          {/* 分支条件 */}
          {branchCount > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-[var(--color-text-primary)] flex items-center gap-1">
                <FileText className="w-4 h-4" />
                分支条件 ({branchCount})
              </h4>
              <div className="space-y-2">
                {nodeData.branches?.map((branch, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm bg-[var(--color-bg-base)] p-2 rounded">
                    <span className="text-[var(--color-text-secondary)]">如果</span>
                    <span className="font-medium">{branch.condition}</span>
                    <span className="text-[var(--color-text-tertiary)]">→</span>
                    <span>{branch.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 边界条件 */}
          {edgeCaseCount > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-[var(--color-text-primary)] flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                边界条件 ({edgeCaseCount}
                {criticalEdgeCases > 0 && <span className="text-[var(--color-error-icon)]">, {criticalEdgeCases} 严重</span>})
              </h4>
              <div className="space-y-2">
                {nodeData.edgeCases?.map((edgeCase, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-sm ${
                      edgeCase.severity === 'critical'
                        ? 'bg-[var(--color-error-bg)] border border-[var(--color-border-default)] border-[var(--color-error-border)]'
                        : edgeCase.severity === 'warning'
                        ? 'bg-[var(--color-warning-bg)] border border-[var(--color-border-default)] border-[var(--color-warning-border)]'
                        : 'bg-[var(--color-info-bg)] border border-[var(--color-border-default)] border-[var(--color-info-border)]'
                    }`}
                  >
                    <div className="font-medium">{edgeCase.scenario}</div>
                    <div className="text-[var(--color-text-secondary)] mt-1">处理：{edgeCase.handling}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center gap-2 mt-6 pt-4 border-t border-[var(--color-border-default)]">
          <NodeApprovalActions
            node={nodeData}
            userRole={userRole}
            size="sm"
            onStatusChange={onStatusChange}
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              关闭
            </Button>
            {onImpactAnalysis && (
              <Button variant="outline" onClick={onImpactAnalysis}>
                <Radar className="w-4 h-4 mr-2" />
                影响范围
              </Button>
            )}
            <Button onClick={onEdit} disabled={!canEdit}>
              <Edit className="w-4 h-4 mr-2" />
              编辑
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}