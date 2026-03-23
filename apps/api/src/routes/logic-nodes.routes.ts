import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { LogicNodesService } from '../services/logic-nodes.service.js'
import {
  CreateLogicNodeSchema,
  UpdateLogicNodeSchema,
  UpdatePositionSchema
} from '../lib/validators.logic-node.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { prisma } from '../db/prisma.js'

const logicNodes = new LogicNodesService()

export const logicNodesRoutes = new Hono()
  .use('*', authMiddleware)

  // 获取模块下所有节点
  .get('/', async (c) => {
    try {
      const moduleId = c.req.param('moduleId')
      if (!moduleId) {
        return c.json({ error: '缺少模块 ID', code: 'MISSING_MODULE_ID' }, 400)
      }
      const result = await logicNodes.getAll(moduleId)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取节点列表失败'
      return c.json({ error: message, code: 'GET_NODES_FAILED' }, 500)
    }
  })

  // 创建节点
  .post('/', zValidator('json', CreateLogicNodeSchema), async (c) => {
    try {
      const user = c.get('user')
      const moduleId = c.req.param('moduleId')
      if (!moduleId) {
        return c.json({ error: '缺少模块 ID', code: 'MISSING_MODULE_ID' }, 400)
      }
      const input = c.req.valid('json')
      const result = await logicNodes.create(moduleId, input, user.userId)
      return c.json({ data: result, message: '创建成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建失败'
      return c.json({ error: message, code: 'CREATE_FAILED' }, 400)
    }
  })

  // 获取节点详情
  .get('/:nodeId', async (c) => {
    try {
      const nodeId = c.req.param('nodeId')
      const result = await logicNodes.getById(nodeId)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取节点详情失败'
      return c.json({ error: message, code: 'GET_NODE_FAILED' }, 404)
    }
  })

  // 更新节点
  .put('/:nodeId', zValidator('json', UpdateLogicNodeSchema), async (c) => {
    try {
      const user = c.get('user')
      const nodeId = c.req.param('nodeId')
      const input = c.req.valid('json')
      const result = await logicNodes.update(nodeId, input, user.userId)
      return c.json({ data: result, message: '更新成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新失败'
      return c.json({ error: message, code: 'UPDATE_FAILED' }, 400)
    }
  })

  // 更新节点位置
  .put('/:nodeId/position', zValidator('json', UpdatePositionSchema), async (c) => {
    try {
      const nodeId = c.req.param('nodeId')
      const input = c.req.valid('json')
      const result = await logicNodes.updatePosition(nodeId, input)
      return c.json({ data: result, message: '位置更新成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新失败'
      return c.json({ error: message, code: 'UPDATE_POSITION_FAILED' }, 400)
    }
  })

  // 获取节点历史版本
  .get('/:nodeId/versions', async (c) => {
    try {
      const nodeId = c.req.param('nodeId')
      const result = await logicNodes.getVersions(nodeId)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取版本列表失败'
      return c.json({ error: message, code: 'GET_VERSIONS_FAILED' }, 500)
    }
  })

  // 恢复到指定版本
  .post('/:nodeId/restore/:version', async (c) => {
    try {
      const user = c.get('user')
      const nodeId = c.req.param('nodeId')
      const version = parseInt(c.req.param('version'))

      if (isNaN(version)) {
        return c.json({ error: '版本号无效', code: 'INVALID_VERSION' }, 400)
      }

      const result = await logicNodes.restoreVersion(nodeId, version)
      return c.json({ data: result, message: '恢复成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '恢复失败'
      return c.json({ error: message, code: 'RESTORE_FAILED' }, 400)
    }
  })

  // 删除节点
  .delete('/:nodeId', async (c) => {
    try {
      const nodeId = c.req.param('nodeId')
      await logicNodes.delete(nodeId)
      return c.json({ message: '删除成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除失败'
      return c.json({ error: message, code: 'DELETE_FAILED' }, 400)
    }
  })
