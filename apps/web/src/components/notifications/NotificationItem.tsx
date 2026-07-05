import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Bell, Mail, UserPlus, Shield, CheckCircle, XCircle, AlertCircle, MessageSquare } from 'lucide-react'
import { Button } from '@logimap/ui'
import type { Notification } from '@logimap/types'

interface NotificationItemProps {
  notification: Notification
  onMarkRead?: (id: string) => void
  onMarkUnread?: (id: string) => void
  onDelete?: (id: string) => void
}

const typeIcons: Record<string, React.ReactNode> = {
  NODE_STATUS_CHANGED: <Bell className="h-4 w-4" />,
  NODE_REVIEW_REQUESTED: <Bell className="h-4 w-4" />,
  NODE_REVIEW_APPROVED: <CheckCircle className="h-4 w-4 text-green-500" />,
  NODE_REVIEW_REJECTED: <XCircle className="h-4 w-4 text-amber-500" />,
  NODE_DEPRECATED: <AlertCircle className="h-4 w-4 text-rose-500" />,
  MENTIONED_IN_NODE: <MessageSquare className="h-4 w-4 text-violet-500" />,
  TEAM_INVITATION_RECEIVED: <Mail className="h-4 w-4 text-blue-500" />,
  TEAM_INVITATION_ACCEPTED: <UserPlus className="h-4 w-4 text-green-500" />,
  TEAM_ROLE_CHANGED: <Shield className="h-4 w-4 text-violet-500" />,
  SYSTEM_BROADCAST: <Bell className="h-4 w-4" />
}

export function NotificationItem({ notification, onMarkRead, onMarkUnread, onDelete }: NotificationItemProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (!notification.isRead && onMarkRead) {
      onMarkRead(notification.id)
    }

    if (notification.nodeId) {
      navigate(`/modules/${notification.moduleId}`)
    } else if (notification.teamId) {
      navigate('/team/settings')
    }
  }

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation()
    action()
  }

  return (
    <div
      onClick={handleClick}
      className={`
        group relative flex cursor-pointer gap-3 rounded-lg p-3 transition-colors
        ${notification.isRead ? 'bg-transparent hover:bg-[var(--color-bg-subtle)]' : 'bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-hover)]'}
      `}
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-base)]">
        {typeIcons[notification.type] || <Bell className="h-4 w-4" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className={`text-sm ${notification.isRead ? 'text-[var(--color-text-secondary)]' : 'font-medium text-[var(--color-text-primary)]'}`}>
          {notification.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-[var(--color-text-tertiary)]">
          {notification.body}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-tertiary)]">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: zhCN })}
          </span>
          {notification.actor && (
            <span className="text-xs text-[var(--color-text-tertiary)]">
              {notification.actor.name || notification.actor.email}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {notification.isRead ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => handleAction(e, () => onMarkUnread?.(notification.id))}
            title="标记为未读"
          >
            <Bell className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => handleAction(e, () => onMarkRead?.(notification.id))}
            title="标记为已读"
          >
            <CheckCircle className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-[var(--color-error-icon)] hover:text-[var(--color-error-text)]"
          onClick={(e) => handleAction(e, () => onDelete?.(notification.id))}
          title="删除"
        >
          <XCircle className="h-3.5 w-3.5" />
        </Button>
      </div>

      {!notification.isRead && (
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-violet-500" />
      )}
    </div>
  )
}
