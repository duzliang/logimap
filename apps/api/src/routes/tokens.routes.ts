import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { CreateApiTokenSchema } from '@logimap/types'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { ApiTokenService } from '../services/api-token.service.js'

const service = new ApiTokenService()

export const tokensRoutes = new Hono()
  .use('*', authMiddleware)
  .get('/', async (c) => {
    const user = c.get('user')
    const tokens = await service.list(user.userId)
    return c.json({ data: tokens })
  })
  .post('/', zValidator('json', CreateApiTokenSchema), async (c) => {
    try {
      const user = c.get('user')
      const input = c.req.valid('json')
      const created = await service.create(user.userId, input)
      return c.json({ data: created }, 201)
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建令牌失败'
      return c.json({ error: message, code: 'API_TOKEN_CREATE_FAILED' }, 400)
    }
  })
  .delete('/:tokenId', async (c) => {
    try {
      const user = c.get('user')
      await service.revoke(user.userId, c.req.param('tokenId'))
      return c.json({ success: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : '撤销令牌失败'
      return c.json({ error: message, code: 'API_TOKEN_REVOKE_FAILED' }, 404)
    }
  })
