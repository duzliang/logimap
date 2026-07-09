/**
 * 邮件通知服务（T3-16）
 *
 * 设计目标：
 *  - 服务端总开关：ENABLE_EMAIL_NOTIFICATIONS === 'true'
 *  - 用户级开关：User.emailNotifications
 *  - 可插拔 Transport：便于测试（MemoryTransport）与后续接入真实 SMTP
 *
 * 未配置 SMTP 时回退到 ConsoleTransport（仅打印），因此「配置邮件后可发送」，
 * 未配置也不会报错。真实 SMTP 发送以动态导入 nodemailer 实现，避免硬依赖。
 */

export interface EmailMessage {
  to: string
  toName?: string | null
  subject: string
  text: string
}

export interface EmailTransport {
  readonly name: string
  send(message: EmailMessage): Promise<void>
}

/** 测试用：把发送的邮件收集到内存 */
export class MemoryTransport implements EmailTransport {
  readonly name = 'memory'
  readonly sent: EmailMessage[] = []
  async send(message: EmailMessage): Promise<void> {
    this.sent.push(message)
  }
}

/** 开发/未配置 SMTP 时的回退：仅打印 */
export class ConsoleTransport implements EmailTransport {
  readonly name = 'console'
  async send(message: EmailMessage): Promise<void> {
    console.log(`[EMAIL] to=${message.to} subject=${message.subject}`)
  }
}

interface SmtpConfig {
  host: string
  port: number
  user: string
  pass: string
  from: string
}

function readSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !port || !user || !pass) return null
  return {
    host,
    port: Number(port),
    user,
    pass,
    from: process.env.EMAIL_FROM || 'notifications@logimap.dev'
  }
}

/**
 * 真实 SMTP transport：动态导入 nodemailer，未安装时抛出可读错误。
 * 保持 nodemailer 为可选依赖，Phase 2 不强制引入。
 */
export class SmtpTransport implements EmailTransport {
  readonly name = 'smtp'
  constructor(private readonly config: SmtpConfig) {}
  async send(message: EmailMessage): Promise<void> {
    // 动态导入避免硬依赖；未安装 nodemailer 时给出可读错误。
    // 用变量名规避打包器/类型系统对未安装模块的静态解析。
    const moduleName = 'nodemailer'
    let nodemailer: { createTransport: (opts: unknown) => { sendMail: (opts: unknown) => Promise<unknown> } }
    try {
      nodemailer = (await import(/* @vite-ignore */ moduleName)) as unknown as typeof nodemailer
    } catch {
      throw new Error('已配置 SMTP 但未安装 nodemailer，请先安装依赖')
    }
    const transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.port === 465,
      auth: { user: this.config.user, pass: this.config.pass }
    })
    await transporter.sendMail({
      from: this.config.from,
      to: message.to,
      subject: message.subject,
      text: message.text
    })
  }
}

export interface EmailRecipient {
  email: string
  name: string | null
  emailNotifications: boolean
}

export interface NotificationEmailInput {
  title: string
  body: string
}

export class EmailService {
  private transport: EmailTransport | null

  /** 传入 transport 可用于测试；不传则按环境解析。 */
  constructor(transport?: EmailTransport) {
    this.transport = transport ?? null
  }

  /** 服务端是否启用邮件通知 */
  isEnabled(): boolean {
    return process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true'
  }

  private resolveTransport(): EmailTransport {
    if (this.transport) return this.transport
    const smtp = readSmtpConfig()
    return smtp ? new SmtpTransport(smtp) : new ConsoleTransport()
  }

  /**
   * 按总开关 + 用户偏好发送通知邮件。
   * 返回 true 表示已发送（供调用方标记 emailSent）。
   */
  async sendNotificationEmail(
    input: NotificationEmailInput,
    recipient: EmailRecipient
  ): Promise<boolean> {
    if (!this.isEnabled()) return false
    if (!recipient.emailNotifications) return false
    if (!recipient.email) return false

    await this.resolveTransport().send({
      to: recipient.email,
      toName: recipient.name,
      subject: input.title,
      text: input.body
    })
    return true
  }
}
