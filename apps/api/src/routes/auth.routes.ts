import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { AuthService } from '../services/auth.service.js'
import { RegisterSchema, LoginSchema, UpdateUserSchema } from '../lib/validators.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import type { UserContext } from '../middleware/auth.middleware.js'

declare module 'hono' {
  interface ContextVariableMap {
    user: UserContext
  }
}

const auth = new AuthService()

export const authRoutes = new Hono()
  .post('/register', zValidator('json', RegisterSchema), async (c) => {
    try {
      const input = c.req.valid('json')
      const result = await auth.register(input)
      return c.json({ data: result, message: '注册成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '注册失败'
      return c.json({ error: message, code: 'REGISTER_FAILED' }, 400)
    }
  })
  .post('/login', zValidator('json', LoginSchema), async (c) => {
    try {
      const { email, password } = c.req.valid('json')
      const result = await auth.login(email, password)
      return c.json({ data: result, message: '登录成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '登录失败'
      return c.json({ error: message, code: 'LOGIN_FAILED' }, 401)
    }
  })
  .get('/me', authMiddleware, async (c) => {
    try {
      const user = c.get('user')
      const result = await auth.getUserById(user.userId)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取用户信息失败'
      return c.json({ error: message, code: 'GET_USER_FAILED' }, 404)
    }
  })
  .put('/me', authMiddleware, zValidator('json', UpdateUserSchema), async (c) => {
    try {
      const user = c.get('user')
      const data = c.req.valid('json')
      const result = await auth.updateUser(user.userId, data)
      return c.json({ data: result, message: '更新成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新失败'
      return c.json({ error: message, code: 'UPDATE_FAILED' }, 400)
    }
  })
  .post('/logout', authMiddleware, async (c) => {
    return c.json({ message: '登出成功' })
  })
