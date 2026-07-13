import { useState, useRef, useEffect } from 'react'
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCheck, Trash2, Bell } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@logimap/ui'
import { NotificationItem } from '../../components/notifications/NotificationItem.js'
import { useTranslation } from '@/i18n'
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationsAsRead,
  markNotificationAsUnread,
  deleteNotification
} from '../../api/notifications.api.js'

export function NotificationsPage() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const [includeRead, setIncludeRead] = useState(true)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useInfiniteQuery({
    queryKey: ['notifications', 'list', includeRead],
    queryFn: ({ pageParam }) => fetchNotifications({ cursor: pageParam, limit: 50, includeRead }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined
  })

  const notifications = data?.pages.flatMap((p) => p.notifications) ?? []

  const loadMoreRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = loadMoreRef.current
    if (!el || !hasNextPage) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchNextPage()
      },
      { rootMargin: '100px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, fetchNextPage])

  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadCount
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationsAsRead({ ids: [id] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    }
  })

  const markUnreadMutation = useMutation({
    mutationFn: (id: string) => markNotificationAsUnread(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    }
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => markNotificationsAsRead({ all: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
      toast.success(t('notifications.allMarkedRead'))
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    }
  })

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand-subtle)]">
              <Bell className="h-5 w-5 text-[var(--color-text-brand)]" />
            </div>
            <div>
              <CardTitle>{t('notifications.title')}</CardTitle>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                {t('notifications.unreadCount', { count: unreadCountData?.count || 0 })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIncludeRead(!includeRead)}
            >
              {includeRead ? t('notifications.showUnreadOnly') : t('notifications.showAll')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={(unreadCountData?.count || 0) === 0}
            >
              <CheckCheck className="mr-1 h-4 w-4" />
              {t('notifications.markAllRead')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-[var(--color-error-icon)] hover:text-[var(--color-error-text)]"
              onClick={() => {
                if (confirm(t('notifications.clearConfirm'))) {
                  Promise.all(notifications.map((n) => deleteNotification(n.id))).then(() => {
                    queryClient.invalidateQueries({ queryKey: ['notifications'] })
                  })
                }
              }}
              disabled={notifications.length === 0}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              {t('notifications.clear')}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-[var(--color-text-tertiary)]">{t('common.loading')}</div>
          ) : isError ? (
            <div className="py-12 text-center text-[var(--color-error-icon)]">{error?.message || t('common.error')}</div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-[var(--color-text-tertiary)]">{t('notifications.empty')}</div>
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
              {hasNextPage && (
                <div ref={loadMoreRef} className="py-4 text-center text-sm text-[var(--color-text-tertiary)]">
                  {isFetchingNextPage ? t('common.loading') : t('notifications.loadMore')}
                </div>
              )}
              {!hasNextPage && notifications.length > 0 && (
                <div className="py-4 text-center text-sm text-[var(--color-text-tertiary)]">{t('notifications.noMore')}</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
