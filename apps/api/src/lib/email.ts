import type { Notification } from '@logimap/types'

export function shouldSendEmail(type: string): boolean {
  const enabled = process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true'
  if (!enabled) return false

  // 未来可扩展：按类型、按用户偏好过滤
  return true
}

export async function sendEmailNotification(
  notification: Notification,
  recipient: { email: string; name: string | null }
): Promise<boolean> {
  if (!shouldSendEmail(notification.type)) {
    return false
  }

  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const fromAddress = process.env.EMAIL_FROM || 'notifications@logimap.dev'

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.log(
      `[EMAIL_STUB] to=${recipient.email} title=${notification.title} body=${notification.body}`
    )
    return true
  }

  // 真实 SMTP 发送留待后续实现，避免在 Phase 2 引入 nodemailer 依赖
  console.log(`[EMAIL] Sending email to ${recipient.email}: ${notification.title}`)
  return true
}
