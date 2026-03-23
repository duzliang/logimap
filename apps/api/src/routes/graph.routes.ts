import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { GraphService } from '../services/graph.service.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const graph = new GraphService()

const CreateConnectionSchema = z.object({
  sourceId: z.string(),
  targetId: z.string(),
  type: z.enum(['TRIGGERS', 'DEPENDS_ON', 'BLOCKS', 'EXTENDS']),
  label: z.string().optional(),
  description: z.string().optional()
})

const UpdateConnectionSchema = z.object({
  label: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['TRIGGERS', 'DEPENDS_ON', 'BLOCKS', 'EXTENDS']).optional()
})

export const graphRoutes = new Hono()
  .use('*', authMiddleware)

  // 获取图谱数据
  .get('/', async (c) => {
    try {
      const moduleId = c.req.param('moduleId')
      if (!moduleId) {
        return c.json({ error: '缺少模块 ID', code: 'MISSING_MODULE_ID' }, 400)
      }
      const result = await graph.getGraphData(moduleId)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取图谱数据失败'
      return c.json({ error: message, code: 'GET_GRAPH_FAILED' }, 500)
    }
  })

  // 创建连线
  .post('/connections', zValidator('json', CreateConnectionSchema), async (c) => {
    try {
      const input = c.req.valid('json')
      const result = await graph.createConnection(
        input.sourceId,
        input.targetId,
        input.type,
        input.label,
        input.description
      )
      return c.json({ data: result, message: '创建成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建失败'
      return c.json({ error: message, code: 'CREATE_FAILED' }, 400)
    }
  })

  // 更新连线
  .put('/connections/:connId', zValidator('json', UpdateConnectionSchema), async (c) => {
    try {
      const connId = c.req.param('connId')
      const input = c.req.valid('json')
      const result = await graph.updateConnection(connId, input)
      return c.json({ data: result, message: '更新成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新失败'
      return c.json({ error: message, code: 'UPDATE_FAILED' }, 400)
    }
  })

  // 删除连线
  .delete('/connections/:connId', async (c) => {
    try {
      const connId = c.req.param('connId')
      await graph.deleteConnection(connId)
      return c.json({ message: '删除成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除失败'
      return c.json({ error: message, code: 'DELETE_FAILED' }, 400)
    }
  })
