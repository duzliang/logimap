export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string | null
  createdAt: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  email: string
  name: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}
