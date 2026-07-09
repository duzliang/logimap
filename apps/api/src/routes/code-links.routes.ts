import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { CodeLinkQuerySchema } from '@logimap/types'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireTeamRole, teamResolvers } from '../middleware/rbac.middleware.js'
import { CodeLinksService } from '../services/code-links.service.js'

const service = new CodeLinksService()

export const codeLinksRoutes = new Hono()
  .use('*', authMiddleware)
  .get(
    '/',
    requireTeamRole('VIEWER', teamResolvers.fromQuery('teamId')),
    zValidator('query', CodeLinkQuerySchema),
    async (c) => {
      try {
        const { teamId, path, line } = c.req.valid('query')
        const result = await service.findNodesByPath({ teamId, path, line })
        return c.json({ data: result })
      } catch (error) {
        const message = error instanceof Error ? error.message : '代码反向关联查询失败'
        return c.json({ error: message, code: 'CODE_LINKS_FAILED' }, 500)
      }
    }
  )
