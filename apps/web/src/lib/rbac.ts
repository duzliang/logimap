import type { TeamRole } from '@logimap/types'

const roleRank: Record<TeamRole, number> = {
  VIEWER: 1,
  MEMBER: 2,
  ADMIN: 3,
  OWNER: 4
}

export function hasRole(role: TeamRole, minRole: TeamRole): boolean {
  return roleRank[role] >= roleRank[minRole]
}
