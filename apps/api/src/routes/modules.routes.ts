import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { ModulesService } from '../services/modules.service.js'
import { CreateModuleSchema, UpdateModuleSchema } from '../lib/validators.system.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const modules = new ModulesService()

export const modulesRoutes = new Hono()
  .use('*', authMiddleware)

  // 获取模块列表
  .get('/', async (c) => {
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

  // 创建模块
  .post('/', zValidator('json', CreateModuleSchema), async (c) => {
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

  // 获取模块详情
  .get('/:moduleId', async (c) => {
    try {
      const moduleId = c.req.param('moduleId')
      if (!moduleId) {
        return c.json({ error: '缺少模块 ID', code: 'MISSING_MODULE_ID' }, 400)
      }
      const result = await modules.getById(moduleId)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取模块详情失败'
      return c.json({ error: message, code: 'GET_MODULE_FAILED' }, 404)
    }
  })

  // 更新模块
  .put('/:moduleId', zValidator('json', UpdateModuleSchema), async (c) => {
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

  // 删除模块
  .delete('/:moduleId', async (c) => {
    try {
      const moduleId = c.req.param('moduleId')
      if (!moduleId) {
        return c.json({ error: '缺少模块 ID', code: 'MISSING_MODULE_ID' }, 400)
      }
      await modules.delete(moduleId)
      return c.json({ message: '删除成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除失败'
      return c.json({ error: message, code: 'DELETE_FAILED' }, 400)
    }
  })
