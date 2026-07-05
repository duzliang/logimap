import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { NotificationsService } from '../services/notifications.service.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { MarkReadSchema, NotificationListQuerySchema } from '../lib/validators.notification.js'

const notifications = new NotificationsService()

export const notificationsRoutes = new Hono()
  .use('*', authMiddleware)
  .get('/', zValidator('query', NotificationListQuerySchema), async (c) => {
    try {
      const user = c.get('user')
      const query = c.req.valid('query')
      const result = await notifications.getNotificationsForUser(user.userId, {
        cursor: query.cursor,
        limit: query.limit,
        includeRead: query.includeRead === 'true'
      })
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取通知列表失败'
      return c.json({ error: message, code: 'GET_NOTIFICATIONS_FAILED' }, 500)
    }
  })
  .get('/unread-count', async (c) => {
    try {
      const user = c.get('user')
      const result = await notifications.getUnreadCount(user.userId)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取未读计数失败'
      return c.json({ error: message, code: 'GET_UNREAD_COUNT_FAILED' }, 500)
    }
  })
  .post('/read', zValidator('json', MarkReadSchema), async (c) => {
    try {
      const user = c.get('user')
      const input = c.req.valid('json')
      const result = await notifications.markAsRead(user.userId, input)
      return c.json({ data: result, message: '标记已读成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '标记已读失败'
      return c.json({ error: message, code: 'MARK_READ_FAILED' }, 400)
    }
  })
  .post('/:notificationId/unread', async (c) => {
    try {
      const user = c.get('user')
      const notificationId = c.req.param('notificationId')
      const result = await notifications.markAsUnread(user.userId, notificationId)
      return c.json({ data: result, message: '标记未读成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '标记未读失败'
      return c.json({ error: message, code: 'MARK_UNREAD_FAILED' }, 400)
    }
  })
  .delete('/:notificationId', async (c) => {
    try {
      const user = c.get('user')
      const notificationId = c.req.param('notificationId')
      const result = await notifications.deleteNotification(user.userId, notificationId)
      return c.json({ data: result, message: '删除成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除失败'
      return c.json({ error: message, code: 'DELETE_NOTIFICATION_FAILED' }, 400)
    }
  })
