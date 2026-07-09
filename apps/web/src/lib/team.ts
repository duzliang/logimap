import type { TeamRole } from '@logimap/types'

// 角色本地化标签见 `@/lib/i18n-labels` 的 roleLabel(t, role)

export const roleBadgeVariant: Record<TeamRole, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  OWNER: 'default',
  ADMIN: 'secondary',
  MEMBER: 'outline',
  VIEWER: 'destructive'
}

export const teamRoles: TeamRole[] = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']
