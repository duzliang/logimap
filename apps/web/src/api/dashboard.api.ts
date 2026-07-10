import { apiClient } from './client'
import type { DashboardSummary } from '@logimap/types'

/** 获取当前团队的仪表盘汇总数据。 */
export async function fetchDashboardSummary(teamId?: string): Promise<DashboardSummary> {
  const response = await apiClient.get('/api/v1/dashboard', {
    params: teamId ? { teamId } : undefined
  })
  return response.data.data
}
