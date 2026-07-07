import { apiClient } from './client'
import type {
  NaturalLanguageQueryInput,
  AiAnalyzeImpactInput,
  BatchGenerateInput,
  BatchGenerateResult,
  AgentContextExportInput,
  CheckConsistencyInput,
  ConsistencyResult
} from '@logimap/types'

export interface GeneratedNodeContent {
  trigger: string
  dependsOn: string
  mainFlow: string
  branches: Array<{ condition: string; action: string }>
  edgeCases: Array<{ scenario: string; handling: string; severity: 'critical' | 'warning' | 'info' }>
}

export interface NodeAnalysis {
  completeness: number
  suggestions: string[]
  missingEdgeCases: string[]
  recommendedBranches: string[]
}

export interface TestCase {
  name: string
  steps: string[]
  expected: string
}

export interface GeneratedTestCases {
  normalCases: TestCase[]
  edgeCases: TestCase[]
  branchCases: Array<TestCase & { condition: string }>
}

export interface NlQueryResponse {
  answer: string
  sourceNodeIds: string[]
  sources: Array<{
    id: string
    name: string
    summary: string | null
    status: string
    moduleId: string
    module: { name: string; systemId: string }
  }>
}

export interface AiImpactAnalysisResponse {
  structural: {
    startNodeId: string
    direction: string
    maxDepth: number
    direct: Array<{ id: string; name: string; status: string; depth: number; path: string[] }>
    indirect: Array<{ id: string; name: string; status: string; depth: number; path: string[] }>
    thirdLevel: Array<{ id: string; name: string; status: string; depth: number; path: string[] }>
    paths: Array<{ fromId: string; toId: string; type: string; depth: number }>
  }
  ai: {
    summary: string
    reasoning: string
    riskLevel: 'low' | 'medium' | 'high'
    additionalAffectedNodeIds: string[]
    additionalAffectedNodes: Array<{ id: string; name: string; summary: string | null; status: string }>
  }
}

export async function generateNodeContent(
  teamId: string,
  input: {
    nodeName: string
    moduleContext?: string
    existingContent?: {
      trigger?: string
      dependsOn?: string
      mainFlow?: string
      branches?: Array<{ condition: string; action: string }>
      edgeCases?: Array<{ scenario: string; handling: string; severity: 'critical' | 'warning' | 'info' }>
    }
  }
): Promise<GeneratedNodeContent> {
  const response = await apiClient.post('/api/v1/ai/generate-node', { teamId, ...input })
  return response.data.data
}

export async function suggestEdgeCases(
  teamId: string,
  input: {
    nodeName: string
    mainFlow: string
    existingEdgeCases?: Array<{ scenario: string; handling: string; severity: 'critical' | 'warning' | 'info' }>
  }
): Promise<Array<{ scenario: string; handling: string; severity: 'critical' | 'warning' | 'info' }>> {
  const response = await apiClient.post('/api/v1/ai/suggest-edge-cases', { teamId, ...input })
  return response.data.data
}

export async function analyzeNode(
  teamId: string,
  input: {
    nodeName: string
    trigger?: string
    dependsOn?: string
    mainFlow?: string
    branches?: Array<{ condition: string; action: string }>
    edgeCases?: Array<{ scenario: string; handling: string; severity: string }>
  }
): Promise<NodeAnalysis> {
  const response = await apiClient.post('/api/v1/ai/analyze-node', { teamId, ...input })
  return response.data.data
}

export async function generateTestCases(
  teamId: string,
  input: {
    nodeName: string
    trigger?: string
    dependsOn?: string
    mainFlow?: string
    branches?: Array<{ condition: string; action: string }>
    edgeCases?: Array<{ scenario: string; handling: string; severity: string }>
  }
): Promise<GeneratedTestCases> {
  const response = await apiClient.post('/api/v1/ai/generate-tests', { teamId, ...input })
  return response.data.data
}

export async function nlQuery(input: NaturalLanguageQueryInput): Promise<NlQueryResponse> {
  const response = await apiClient.post('/api/v1/ai/nl-query', input)
  return response.data.data
}

export async function aiAnalyzeImpact(input: AiAnalyzeImpactInput): Promise<AiImpactAnalysisResponse> {
  const response = await apiClient.post('/api/v1/ai/analyze-impact', input)
  return response.data.data
}

export async function batchGenerate(input: BatchGenerateInput): Promise<BatchGenerateResult> {
  const response = await apiClient.post('/api/v1/ai/batch-generate', input)
  return response.data.data
}

export async function generateAgentContext(input: AgentContextExportInput): Promise<string> {
  const response = await apiClient.post('/api/v1/ai/agent-context', input)
  return response.data.data
}

export async function checkCodeConsistency(input: CheckConsistencyInput): Promise<ConsistencyResult> {
  const response = await apiClient.post('/api/v1/ai/check-consistency', input)
  return response.data.data
}
