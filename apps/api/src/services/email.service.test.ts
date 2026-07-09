import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { EmailService, MemoryTransport } from './email.service.js'

const ORIGINAL = process.env.ENABLE_EMAIL_NOTIFICATIONS

function setEnabled(value: boolean) {
  if (value) process.env.ENABLE_EMAIL_NOTIFICATIONS = 'true'
  else delete process.env.ENABLE_EMAIL_NOTIFICATIONS
}

const recipient = { email: 'user@example.com', name: 'User', emailNotifications: true }
const input = { title: '标题', body: '正文' }

describe('EmailService', () => {
  beforeEach(() => setEnabled(false))
  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.ENABLE_EMAIL_NOTIFICATIONS
    else process.env.ENABLE_EMAIL_NOTIFICATIONS = ORIGINAL
  })

  it('总开关关闭时不发送', async () => {
    const transport = new MemoryTransport()
    const service = new EmailService(transport)
    const sent = await service.sendNotificationEmail(input, recipient)
    expect(sent).toBe(false)
    expect(transport.sent).toHaveLength(0)
  })

  it('开启且用户订阅时通过 transport 发送', async () => {
    setEnabled(true)
    const transport = new MemoryTransport()
    const service = new EmailService(transport)
    const sent = await service.sendNotificationEmail(input, recipient)
    expect(sent).toBe(true)
    expect(transport.sent).toHaveLength(1)
    expect(transport.sent[0]).toMatchObject({ to: 'user@example.com', subject: '标题', text: '正文' })
  })

  it('用户关闭邮件偏好时不发送', async () => {
    setEnabled(true)
    const transport = new MemoryTransport()
    const service = new EmailService(transport)
    const sent = await service.sendNotificationEmail(input, { ...recipient, emailNotifications: false })
    expect(sent).toBe(false)
    expect(transport.sent).toHaveLength(0)
  })

  it('缺少邮箱时不发送', async () => {
    setEnabled(true)
    const transport = new MemoryTransport()
    const service = new EmailService(transport)
    const sent = await service.sendNotificationEmail(input, { ...recipient, email: '' })
    expect(sent).toBe(false)
  })
})
