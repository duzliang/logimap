export type TeamRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'

export interface TeamMemberUser {
  id: string
  name: string
  email: string
  avatarUrl?: string | null
}

export interface TeamMember {
  id: string
  role: TeamRole
  joinedAt: string
  user: TeamMemberUser
}

export interface TeamInvitation {
  id: string
  email: string
  role: TeamRole
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED'
  token: string
  expiresAt: string
  createdAt: string
}

export interface Team {
  id: string
  name: string
  slug: string
  description?: string | null
  createdAt: string
  updatedAt: string
  currentUserRole: TeamRole
  members: TeamMember[]
  invitations: TeamInvitation[]
}

export interface CreateTeamInput {
  name: string
  slug: string
  description?: string
}

export interface UpdateTeamInput {
  name?: string
  slug?: string
  description?: string
}

export interface InviteMemberInput {
  email: string
  role: TeamRole
}

export interface UpdateMemberRoleInput {
  role: TeamRole
}
