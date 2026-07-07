import { apiClient } from './client'
import type { SearchResponse } from '@logimap/types'

export interface SearchParams {
  q?: string
  teamId?: string
  systemId?: string
  moduleId?: string
  type?: 'all' | 'system' | 'module' | 'node'
  statuses?: string[]
  priorities?: string[]
  tags?: string[]
  assigneeId?: string
  limit?: number
  offset?: number
}

export async function search(params: SearchParams): Promise<SearchResponse> {
  const searchParams = new URLSearchParams()

  if (params.q) searchParams.set('q', params.q)
  if (params.teamId) searchParams.set('teamId', params.teamId)
  if (params.systemId) searchParams.set('systemId', params.systemId)
  if (params.moduleId) searchParams.set('moduleId', params.moduleId)
  if (params.type && params.type !== 'all') searchParams.set('type', params.type)
  if (params.statuses?.length) searchParams.set('statuses', params.statuses.join(','))
  if (params.priorities?.length) searchParams.set('priorities', params.priorities.join(','))
  if (params.tags?.length) searchParams.set('tags', params.tags.join(','))
  if (params.assigneeId) searchParams.set('assigneeId', params.assigneeId)
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit))
  if (params.offset !== undefined) searchParams.set('offset', String(params.offset))

  const response = await apiClient.get(`/api/v1/search?${searchParams.toString()}`)
  return response.data.data as SearchResponse
}
