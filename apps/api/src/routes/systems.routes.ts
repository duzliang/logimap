import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { SystemsService } from '../services/systems.service.js'
import { CreateSystemSchema, UpdateSystemSchema } from '../lib/validators.system.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { prisma } from '../db/prisma.js'

const systems = new SystemsService()

export const systemsRoutes = new Hono()
  .use('*', authMiddleware)

  // 获取系统列表
  .get('/', async (c) => {
    try {
      const user = c.get('user')

      // 获取用户所属团队
      const memberships = await prisma.teamMember.findMany({
        where: { userId: user.userId },
        include: { team: true }
      })

      if (memberships.length === 0) {
        return c.json({ data: [] })
      }

      // 返回第一个团队的系统（简化处理）
      const teamId = memberships[0].teamId
      const result = await systems.getAll(teamId)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取系统列表失败'
      return c.json({ error: message, code: 'GET_SYSTEMS_FAILED' }, 500)
    }
  })

  // 创建系统
  .post('/', zValidator('json', CreateSystemSchema), async (c) => {
    try {
      const user = c.get('user')
      const input = c.req.valid('json')

      // 获取用户所属团队
      const memberships = await prisma.teamMember.findMany({
        where: { userId: user.userId },
        include: { team: true }
      })

      if (memberships.length === 0) {
        return c.json({ error: '未加入任何团队', code: 'NO_TEAM' }, 400)
      }

      const teamId = memberships[0].teamId
      const result = await systems.create(teamId, input)
      return c.json({ data: result, message: '创建成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建失败'
      return c.json({ error: message, code: 'CREATE_FAILED' }, 400)
    }
  })

  // 获取系统详情
  .get('/:systemId', async (c) => {
    try {
      const user = c.get('user')
      const systemId = c.req.param('systemId')

      // 获取用户所属团队
      const memberships = await prisma.teamMember.findMany({
        where: { userId: user.userId },
        include: { team: true }
      })

      if (memberships.length === 0) {
        return c.json({ error: '未加入任何团队', code: 'NO_TEAM' }, 400)
      }

      const teamId = memberships[0].teamId
      const result = await systems.getById(systemId, teamId)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取系统详情失败'
      return c.json({ error: message, code: 'GET_SYSTEM_FAILED' }, 404)
    }
  })

  // 更新系统
  .put('/:systemId', zValidator('json', UpdateSystemSchema), async (c) => {
    try {
      const user = c.get('user')
      const systemId = c.req.param('systemId')
      const input = c.req.valid('json')

      // 获取用户所属团队
      const memberships = await prisma.teamMember.findMany({
        where: { userId: user.userId },
        include: { team: true }
      })

      if (memberships.length === 0) {
        return c.json({ error: '未加入任何团队', code: 'NO_TEAM' }, 400)
      }

      const teamId = memberships[0].teamId
      const result = await systems.update(systemId, teamId, input)
      return c.json({ data: result, message: '更新成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新失败'
      return c.json({ error: message, code: 'UPDATE_FAILED' }, 400)
    }
  })

  // 删除系统
  .delete('/:systemId', async (c) => {
    try {
      const user = c.get('user')
      const systemId = c.req.param('systemId')

      // 获取用户所属团队
      const memberships = await prisma.teamMember.findMany({
        where: { userId: user.userId },
        include: { team: true }
      })

      if (memberships.length === 0) {
        return c.json({ error: '未加入任何团队', code: 'NO_TEAM' }, 400)
      }

      const teamId = memberships[0].teamId
      await systems.delete(systemId, teamId)
      return c.json({ message: '删除成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除失败'
      return c.json({ error: message, code: 'DELETE_FAILED' }, 400)
    }
  })
