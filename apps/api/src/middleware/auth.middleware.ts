import type { Context } from 'hono'
import { verifyToken } from '../lib/jwt.js'
import { ApiTokenService, isApiToken } from '../services/api-token.service.js'

export interface UserContext {
  userId: string
  email: string
}

const apiTokenService = new ApiTokenService()

export async function authMiddleware(c: Context, next: () => Promise<void>) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: '未授权访问', code: 'UNAUTHORIZED' }, 401)
  }

  const token = authHeader.substring(7) // 移除 "Bearer " 前缀

  // API 令牌路径（lmk_ 前缀）
  if (isApiToken(token)) {
    const result = await apiTokenService.verify(token)
    if (!result) {
      return c.json({ error: '无效或已过期的 API 令牌', code: 'INVALID_API_TOKEN' }, 401)
    }
    c.set('user', { userId: result.userId, email: result.email })
    await next()
    return
  }

  try {
    const payload = await verifyToken(token)

    if (!payload.userId || !payload.email) {
      return c.json({ error: '无效的 token', code: 'INVALID_TOKEN' }, 401)
    }

    // 将用户信息存入 context
    c.set('user', {
      userId: payload.userId as string,
      email: payload.email as string
    })

    await next()
  } catch (error) {
    return c.json({ error: 'token 验证失败', code: 'TOKEN_VERIFICATION_FAILED' }, 401)
  }
}
