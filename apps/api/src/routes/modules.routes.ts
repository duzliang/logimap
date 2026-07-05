import { Hono } from 'hono'
import type { Context } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { ModulesService } from '../services/modules.service.js'
import { CreateModuleSchema, UpdateModuleSchema } from '../lib/validators.system.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireTeamRole, teamResolvers } from '../middleware/rbac.middleware.js'

const modules = new ModulesService()

async function getModuleById(c: Context) {
  const moduleId = c.req.param('moduleId')
  if (!moduleId) {
    return c.json({ error: '缺少模块 ID', code: 'MISSING_MODULE_ID' }, 400)
  }
  const result = await modules.getById(moduleId)
  return c.json({ data: result })
}

async function deleteModuleById(c: Context) {
  const moduleId = c.req.param('moduleId')
  if (!moduleId) {
    return c.json({ error: '缺少模块 ID', code: 'MISSING_MODULE_ID' }, 400)
  }
  await modules.delete(moduleId)
  return c.json({ message: '删除成功' })
}

export const modulesRoutes = new Hono()
  .use('*', authMiddleware)
  .get('/', requireTeamRole('VIEWER', teamResolvers.fromSystemParam), async (c) => {
    try {
      const systemId = c.req.param('systemId')
      if (!systemId) {
        return c.json({ error: '缺少系统 ID', code: 'MISSING_SYSTEM_ID' }, 400)
      }
      const result = await modules.getAll(systemId)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取模块列表失败'
      return c.json({ error: message, code: 'GET_MODULES_FAILED' }, 500)
    }
  })
  .post('/', requireTeamRole('MEMBER', teamResolvers.fromSystemParam), zValidator('json', CreateModuleSchema), async (c) => {
    try {
      const systemId = c.req.param('systemId')
      if (!systemId) {
        return c.json({ error: '缺少系统 ID', code: 'MISSING_SYSTEM_ID' }, 400)
      }
      const input = c.req.valid('json')
      const result = await modules.create(systemId, input)
      return c.json({ data: result, message: '创建成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建失败'
      return c.json({ error: message, code: 'CREATE_FAILED' }, 400)
    }
  })
  .get('/:moduleId', requireTeamRole('VIEWER', teamResolvers.fromModuleParam), async (c) => {
    try {
      return await getModuleById(c)
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取模块详情失败'
      return c.json({ error: message, code: 'GET_MODULE_FAILED' }, 404)
    }
  })
  .put('/:moduleId', requireTeamRole('ADMIN', teamResolvers.fromModuleParam), zValidator('json', UpdateModuleSchema), async (c) => {
    try {
      const moduleId = c.req.param('moduleId')
      if (!moduleId) {
        return c.json({ error: '缺少模块 ID', code: 'MISSING_MODULE_ID' }, 400)
      }
      const input = c.req.valid('json')
      const result = await modules.update(moduleId, input)
      return c.json({ data: result, message: '更新成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新失败'
      return c.json({ error: message, code: 'UPDATE_FAILED' }, 400)
    }
  })
  .delete('/:moduleId', requireTeamRole('ADMIN', teamResolvers.fromModuleParam), async (c) => {
    try {
      return await deleteModuleById(c)
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除失败'
      return c.json({ error: message, code: 'DELETE_FAILED' }, 400)
    }
  })

export const moduleDetailRoutes = new Hono()
  .use('*', authMiddleware)
  .get('/', requireTeamRole('VIEWER', teamResolvers.fromModuleParam), async (c) => {
    try {
      return await getModuleById(c)
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取模块详情失败'
      return c.json({ error: message, code: 'GET_MODULE_FAILED' }, 404)
    }
  })
  .put('/', requireTeamRole('ADMIN', teamResolvers.fromModuleParam), zValidator('json', UpdateModuleSchema), async (c) => {
    try {
      const moduleId = c.req.param('moduleId')
      if (!moduleId) {
        return c.json({ error: '缺少模块 ID', code: 'MISSING_MODULE_ID' }, 400)
      }
      const input = c.req.valid('json')
      const result = await modules.update(moduleId, input)
      return c.json({ data: result, message: '更新成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新失败'
      return c.json({ error: message, code: 'UPDATE_FAILED' }, 400)
    }
  })
  .delete('/', requireTeamRole('ADMIN', teamResolvers.fromModuleParam), async (c) => {
    try {
      return await deleteModuleById(c)
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除失败'
      return c.json({ error: message, code: 'DELETE_FAILED' }, 400)
    }
  })
