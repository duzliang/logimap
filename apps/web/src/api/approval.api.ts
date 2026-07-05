import { apiClient } from './client'
import type { NodeApprovalInput } from '@logimap/types'
import type { LogicNode } from '../types/logic-node.types'

function approvalUrl(nodeId: string) {
  return `/api/v1/nodes/${nodeId}/approval`
}

export async function performApprovalAction(
  nodeId: string,
  data: NodeApprovalInput
): Promise<LogicNode> {
  const response = await apiClient.post(approvalUrl(nodeId), data)
  return response.data.data
}
