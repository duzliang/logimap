import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Textarea } from '@logimap/ui'
import { toast } from 'sonner'
import { performApprovalAction } from '@/api/approval.api'
import type { LogicNode } from '@/types/logic-node.types'
import type { TeamRole, ApprovalAction } from '@logimap/types'
import { hasRole } from '@/lib/rbac'

const destructiveActions: ApprovalAction[] = ['REJECT', 'DEPRECATE', 'REVOKE']

interface ApprovalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: ApprovalAction
  nodeName: string
  onConfirm: (comment: string) => void
  isPending: boolean
}

const actionTitles: Record<ApprovalAction, string> = {
  SUBMIT: '提交评审',
  APPROVE: '通过',
  REJECT: '退回修改',
  DEPRECATE: '废弃',
  REVOKE: '撤销确认'
}

function ApprovalDialog({ open, onOpenChange, action, nodeName, onConfirm, isPending }: ApprovalDialogProps) {
  const [comment, setComment] = useState('')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{actionTitles[action]} · {nodeName}</DialogTitle>
          <DialogDescription>
            {action === 'SUBMIT' && '提交后将进入评审状态，等待管理员审批。'}
            {action === 'APPROVE' && '通过后节点将变为已确认状态。'}
            {action === 'REJECT' && '退回后节点将回到草稿状态。'}
            {action === 'DEPRECATE' && '废弃后节点将不再生效。'}
            {action === 'REVOKE' && '撤销确认后节点将回到草稿状态。'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="可选：添加备注说明"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>取消</Button>
          <Button
            variant={destructiveActions.includes(action) ? 'destructive' : 'default'}
            onClick={() => onConfirm(comment)}
            disabled={isPending}
          >
            {isPending ? '处理中...' : actionTitles[action]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface NodeApprovalActionsProps {
  node: Pick<LogicNode, 'id' | 'name' | 'status'>
  userRole: TeamRole
  onStatusChange?: () => void
  size?: 'default' | 'sm'
}

export function NodeApprovalActions({ node, userRole, onStatusChange, size = 'default' }: NodeApprovalActionsProps) {
  const queryClient = useQueryClient()
  const [pendingAction, setPendingAction] = useState<ApprovalAction | null>(null)

  const mutation = useMutation({
    mutationFn: ({ action, comment }: { action: ApprovalAction; comment?: string }) =>
      performApprovalAction(node.id, { action, comment }),
    onSuccess: () => {
      toast.success('审批操作成功')
      queryClient.invalidateQueries({ queryKey: ['logicNodes'] })
      queryClient.invalidateQueries({ queryKey: ['logicNode', node.id] })
      setPendingAction(null)
      onStatusChange?.()
    },
    onError: (error: Error) => {
      toast.error(error.message || '审批操作失败')
    }
  })

  const isAdmin = hasRole(userRole, 'ADMIN')
  const isMemberPlus = hasRole(userRole, 'MEMBER')

  const actions: ApprovalAction[] = []

  if (node.status === 'DRAFT' && isMemberPlus) {
    actions.push('SUBMIT')
  }

  if (node.status === 'REVIEW' && isAdmin) {
    actions.push('APPROVE', 'REJECT')
  }

  if (node.status === 'APPROVED' && isAdmin) {
    actions.push('REVOKE', 'DEPRECATE')
  }

  if (actions.length === 0) {
    return null
  }

  const buttonSize = size === 'sm' ? 'sm' : 'default'

  return (
    <div className="flex items-center gap-2">
      {actions.map((action) => (
        <Button
          key={action}
          size={buttonSize}
          variant={destructiveActions.includes(action) ? 'outline' : 'default'}
          onClick={() => setPendingAction(action)}
          disabled={mutation.isPending}
        >
          {actionTitles[action]}
        </Button>
      ))}

      {pendingAction && (
        <ApprovalDialog
          open={!!pendingAction}
          onOpenChange={(open) => !open && setPendingAction(null)}
          action={pendingAction}
          nodeName={node.name}
          isPending={mutation.isPending}
          onConfirm={(comment) => mutation.mutate({ action: pendingAction, comment })}
        />
      )}
    </div>
  )
}
