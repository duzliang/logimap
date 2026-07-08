import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { describeRoute } from 'hono-openapi'
import { docSchema } from '../openapi.js'
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
  .post(
    '/register',
    describeRoute({
      tags: ['Auth'],
      summary: '注册新用户',
      security: [],
      requestBody: { content: { 'application/json': { schema: docSchema(RegisterSchema) } } },
      responses: {
        200: { description: '注册成功，返回用户信息与 token' },
        400: { description: '注册失败（如邮箱已存在）' },
      },
    }),
    zValidator('json', RegisterSchema), async (c) => {
    try {
      const input = c.req.valid('json')
      const result = await auth.register(input)
      return c.json({ data: result, message: '注册成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '注册失败'
      return c.json({ error: message, code: 'REGISTER_FAILED' }, 400)
    }
  })
  .post(
    '/login',
    describeRoute({
      tags: ['Auth'],
      summary: '登录',
      security: [],
      requestBody: { content: { 'application/json': { schema: docSchema(LoginSchema) } } },
      responses: {
        200: { description: '登录成功，返回用户信息与 token' },
        401: { description: '邮箱或密码错误' },
      },
    }),
    zValidator('json', LoginSchema), async (c) => {
    try {
      const { email, password } = c.req.valid('json')
      const result = await auth.login(email, password)
      return c.json({ data: result, message: '登录成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '登录失败'
      return c.json({ error: message, code: 'LOGIN_FAILED' }, 401)
    }
  })
  .get(
    '/me',
    describeRoute({ tags: ['Auth'], summary: '获取当前登录用户', responses: { 200: { description: '当前用户信息' } } }),
    authMiddleware, async (c) => {
    try {
      const user = c.get('user')
      const result = await auth.getUserById(user.userId)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取用户信息失败'
      return c.json({ error: message, code: 'GET_USER_FAILED' }, 404)
    }
  })
  .put(
    '/me',
    describeRoute({
      tags: ['Auth'],
      summary: '更新当前用户资料',
      requestBody: { content: { 'application/json': { schema: docSchema(UpdateUserSchema) } } },
      responses: { 200: { description: '更新成功' }, 400: { description: '更新失败' } },
    }),
    authMiddleware, zValidator('json', UpdateUserSchema), async (c) => {
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
  .post(
    '/logout',
    describeRoute({ tags: ['Auth'], summary: '登出', responses: { 200: { description: '登出成功' } } }),
    authMiddleware, async (c) => {
    return c.json({ message: '登出成功' })
  })
