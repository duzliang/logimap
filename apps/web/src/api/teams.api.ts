import { apiClient } from './client'
import type { TeamSummary } from '../types/auth.types'
import type {
  Team,
  CreateTeamInput,
  UpdateTeamInput,
  InviteMemberInput,
  UpdateMemberRoleInput
} from '../types/team.types'

export async function fetchTeams(): Promise<TeamSummary[]> {
  const response = await apiClient.get('/api/v1/teams')
  return response.data.data
}

export async function fetchTeam(teamId: string): Promise<Team> {
  const response = await apiClient.get(`/api/v1/teams/${teamId}`)
  return response.data.data
}

export async function createTeam(data: CreateTeamInput): Promise<TeamSummary> {
  const response = await apiClient.post('/api/v1/teams', data)
  return response.data.data
}

export async function updateTeam(
  teamId: string,
  data: UpdateTeamInput
): Promise<TeamSummary> {
  const response = await apiClient.put(`/api/v1/teams/${teamId}`, data)
  return response.data.data
}

export async function fetchMembers(teamId: string): Promise<{
  members: Team['members']
  invitations: Team['invitations']
}> {
  const response = await apiClient.get(`/api/v1/teams/${teamId}/members`)
  return response.data.data
}

export async function inviteMember(
  teamId: string,
  data: InviteMemberInput
): Promise<unknown> {
  const response = await apiClient.post(`/api/v1/teams/${teamId}/members`, data)
  return response.data.data
}

export async function updateMemberRole(
  teamId: string,
  memberId: string,
  data: UpdateMemberRoleInput
): Promise<unknown> {
  const response = await apiClient.put(
    `/api/v1/teams/${teamId}/members/${memberId}/role`,
    data
  )
  return response.data.data
}

export async function removeMember(
  teamId: string,
  memberId: string
): Promise<unknown> {
  const response = await apiClient.delete(
    `/api/v1/teams/${teamId}/members/${memberId}`
  )
  return response.data.data
}

export async function acceptInvitation(token: string): Promise<unknown> {
  const response = await apiClient.post('/api/v1/teams/invitations/accept', {
    token
  })
  return response.data.data
}
