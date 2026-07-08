import { z } from 'zod'

/** API Token 管理（T3-18） */

export const CreateApiTokenSchema = z.object({
  name: z.string().min(1, '请输入令牌名称').max(100, '名称不能超过 100 个字符'),
  expiresInDays: z.number().int().positive().max(3650).optional()
})

export type CreateApiTokenInput = z.infer<typeof CreateApiTokenSchema>

export interface ApiTokenSummary {
  id: string
  name: string
  prefix: string
  lastUsedAt: string | null
  expiresAt: string | null
  revokedAt: string | null
  createdAt: string
}

/** 创建令牌时一次性返回明文 */
export interface ApiTokenCreated extends ApiTokenSummary {
  token: string
}
