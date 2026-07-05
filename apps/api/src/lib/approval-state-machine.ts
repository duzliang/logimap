import { LogicNodeStatus, TeamRole, ApprovalAction } from '@logimap/types'
import { hasRole } from './rbac.js'

export class InvalidTransitionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidTransitionError'
  }
}

interface Transition {
  from: LogicNodeStatus
  action: ApprovalAction
  to: LogicNodeStatus
  minRole: TeamRole
}

const transitions: Transition[] = [
  { from: 'DRAFT', action: 'SUBMIT', to: 'REVIEW', minRole: 'MEMBER' },
  { from: 'REVIEW', action: 'APPROVE', to: 'APPROVED', minRole: 'ADMIN' },
  { from: 'REVIEW', action: 'REJECT', to: 'DRAFT', minRole: 'ADMIN' },
  { from: 'APPROVED', action: 'DEPRECATE', to: 'DEPRECATED', minRole: 'ADMIN' },
  { from: 'APPROVED', action: 'REVOKE', to: 'DRAFT', minRole: 'ADMIN' }
]

export function getNextStatus(
  from: LogicNodeStatus,
  action: ApprovalAction,
  role: TeamRole
): LogicNodeStatus {
  const transition = transitions.find((t) => t.from === from && t.action === action)

  if (!transition) {
    throw new InvalidTransitionError(`无法从 ${from} 执行 ${action}`)
  }

  if (!hasRole(role, transition.minRole)) {
    throw new InvalidTransitionError(`当前角色 ${role} 无权执行 ${action}`)
  }

  return transition.to
}

export function isValidTransition(
  from: LogicNodeStatus,
  action: ApprovalAction,
  role: TeamRole
): boolean {
  try {
    getNextStatus(from, action, role)
    return true
  } catch {
    return false
  }
}
