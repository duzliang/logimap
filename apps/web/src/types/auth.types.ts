export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string | null
  emailNotifications?: boolean
  createdAt: string
}

export interface TeamSummary {
  id: string
  name: string
  slug: string
  description?: string | null
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
  joinedAt: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  email: string
  name: string
  password: string
  invitationToken?: string
}

export interface AuthResponse {
  token: string
  user: User
}
