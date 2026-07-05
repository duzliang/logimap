import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Settings } from 'lucide-react'
import { Button, Badge } from '@logimap/ui'
import { NotificationItem } from './NotificationItem.js'
import type { Notification } from '@logimap/types'

interface NotificationDropdownProps {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  onMarkRead: (id: string) => void
  onMarkUnread: (id: string) => void
  onDelete: (id: string) => void
  onMarkAllRead: () => void
  onLoadMore?: () => void
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  isLoading,
  onMarkRead,
  onMarkUnread,
  onDelete,
  onMarkAllRead,
  onLoadMore
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="通知"
      >
        <Bell className="h-5 w-5 text-[var(--color-text-secondary)]" />
        {unreadCount > 0 && (
          <Badge className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] shadow-dialog"
        >
          <div className="flex items-center justify-between border-b border-[var(--color-border-default)] px-4 py-3">
            <span className="font-medium text-[var(--color-text-primary)]">通知</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onMarkAllRead()}
                title="全部标记为已读"
                disabled={unreadCount === 0}
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setIsOpen(false)
                  navigate('/notifications')
                }}
                title="通知中心"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {isLoading ? (
              <div className="py-8 text-center text-sm text-[var(--color-text-tertiary)]">加载中...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--color-text-tertiary)]">暂无通知</div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={onMarkRead}
                    onMarkUnread={onMarkUnread}
                    onDelete={onDelete}
                  />
                ))}
                {onLoadMore && (
                  <Button
                    variant="ghost"
                    className="w-full text-sm text-[var(--color-text-tertiary)]"
                    onClick={() => onLoadMore()}
                  >
                    加载更多
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
