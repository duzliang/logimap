import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { LogicNodesService } from '../services/logic-nodes.service.js'
import {
  CreateLogicNodeSchema,
  UpdateLogicNodeSchema,
  UpdatePositionSchema,
  NodeApprovalSchema
} from '../lib/validators.logic-node.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireTeamRole, teamResolvers } from '../middleware/rbac.middleware.js'

const logicNodes = new LogicNodesService()

export const logicNodesRoutes = new Hono()
  .use('*', authMiddleware)
  .get('/', requireTeamRole('VIEWER', teamResolvers.fromModuleParam), async (c) => {
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
  .post('/', requireTeamRole('MEMBER', teamResolvers.fromModuleParam), zValidator('json', CreateLogicNodeSchema), async (c) => {
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
  .get('/:nodeId', requireTeamRole('VIEWER', teamResolvers.fromNodeParam), async (c) => {
    try {
      const nodeId = c.req.param('nodeId')
      const result = await logicNodes.getById(nodeId)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取节点详情失败'
      return c.json({ error: message, code: 'GET_NODE_FAILED' }, 404)
    }
  })
  .put('/:nodeId', requireTeamRole('MEMBER', teamResolvers.fromNodeParam), zValidator('json', UpdateLogicNodeSchema), async (c) => {
    try {
      const user = c.get('user')
      const role = c.get('role')
      const nodeId = c.req.param('nodeId')
      const input = c.req.valid('json')
      const result = await logicNodes.update(nodeId, input, user.userId, role)
      return c.json({ data: result, message: '更新成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新失败'
      return c.json({ error: message, code: 'UPDATE_FAILED' }, 400)
    }
  })
  .post('/:nodeId/approval', requireTeamRole('MEMBER', teamResolvers.fromNodeParam), zValidator('json', NodeApprovalSchema), async (c) => {
    try {
      const user = c.get('user')
      const role = c.get('role')
      const nodeId = c.req.param('nodeId')
      const { action, comment } = c.req.valid('json')
      const result = await logicNodes.approve(nodeId, user.userId, action, role, comment)
      return c.json({ data: result, message: '审批操作成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '审批失败'
      const code = error instanceof Error && error.name === 'InvalidTransitionError' ? 'INVALID_TRANSITION' : 'APPROVAL_FAILED'
      return c.json({ error: message, code }, 400)
    }
  })
  .put('/:nodeId/position', requireTeamRole('MEMBER', teamResolvers.fromNodeParam), zValidator('json', UpdatePositionSchema), async (c) => {
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
  .get('/:nodeId/versions', requireTeamRole('VIEWER', teamResolvers.fromNodeParam), async (c) => {
    try {
      const nodeId = c.req.param('nodeId')
      const result = await logicNodes.getVersions(nodeId)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取版本列表失败'
      return c.json({ error: message, code: 'GET_VERSIONS_FAILED' }, 500)
    }
  })
  .get('/:nodeId/versions/:version/diff', requireTeamRole('VIEWER', teamResolvers.fromNodeParam), async (c) => {
    try {
      const nodeId = c.req.param('nodeId')
      const version = parseInt(c.req.param('version'))
      const compareToRaw = c.req.query('compareTo')

      if (isNaN(version)) {
        return c.json({ error: '版本号无效', code: 'INVALID_VERSION' }, 400)
      }

      const compareTo = compareToRaw && compareToRaw !== 'current'
        ? parseInt(compareToRaw)
        : undefined

      const result = await logicNodes.getVersionDiff(nodeId, version, compareTo)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '对比失败'
      return c.json({ error: message, code: 'DIFF_FAILED' }, 400)
    }
  })
  .post('/:nodeId/restore/:version', requireTeamRole('MEMBER', teamResolvers.fromNodeParam), async (c) => {
    try {
      const user = c.get('user')
      const nodeId = c.req.param('nodeId')
      const version = parseInt(c.req.param('version'))

      if (isNaN(version)) {
        return c.json({ error: '版本号无效', code: 'INVALID_VERSION' }, 400)
      }

      const result = await logicNodes.restoreVersion(nodeId, version, user.userId)
      return c.json({ data: result, message: '恢复成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '恢复失败'
      return c.json({ error: message, code: 'RESTORE_FAILED' }, 400)
    }
  })
  .delete('/:nodeId', requireTeamRole('ADMIN', teamResolvers.fromNodeParam), async (c) => {
    try {
      const nodeId = c.req.param('nodeId')
      await logicNodes.delete(nodeId)
      return c.json({ message: '删除成功' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除失败'
      return c.json({ error: message, code: 'DELETE_FAILED' }, 400)
    }
  })
