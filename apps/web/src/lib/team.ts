import type { TeamRole } from '@logimap/types'

export const roleLabels: Record<TeamRole, string> = {
  OWNER: '所有者',
  ADMIN: '管理员',
  MEMBER: '成员',
  VIEWER: '只读'
}

export const roleBadgeVariant: Record<TeamRole, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  OWNER: 'default',
  ADMIN: 'secondary',
  MEMBER: 'outline',
  VIEWER: 'destructive'
}

export const teamRoles: TeamRole[] = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']
