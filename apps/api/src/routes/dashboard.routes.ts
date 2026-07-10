import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { DashboardService } from '../services/dashboard.service.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireTeamRole, teamResolvers } from '../middleware/rbac.middleware.js'

const dashboard = new DashboardService()

export const dashboardRoutes = new Hono()
  .use('*', authMiddleware)
  .get(
    '/',
    describeRoute({
      tags: ['Dashboard'],
      summary: '获取团队仪表盘汇总（统计 / 评审待办 / 最近活动 / 未读通知）',
      parameters: [{ name: 'teamId', in: 'query', required: false, schema: { type: 'string' } }],
      responses: { 200: { description: '仪表盘汇总数据' } },
    }),
    requireTeamRole('VIEWER', teamResolvers.fromQueryOrDefault('teamId')), async (c) => {
      try {
        const teamId = c.get('teamId')
        const user = c.get('user')
        const result = await dashboard.getSummary(teamId, user.userId)
        return c.json({ data: result })
      } catch (error) {
        const message = error instanceof Error ? error.message : '获取仪表盘数据失败'
        return c.json({ error: message, code: 'GET_DASHBOARD_FAILED' }, 500)
      }
    }
  )
