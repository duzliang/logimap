import { apiClient } from './client.js'
import type {
  Notification,
  MarkReadInput
} from '@logimap/types'

export interface FetchNotificationsParams {
  cursor?: string
  limit?: number
  includeRead?: boolean
}

export interface FetchNotificationsResult {
  notifications: Notification[]
  nextCursor: string | undefined
}

export async function fetchNotifications(params: FetchNotificationsParams = {}): Promise<FetchNotificationsResult> {
  const searchParams = new URLSearchParams()
  if (params.cursor) searchParams.set('cursor', params.cursor)
  if (params.limit) searchParams.set('limit', String(params.limit))
  searchParams.set('includeRead', String(params.includeRead ?? true))

  const response = await apiClient.get(`/api/v1/notifications?${searchParams.toString()}`)
  const notifications = response.data.data as Notification[]
  const last = notifications[notifications.length - 1]
  return {
    notifications,
    nextCursor: last ? new Date(last.createdAt).toISOString() : undefined
  }
}

export async function fetchUnreadCount() {
  const response = await apiClient.get('/api/v1/notifications/unread-count')
  return response.data.data as { count: number }
}

export async function markNotificationsAsRead(input: MarkReadInput) {
  const response = await apiClient.post('/api/v1/notifications/read', input)
  return response.data.data as { markedCount: number }
}

export async function markNotificationAsUnread(notificationId: string) {
  const response = await apiClient.post(`/api/v1/notifications/${notificationId}/unread`)
  return response.data.data as { success: boolean }
}

export async function deleteNotification(notificationId: string) {
  const response = await apiClient.delete(`/api/v1/notifications/${notificationId}`)
  return response.data.data as { success: boolean }
}
