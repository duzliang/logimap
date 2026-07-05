import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { NotificationDropdown } from './NotificationDropdown.js'
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationsAsRead,
  markNotificationAsUnread,
  deleteNotification
} from '../../api/notifications.api.js'

export function NotificationBell() {
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchNotifications({ limit: 20, includeRead: false })
  })

  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadCount,
    refetchInterval: 30000
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationsAsRead({ ids: [id] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '标记已读失败')
    }
  })

  const markUnreadMutation = useMutation({
    mutationFn: (id: string) => markNotificationAsUnread(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => markNotificationsAsRead({ all: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '标记全部已读失败')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  return (
    <NotificationDropdown
      notifications={notifications}
      unreadCount={unreadCountData?.count || 0}
      isLoading={isLoading}
      onMarkRead={(id) => markReadMutation.mutate(id)}
      onMarkUnread={(id) => markUnreadMutation.mutate(id)}
      onDelete={(id) => deleteMutation.mutate(id)}
      onMarkAllRead={() => markAllReadMutation.mutate()}
    />
  )
}
