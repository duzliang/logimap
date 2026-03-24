import { apiClient } from './client'

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

export async function generateNodeContent(input: {
  nodeName: string
  moduleContext?: string
  existingContent?: {
    trigger?: string
    dependsOn?: string
    mainFlow?: string
    branches?: Array<{ condition: string; action: string }>
    edgeCases?: Array<{ scenario: string; handling: string; severity: 'critical' | 'warning' | 'info' }>
  }
}): Promise<GeneratedNodeContent> {
  const response = await apiClient.post('/api/v1/ai/generate-node', input)
  return response.data.data
}

export async function suggestEdgeCases(input: {
  nodeName: string
  mainFlow: string
  existingEdgeCases?: Array<{ scenario: string; handling: string; severity: 'critical' | 'warning' | 'info' }>
}): Promise<Array<{ scenario: string; handling: string; severity: 'critical' | 'warning' | 'info' }>> {
  const response = await apiClient.post('/api/v1/ai/suggest-edge-cases', input)
  return response.data.data
}

export async function analyzeNode(input: {
  nodeName: string
  trigger?: string
  dependsOn?: string
  mainFlow?: string
  branches?: Array<{ condition: string; action: string }>
  edgeCases?: Array<{ scenario: string; handling: string; severity: string }>
}): Promise<NodeAnalysis> {
  const response = await apiClient.post('/api/v1/ai/analyze-node', input)
  return response.data.data
}

export async function generateTestCases(input: {
  nodeName: string
  trigger?: string
  dependsOn?: string
  mainFlow?: string
  branches?: Array<{ condition: string; action: string }>
  edgeCases?: Array<{ scenario: string; handling: string; severity: string }>
}): Promise<GeneratedTestCases> {
  const response = await apiClient.post('/api/v1/ai/generate-tests', input)
  return response.data.data
}