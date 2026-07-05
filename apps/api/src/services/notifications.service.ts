import { prisma } from '../db/prisma.js'
import { generateId } from '../lib/id-generator.js'
import type { CreateNotificationInput, NotificationType, NotificationPayload } from '@logimap/types'
import type { Prisma } from '@prisma/client'

export interface NotificationListOptions {
  cursor?: string
  limit?: number
  includeRead?: boolean
}

export class NotificationsService {
  async createNotification(input: CreateNotificationInput) {
    const notification = await prisma.notification.create({
      data: {
        id: generateId(),
        type: input.type,
        userId: input.userId,
        actorId: input.actorId || null,
        teamId: input.teamId || null,
        nodeId: input.nodeId || null,
        moduleId: input.moduleId || null,
        title: input.title,
        body: input.body,
        payload: input.payload || {}
      },
      include: {
        actor: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return this.formatNotification(notification)
  }

  async getNotificationsForUser(userId: string, options: NotificationListOptions = {}) {
    const { cursor, limit = 20, includeRead = true } = options

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(includeRead ? {} : { isRead: false }),
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        actor: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return notifications.map((n) => this.formatNotification(n))
  }

  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: { userId, isRead: false }
    })

    return { count }
  }

  async markAsRead(userId: string, input: { ids?: string[]; all?: boolean }) {
    if (input.all) {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date() }
      })
      return { markedCount: await prisma.notification.count({ where: { userId, isRead: true } }) }
    }

    if (!input.ids || input.ids.length === 0) {
      throw new Error('请提供通知 ID 列表')
    }

    const result = await prisma.notification.updateMany({
      where: {
        userId,
        id: { in: input.ids },
        isRead: false
      },
      data: { isRead: true, readAt: new Date() }
    })

    return { markedCount: result.count }
  }

  async markAsUnread(userId: string, notificationId: string) {
    const notification = await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: false, readAt: null }
    })

    if (notification.count === 0) {
      throw new Error('通知不存在')
    }

    return { success: true }
  }

  async deleteNotification(userId: string, notificationId: string) {
    const notification = await prisma.notification.deleteMany({
      where: { id: notificationId, userId }
    })

    if (notification.count === 0) {
      throw new Error('通知不存在')
    }

    return { success: true }
  }

  private formatNotification(notification: {
    id: string
    type: NotificationType
    title: string
    body: string
    payload: Prisma.JsonValue | null
    isRead: boolean
    readAt: Date | null
    createdAt: Date
    actor: { id: string; name: string | null; email: string } | null
    teamId: string | null
    nodeId: string | null
    moduleId: string | null
  }) {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      payload: (notification.payload as NotificationPayload) || null,
      isRead: notification.isRead,
      readAt: notification.readAt?.toISOString() || null,
      createdAt: notification.createdAt.toISOString(),
      actor: notification.actor,
      teamId: notification.teamId,
      nodeId: notification.nodeId,
      moduleId: notification.moduleId
    }
  }
}
