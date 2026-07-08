import { apiClient } from './client'
import type { ApiTokenSummary, ApiTokenCreated, CreateApiTokenInput } from '@logimap/types'

export async function fetchApiTokens(): Promise<ApiTokenSummary[]> {
  const response = await apiClient.get('/api/v1/tokens')
  return response.data.data
}

export async function createApiToken(input: CreateApiTokenInput): Promise<ApiTokenCreated> {
  const response = await apiClient.post('/api/v1/tokens', input)
  return response.data.data
}

export async function revokeApiToken(tokenId: string): Promise<void> {
  await apiClient.delete(`/api/v1/tokens/${tokenId}`)
}
