import { apiClient } from './client'
import type { CodeLinkResult } from '@logimap/types'

export async function fetchCodeLinks(params: {
  teamId: string
  path: string
  line?: number
}): Promise<CodeLinkResult> {
  const response = await apiClient.get('/api/v1/code-links', {
    params: {
      teamId: params.teamId,
      path: params.path,
      ...(params.line ? { line: params.line } : {})
    }
  })
  return response.data.data
}
