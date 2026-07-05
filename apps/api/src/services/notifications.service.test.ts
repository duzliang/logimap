import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { prisma } from '../db/prisma.js'
import { NotificationsService } from './notifications.service.js'

const service = new NotificationsService()

async function createUser(email: string) {
  return prisma.user.create({
    data: { email, name: email.split('@')[0], passwordHash: 'hash' }
  })
}

async function cleanup() {
  await prisma.notification.deleteMany()
  await prisma.user.deleteMany({
    where: { email: { contains: 'notification-test' } }
  })
}

describe('NotificationsService', () => {
  beforeEach(async () => {
    await cleanup()
  })

  afterEach(async () => {
    await cleanup()
  })

  it('creates a notification', async () => {
    const user = await createUser('notification-test-1@example.com')

    const notification = await service.createNotification({
      type: 'SYSTEM_BROADCAST',
      userId: user.id,
      title: '测试通知',
      body: '这是一条测试通知'
    })

    expect(notification.title).toBe('测试通知')
    expect(notification.isRead).toBe(false)
    expect(notification.type).toBe('SYSTEM_BROADCAST')
  })

  it('lists notifications for a user', async () => {
    const user = await createUser('notification-test-2@example.com')

    await service.createNotification({
      type: 'SYSTEM_BROADCAST',
      userId: user.id,
      title: '通知 1',
      body: '第一条'
    })

    await service.createNotification({
      type: 'SYSTEM_BROADCAST',
      userId: user.id,
      title: '通知 2',
      body: '第二条'
    })

    const list = await service.getNotificationsForUser(user.id)
    expect(list).toHaveLength(2)
    expect(list[0].title).toBe('通知 2')
  })

  it('counts unread notifications', async () => {
    const user = await createUser('notification-test-3@example.com')

    await service.createNotification({
      type: 'SYSTEM_BROADCAST',
      userId: user.id,
      title: '未读',
      body: '未读通知'
    })

    await service.createNotification({
      type: 'SYSTEM_BROADCAST',
      userId: user.id,
      title: '已读',
      body: '已读通知'
    })

    const { count: initialCount } = await service.getUnreadCount(user.id)
    expect(initialCount).toBe(2)
  })

  it('marks notifications as read by ids', async () => {
    const user = await createUser('notification-test-4@example.com')

    const notification = await service.createNotification({
      type: 'SYSTEM_BROADCAST',
      userId: user.id,
      title: '待读',
      body: '待读通知'
    })

    await service.markAsRead(user.id, { ids: [notification.id] })
    const { count } = await service.getUnreadCount(user.id)
    expect(count).toBe(0)
  })

  it('marks all notifications as read', async () => {
    const user = await createUser('notification-test-5@example.com')

    await service.createNotification({
      type: 'SYSTEM_BROADCAST',
      userId: user.id,
      title: '1',
      body: '1'
    })

    await service.createNotification({
      type: 'SYSTEM_BROADCAST',
      userId: user.id,
      title: '2',
      body: '2'
    })

    await service.markAsRead(user.id, { all: true })
    const { count } = await service.getUnreadCount(user.id)
    expect(count).toBe(0)
  })

  it('deletes a notification', async () => {
    const user = await createUser('notification-test-6@example.com')

    const notification = await service.createNotification({
      type: 'SYSTEM_BROADCAST',
      userId: user.id,
      title: '删除',
      body: '删除通知'
    })

    await service.deleteNotification(user.id, notification.id)
    const list = await service.getNotificationsForUser(user.id)
    expect(list).toHaveLength(0)
  })
})
