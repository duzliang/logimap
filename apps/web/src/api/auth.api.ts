import { apiClient } from './client'
import type { LoginInput, RegisterInput, AuthResponse, User } from '../types/auth.types'

export async function login(data: LoginInput): Promise<AuthResponse> {
  const response = await apiClient.post('/api/v1/auth/login', data)
  return response.data.data
}

export async function register(data: RegisterInput): Promise<AuthResponse> {
  const response = await apiClient.post('/api/v1/auth/register', data)
  return response.data.data
}

export async function fetchMe(): Promise<User> {
  const response = await apiClient.get('/api/v1/auth/me')
  return response.data.data
}

export async function logout(): Promise<void> {
  await apiClient.post('/api/v1/auth/logout')
}
