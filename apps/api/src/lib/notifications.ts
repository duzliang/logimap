import type { NotificationType, NotificationPayload, CreateNotificationInput } from '@logimap/types'

interface BuildNodeNotificationParams {
  type: NotificationType
  userId: string
  actorId: string | undefined
  node: { id: string; name: string; moduleId: string }
  teamId: string
  payload?: NotificationPayload
}

export function buildNodeStatusNotification({
  userId,
  actorId,
  node,
  teamId,
  fromStatus,
  toStatus,
  actorName
}: {
  userId: string
  actorId: string | undefined
  node: { id: string; name: string; moduleId: string }
  teamId: string
  fromStatus: string
  toStatus: string
  actorName?: string
}): CreateNotificationInput {
  const title = `节点状态变更：${node.name}`
  const body = `${actorName || '有成员'}将节点「${node.name}」从 ${fromStatus} 更新为 ${toStatus}`

  return {
    type: 'NODE_STATUS_CHANGED',
    userId,
    actorId,
    teamId,
    nodeId: node.id,
    moduleId: node.moduleId,
    title,
    body,
    payload: { nodeName: node.name, fromStatus, toStatus, actorName }
  }
}

export function buildReviewApprovedNotification({
  userId,
  actorId,
  node,
  teamId,
  actorName
}: {
  userId: string
  actorId: string | undefined
  node: { id: string; name: string; moduleId: string }
  teamId: string
  actorName?: string
}): CreateNotificationInput {
  return {
    type: 'NODE_REVIEW_APPROVED',
    userId,
    actorId,
    teamId,
    nodeId: node.id,
    moduleId: node.moduleId,
    title: `节点已通过评审：${node.name}`,
    body: `${actorName || '有成员'}通过了节点「${node.name}」的评审`,
    payload: { nodeName: node.name, toStatus: 'APPROVED', actorName }
  }
}

export function buildReviewRejectedNotification({
  userId,
  actorId,
  node,
  teamId,
  actorName,
  comment
}: {
  userId: string
  actorId: string | undefined
  node: { id: string; name: string; moduleId: string }
  teamId: string
  actorName?: string
  comment?: string
}): CreateNotificationInput {
  return {
    type: 'NODE_REVIEW_REJECTED',
    userId,
    actorId,
    teamId,
    nodeId: node.id,
    moduleId: node.moduleId,
    title: `节点被退回：${node.name}`,
    body: `${actorName || '有成员'}退回了节点「${node.name}」${comment ? `：${comment}` : ''}`,
    payload: { nodeName: node.name, toStatus: 'DRAFT', actorName }
  }
}

export function buildNodeDeprecatedNotification({
  userId,
  actorId,
  node,
  teamId,
  actorName
}: {
  userId: string
  actorId: string | undefined
  node: { id: string; name: string; moduleId: string }
  teamId: string
  actorName?: string
}): CreateNotificationInput {
  return {
    type: 'NODE_DEPRECATED',
    userId,
    actorId,
    teamId,
    nodeId: node.id,
    moduleId: node.moduleId,
    title: `节点已废弃：${node.name}`,
    body: `${actorName || '有成员'}将节点「${node.name}」标记为废弃`,
    payload: { nodeName: node.name, toStatus: 'DEPRECATED', actorName }
  }
}

export function buildMentionNotification({
  userId,
  actorId,
  node,
  teamId,
  actorName
}: {
  userId: string
  actorId: string | undefined
  node: { id: string; name: string; moduleId: string }
  teamId: string
  actorName?: string
}): CreateNotificationInput {
  return {
    type: 'MENTIONED_IN_NODE',
    userId,
    actorId,
    teamId,
    nodeId: node.id,
    moduleId: node.moduleId,
    title: `有人在节点中提到了你：${node.name}`,
    body: `${actorName || '有成员'}在节点「${node.name}」的备注或主流程中提到了你`,
    payload: { nodeName: node.name, actorName }
  }
}

export function buildTeamInvitationNotification({
  userId,
  actorId,
  team,
  role,
  actorName
}: {
  userId: string
  actorId: string | undefined
  team: { id: string; name: string }
  role: string
  actorName?: string
}): CreateNotificationInput {
  return {
    type: 'TEAM_INVITATION_RECEIVED',
    userId,
    actorId,
    teamId: team.id,
    title: `团队邀请：${team.name}`,
    body: `${actorName || '有成员'}邀请你加入团队「${team.name}」，角色为 ${role}`,
    payload: { teamName: team.name, role, actorName }
  }
}

export function buildInvitationAcceptedNotification({
  userId,
  actorId,
  team,
  actorName
}: {
  userId: string
  actorId: string | undefined
  team: { id: string; name: string }
  actorName?: string
}): CreateNotificationInput {
  return {
    type: 'TEAM_INVITATION_ACCEPTED',
    userId,
    actorId,
    teamId: team.id,
    title: `邀请已被接受：${team.name}`,
    body: `${actorName || '有成员'}已接受加入团队「${team.name}」`,
    payload: { teamName: team.name, actorName }
  }
}

export function buildRoleChangedNotification({
  userId,
  actorId,
  team,
  role,
  actorName
}: {
  userId: string
  actorId: string | undefined
  team: { id: string; name: string }
  role: string
  actorName?: string
}): CreateNotificationInput {
  return {
    type: 'TEAM_ROLE_CHANGED',
    userId,
    actorId,
    teamId: team.id,
    title: `团队角色变更：${team.name}`,
    body: `${actorName || '有成员'}将你的团队「${team.name}」角色调整为 ${role}`,
    payload: { teamName: team.name, role, actorName }
  }
}

const MENTION_PATTERN = /@([a-zA-Z0-9_\-\u4e00-\u9fa5]+)/g

export function extractMentionedNames(text: string): string[] {
  const matches = text.match(MENTION_PATTERN)
  if (!matches) return []
  return matches.map((m) => m.slice(1))
}
