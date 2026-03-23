import { apiClient } from './client'
import type {
  LogicNode,
  LogicNodeVersion,
  CreateLogicNodeInput,
  UpdateLogicNodeInput,
  UpdatePositionInput
} from '../types/logic-node.types'

// 获取模块下所有节点
export async function fetchLogicNodes(moduleId: string): Promise<LogicNode[]> {
  const response = await apiClient.get(`/api/v1/modules/${moduleId}/nodes`)
  return response.data.data
}

// 获取节点详情
export async function fetchLogicNode(nodeId: string): Promise<LogicNode> {
  const response = await apiClient.get(`/api/v1/nodes/${nodeId}`)
  return response.data.data
}

// 创建节点
export async function createLogicNode(
  moduleId: string,
  data: CreateLogicNodeInput
): Promise<LogicNode> {
  const response = await apiClient.post(`/api/v1/modules/${moduleId}/nodes`, data)
  return response.data.data
}

// 更新节点
export async function updateLogicNode(
  nodeId: string,
  data: UpdateLogicNodeInput
): Promise<LogicNode> {
  const response = await apiClient.put(`/api/v1/nodes/${nodeId}`, data)
  return response.data.data
}

// 更新节点位置
export async function updateLogicNodePosition(
  nodeId: string,
  data: UpdatePositionInput
): Promise<LogicNode> {
  const response = await apiClient.put(`/api/v1/nodes/${nodeId}/position`, data)
  return response.data.data
}

// 删除节点
export async function deleteLogicNode(nodeId: string): Promise<void> {
  await apiClient.delete(`/api/v1/nodes/${nodeId}`)
}

// 获取节点历史版本
export async function fetchLogicNodeVersions(
  nodeId: string
): Promise<LogicNodeVersion[]> {
  const response = await apiClient.get(`/api/v1/nodes/${nodeId}/versions`)
  return response.data.data
}

// 恢复到指定版本
export async function restoreLogicNodeVersion(
  nodeId: string,
  version: number
): Promise<LogicNode> {
  const response = await apiClient.post(`/api/v1/nodes/${nodeId}/restore/${version}`)
  return response.data.data
}
