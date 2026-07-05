import { apiClient } from './client'
import type {
  System,
  Module,
  CreateSystemInput,
  UpdateSystemInput,
  CreateModuleInput,
  UpdateModuleInput
} from '../types/system.types'

// Systems API
export async function fetchSystems(teamId?: string): Promise<System[]> {
  const response = await apiClient.get('/api/v1/systems', {
    params: teamId ? { teamId } : undefined
  })
  return response.data.data
}

export async function fetchSystem(systemId: string): Promise<System> {
  const response = await apiClient.get(`/api/v1/systems/${systemId}`)
  return response.data.data
}

export async function createSystem(
  data: CreateSystemInput,
  teamId: string
): Promise<System> {
  const response = await apiClient.post('/api/v1/systems', data, {
    params: { teamId }
  })
  return response.data.data
}

export async function updateSystem(
  systemId: string,
  data: UpdateSystemInput
): Promise<System> {
  const response = await apiClient.put(`/api/v1/systems/${systemId}`, data)
  return response.data.data
}

export async function deleteSystem(systemId: string): Promise<void> {
  await apiClient.delete(`/api/v1/systems/${systemId}`)
}

// Modules API
export async function fetchModules(systemId: string): Promise<Module[]> {
  const response = await apiClient.get(`/api/v1/systems/${systemId}/modules`)
  return response.data.data
}

export async function fetchModule(moduleId: string): Promise<Module> {
  const response = await apiClient.get(`/api/v1/modules/${moduleId}`)
  return response.data.data
}

export async function createModule(
  systemId: string,
  data: CreateModuleInput
): Promise<Module> {
  const response = await apiClient.post(`/api/v1/systems/${systemId}/modules`, data)
  return response.data.data
}

export async function updateModule(
  moduleId: string,
  data: UpdateModuleInput
): Promise<Module> {
  const response = await apiClient.put(`/api/v1/modules/${moduleId}`, data)
  return response.data.data
}

export async function deleteModule(moduleId: string): Promise<void> {
  await apiClient.delete(`/api/v1/modules/${moduleId}`)
}
