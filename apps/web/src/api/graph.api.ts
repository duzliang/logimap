import { apiClient } from './client'
import type { LogicNode } from '../types/logic-node.types'

export interface GraphConnection {
  id: string
  sourceId: string
  targetId: string
  type: 'TRIGGERS' | 'DEPENDS_ON' | 'BLOCKS' | 'EXTENDS'
  label?: string | null
  description?: string | null
  createdAt: string
}

export interface GraphData {
  nodes: LogicNode[]
  connections: GraphConnection[]
}

// 获取图谱数据
export async function fetchGraphData(moduleId: string): Promise<GraphData> {
  const response = await apiClient.get(`/api/v1/modules/${moduleId}/graph`)
  return response.data.data
}

// 创建连线
export async function createConnection(
  sourceId: string,
  targetId: string,
  type: string,
  label?: string,
  description?: string
) {
  const response = await apiClient.post('/api/v1/graph/connections', {
    sourceId,
    targetId,
    type,
    label,
    description
  })
  return response.data.data
}

// 删除连线
export async function deleteConnection(connId: string) {
  const response = await apiClient.delete(`/api/v1/graph/connections/${connId}`)
  return response.data
}

// 更新节点位置
export async function updateNodePosition(
  nodeId: string,
  positionX: number,
  positionY: number
) {
  const response = await apiClient.put(`/api/v1/nodes/${nodeId}/position`, {
    positionX,
    positionY
  })
  return response.data.data
}
