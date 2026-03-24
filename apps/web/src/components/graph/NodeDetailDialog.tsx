import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, FileText, AlertTriangle } from 'lucide-react'

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
    status: string
    priority: string
  } | null
  onEdit: () => void
}

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

export function NodeDetailDialog({ open, onOpenChange, nodeData, onEdit }: NodeDetailDialogProps) {
  if (!nodeData) return null

  const status = statusConfig[nodeData.status] || { label: nodeData.status, color: 'bg-gray-500' }
  const priority = priorityConfig[nodeData.priority] || { label: '普通', color: 'text-gray-600' }
  const branchCount = nodeData.branches?.length || 0
  const edgeCaseCount = nodeData.edgeCases?.length || 0
  const criticalEdgeCases = nodeData.edgeCases?.filter((e) => e.severity === 'critical').length || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {nodeData.name}
            <div className={`w-3 h-3 rounded-full ${status.color}`} title={status.label} />
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Badge variant="secondary">{status.label}</Badge>
            <span className={`text-sm ${priority.color}`}>{priority.label}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* 触发条件 */}
          {nodeData.trigger && (
            <div className="space-y-1">
              <h4 className="font-medium text-sm text-gray-700">触发条件</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{nodeData.trigger}</p>
            </div>
          )}

          {/* 前置依赖 */}
          {nodeData.dependsOn && (
            <div className="space-y-1">
              <h4 className="font-medium text-sm text-gray-700">前置依赖</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{nodeData.dependsOn}</p>
            </div>
          )}

          {/* 主流程 */}
          {nodeData.mainFlow && (
            <div className="space-y-1">
              <h4 className="font-medium text-sm text-gray-700">主流程</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{nodeData.mainFlow}</p>
            </div>
          )}

          {/* 分支条件 */}
          {branchCount > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700 flex items-center gap-1">
                <FileText className="w-4 h-4" />
                分支条件 ({branchCount})
              </h4>
              <div className="space-y-2">
                {nodeData.branches?.map((branch, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                    <span className="text-gray-500">如果</span>
                    <span className="font-medium">{branch.condition}</span>
                    <span className="text-gray-400">→</span>
                    <span>{branch.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 边界条件 */}
          {edgeCaseCount > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                边界条件 ({edgeCaseCount}
                {criticalEdgeCases > 0 && <span className="text-red-500">, {criticalEdgeCases} 严重</span>})
              </h4>
              <div className="space-y-2">
                {nodeData.edgeCases?.map((edgeCase, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-sm ${
                      edgeCase.severity === 'critical'
                        ? 'bg-red-50 border border-red-200'
                        : edgeCase.severity === 'warning'
                        ? 'bg-yellow-50 border border-yellow-200'
                        : 'bg-blue-50 border border-blue-200'
                    }`}
                  >
                    <div className="font-medium">{edgeCase.scenario}</div>
                    <div className="text-gray-600 mt-1">处理：{edgeCase.handling}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          <Button onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            编辑
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}