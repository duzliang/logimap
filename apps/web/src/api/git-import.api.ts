import { apiClient } from './client'
import type { AnalyzeRepoResult, ApplyImportInput, SuggestedSystem } from '@logimap/types'

export async function analyzeRepo(input: { teamId: string; repoUrl: string; branch?: string }): Promise<AnalyzeRepoResult> {
  const response = await apiClient.post('/api/v1/git-import/analyze', input)
  return response.data.data
}

export interface ApplyImportResult {
  systems: Array<{ id: string; name: string; slug: string; modulesCreated: number }>
}

export async function applyImport(input: ApplyImportInput): Promise<ApplyImportResult> {
  const response = await apiClient.post('/api/v1/git-import/apply', input)
  return response.data.data
}

export type { SuggestedSystem }
