import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCheck, Trash2, Bell } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@logimap/ui'
import { NotificationItem } from '../../components/notifications/NotificationItem.js'
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationsAsRead,
  markNotificationAsUnread,
  deleteNotification
} from '../../api/notifications.api.js'

export function NotificationsPage() {
  const queryClient = useQueryClient()
  const [includeRead, setIncludeRead] = useState(true)

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', 'list', includeRead],
    queryFn: () => fetchNotifications({ limit: 50, includeRead })
  })

  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadCount
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationsAsRead({ ids: [id] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
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
      toast.success('全部标记为已读')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900">
              <Bell className="h-5 w-5 text-violet-600 dark:text-violet-300" />
            </div>
            <div>
              <CardTitle>通知中心</CardTitle>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                未读通知 {unreadCountData?.count || 0} 条
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIncludeRead(!includeRead)}
            >
              {includeRead ? '仅显示未读' : '显示全部'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={(unreadCountData?.count || 0) === 0}
            >
              <CheckCheck className="mr-1 h-4 w-4" />
              全部已读
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-[var(--color-error-icon)] hover:text-[var(--color-error-text)]"
              onClick={() => {
                if (confirm('确定要清空所有通知吗？')) {
                  Promise.all(notifications.map((n) => deleteNotification(n.id))).then(() => {
                    queryClient.invalidateQueries({ queryKey: ['notifications'] })
                  })
                }
              }}
              disabled={notifications.length === 0}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              清空
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-[var(--color-text-tertiary)]">加载中...</div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-[var(--color-text-tertiary)]">暂无通知</div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={(id) => markReadMutation.mutate(id)}
                  onMarkUnread={(id) => markUnreadMutation.mutate(id)}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
