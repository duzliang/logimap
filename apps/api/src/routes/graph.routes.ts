import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { CreateConnectionSchema, UpdateConnectionSchema } from '@logimap/types'
import { GraphService } from '../services/graph.service.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireTeamRole, teamResolvers } from '../middleware/rbac.middleware.js'

const graph = new GraphService()

export const graphRoutes = new Hono()
  .use('*', authMiddleware)
  .get('/', requireTeamRole('VIEWER', teamResolvers.fromModuleParam), async (c) => {
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
  .post('/connections', requireTeamRole('MEMBER', teamResolvers.fromModuleParam), zValidator('json', CreateConnectionSchema), async (c) => {
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
  .put('/connections/:connId', requireTeamRole('MEMBER', teamResolvers.fromConnectionParam), zValidator('json', UpdateConnectionSchema), async (c) => {
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
  .delete('/connections/:connId', requireTeamRole('MEMBER', teamResolvers.fromConnectionParam), async (c) => {
    try {
      const connId = c.req.param('connId')
      await graph.deleteConnection(connId)
      return c.json({ message: '删除成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除失败'
      return c.json({ error: message, code: 'DELETE_FAILED' }, 400)
    }
  })
