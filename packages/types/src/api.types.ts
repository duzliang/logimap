// API 请求/响应类型

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  error: string
  code: string
  details?: Record<string, unknown>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// 认证相关类型
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  name: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  createdAt: string
}

// AI 相关类型
export interface ExtractRequest {
  moduleId: string
  content: string
  context?: string
}

export interface CheckEdgeCasesRequest {
  nodeId: string
}

export interface AnalyzeImpactRequest {
  nodeId: string
}
