import { apiClient } from './client'

export type ConnectionType = 'TRIGGERS' | 'DEPENDS_ON' | 'BLOCKS' | 'EXTENDS'

export interface Connection {
  id: string
  sourceId: string
  targetId: string
  type: ConnectionType
  label?: string | null
  description?: string | null
  createdAt: string
  updatedAt: string
}

export async function createConnection(data: {
  sourceId: string
  targetId: string
  type: ConnectionType
  label?: string
  description?: string
}): Promise<Connection> {
  const response = await apiClient.post('/api/v1/graph/connections', data)
  return response.data.data
}

export async function updateConnection(
  connectionId: string,
  data: {
    type?: ConnectionType
    label?: string | null
    description?: string | null
  }
): Promise<Connection> {
  const response = await apiClient.put(`/api/v1/graph/connections/${connectionId}`, data)
  return response.data.data
}

export async function deleteConnection(connectionId: string): Promise<void> {
  await apiClient.delete(`/api/v1/graph/connections/${connectionId}`)
}