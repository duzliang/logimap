import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { SystemsService } from '../services/systems.service.js'
import { CreateSystemSchema, UpdateSystemSchema } from '../lib/validators.system.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireTeamRole, teamResolvers } from '../middleware/rbac.middleware.js'

const systems = new SystemsService()

export const systemsRoutes = new Hono()
  .use('*', authMiddleware)
  .get('/', requireTeamRole('VIEWER', teamResolvers.fromQueryOrDefault('teamId')), async (c) => {
    try {
      const teamId = c.get('teamId')
      const result = await systems.getAll(teamId)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取系统列表失败'
      return c.json({ error: message, code: 'GET_SYSTEMS_FAILED' }, 500)
    }
  })
  .post('/', requireTeamRole('MEMBER', teamResolvers.fromQueryOrDefault('teamId')), zValidator('json', CreateSystemSchema), async (c) => {
    try {
      const teamId = c.get('teamId')
      const input = c.req.valid('json')
      const result = await systems.create(teamId, input)
      return c.json({ data: result, message: '创建成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建失败'
      return c.json({ error: message, code: 'CREATE_FAILED' }, 400)
    }
  })
  .get('/:systemId', requireTeamRole('VIEWER', teamResolvers.fromSystemParam), async (c) => {
    try {
      const teamId = c.get('teamId')
      const systemId = c.req.param('systemId')
      const result = await systems.getById(systemId, teamId)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取系统详情失败'
      return c.json({ error: message, code: 'GET_SYSTEM_FAILED' }, 404)
    }
  })
  .put('/:systemId', requireTeamRole('ADMIN', teamResolvers.fromSystemParam), zValidator('json', UpdateSystemSchema), async (c) => {
    try {
      const teamId = c.get('teamId')
      const systemId = c.req.param('systemId')
      const input = c.req.valid('json')
      const result = await systems.update(systemId, teamId, input)
      return c.json({ data: result, message: '更新成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新失败'
      return c.json({ error: message, code: 'UPDATE_FAILED' }, 400)
    }
  })
  .delete('/:systemId', requireTeamRole('ADMIN', teamResolvers.fromSystemParam), async (c) => {
    try {
      const teamId = c.get('teamId')
      const systemId = c.req.param('systemId')
      await systems.delete(systemId, teamId)
      return c.json({ message: '删除成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除失败'
      return c.json({ error: message, code: 'DELETE_FAILED' }, 400)
    }
  })
