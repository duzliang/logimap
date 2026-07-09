import type { TranslationKey } from '@/i18n'
import type { TeamRole } from '@logimap/types'

type Vars = Record<string, string | number>
type T = (key: TranslationKey, vars?: Vars) => string

const NODE_STATUS_KEY: Record<string, TranslationKey> = {
  DRAFT: 'node.statusDraft',
  REVIEW: 'node.statusReview',
  APPROVED: 'node.statusApproved',
  DEPRECATED: 'node.statusDeprecated'
}

const PRIORITY_KEY: Record<string, TranslationKey> = {
  HIGH: 'node.priorityHigh',
  NORMAL: 'node.priorityNormal',
  LOW: 'node.priorityLow'
}

const PRIORITY_LONG_KEY: Record<string, TranslationKey> = {
  HIGH: 'node.priorityHighLong',
  NORMAL: 'node.priorityNormalLong',
  LOW: 'node.priorityLowLong'
}

const ROLE_KEY: Record<TeamRole, TranslationKey> = {
  OWNER: 'role.owner',
  ADMIN: 'role.admin',
  MEMBER: 'role.member',
  VIEWER: 'role.viewer'
}

/** 节点状态本地化标签；未知状态回退到原始值。 */
export function nodeStatusLabel(t: T, status: string): string {
  const key = NODE_STATUS_KEY[status]
  return key ? t(key) : status
}

/** 节点优先级短标签（高/中/低）。 */
export function priorityLabel(t: T, priority: string): string {
  const key = PRIORITY_KEY[priority]
  return key ? t(key) : priority
}

/** 节点优先级长标签（高优先级/普通/低优先级）。 */
export function priorityLongLabel(t: T, priority: string): string {
  const key = PRIORITY_LONG_KEY[priority]
  return key ? t(key) : priority
}

/** 团队角色本地化标签。 */
export function roleLabel(t: T, role: TeamRole): string {
  return t(ROLE_KEY[role])
}
