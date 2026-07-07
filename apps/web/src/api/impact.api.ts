import { apiClient } from './client.js'
import type {
  AnalyzeImpactInput,
  WhatIfImpactInput,
  CreateImpactReportInput,
  ListImpactReportsInput,
  ImpactScope
} from '@logimap/types'

export async function analyzeImpact(input: AnalyzeImpactInput): Promise<ImpactScope> {
  const response = await apiClient.post('/impact/analyze', input)
  return response.data.data
}

export async function whatIfImpact(input: WhatIfImpactInput): Promise<ImpactScope> {
  const response = await apiClient.post('/impact/what-if', input)
  return response.data.data
}

export async function createReport(input: CreateImpactReportInput) {
  const response = await apiClient.post('/impact/reports', input)
  return response.data.data
}

export async function listReports(input: ListImpactReportsInput = {}) {
  const params = new URLSearchParams()
  if (input.nodeId) params.set('nodeId', input.nodeId)
  if (input.moduleId) params.set('moduleId', input.moduleId)
  const response = await apiClient.get(`/impact/reports?${params.toString()}`)
  return response.data.data
}

export async function getReport(reportId: string) {
  const response = await apiClient.get(`/impact/reports/${reportId}`)
  return response.data.data
}
