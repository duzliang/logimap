import { randomBytes, createHash } from 'node:crypto'
import { prisma } from '../db/prisma.js'
import type { ApiTokenSummary, ApiTokenCreated, CreateApiTokenInput } from '@logimap/types'

const TOKEN_PREFIX = 'lmk_'

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function toSummary(t: {
  id: string
  name: string
  prefix: string
  lastUsedAt: Date | null
  expiresAt: Date | null
  revokedAt: Date | null
  createdAt: Date
}): ApiTokenSummary {
  return {
    id: t.id,
    name: t.name,
    prefix: t.prefix,
    lastUsedAt: t.lastUsedAt?.toISOString() ?? null,
    expiresAt: t.expiresAt?.toISOString() ?? null,
    revokedAt: t.revokedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString()
  }
}

export class ApiTokenService {
  async list(userId: string): Promise<ApiTokenSummary[]> {
    const tokens = await prisma.apiToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
    return tokens.map(toSummary)
  }

  async create(userId: string, input: CreateApiTokenInput): Promise<ApiTokenCreated> {
    const raw = TOKEN_PREFIX + randomBytes(24).toString('hex')
    const prefix = raw.slice(0, 12)
    const expiresAt = input.expiresInDays
      ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
      : null

    const created = await prisma.apiToken.create({
      data: {
        name: input.name,
        tokenHash: hashToken(raw),
        prefix,
        userId,
        expiresAt
      }
    })

    return { ...toSummary(created), token: raw }
  }

  async revoke(userId: string, tokenId: string): Promise<void> {
    const token = await prisma.apiToken.findFirst({ where: { id: tokenId, userId } })
    if (!token) {
      throw new Error('令牌不存在')
    }
    if (token.revokedAt) return
    await prisma.apiToken.update({ where: { id: tokenId }, data: { revokedAt: new Date() } })
  }

  /**
   * 校验 API 令牌。返回对应用户信息；无效/过期/已撤销返回 null。
   * 校验通过时异步更新 lastUsedAt。
   */
  async verify(rawToken: string): Promise<{ userId: string; email: string } | null> {
    if (!rawToken.startsWith(TOKEN_PREFIX)) return null

    const token = await prisma.apiToken.findUnique({
      where: { tokenHash: hashToken(rawToken) },
      include: { user: { select: { id: true, email: true } } }
    })

    if (!token) return null
    if (token.revokedAt) return null
    if (token.expiresAt && token.expiresAt.getTime() < Date.now()) return null

    // 更新最近使用时间（不阻塞主流程）
    prisma.apiToken
      .update({ where: { id: token.id }, data: { lastUsedAt: new Date() } })
      .catch(() => undefined)

    return { userId: token.user.id, email: token.user.email }
  }
}

export const isApiToken = (token: string): boolean => token.startsWith(TOKEN_PREFIX)
